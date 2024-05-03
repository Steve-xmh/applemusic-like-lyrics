use instant::Instant;
use std::{cell::Cell, collections::VecDeque};

use spectrum_analyzer::*;
use symphonia_core::conv::{FromSample, IntoSample};
use symphonia_core::sample::Sample;
use wasm_bindgen::prelude::*;

use super::resampler::FastFixedOutResampler;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn warn(s: &str);
}

macro_rules! eprintln {
    ($($t:tt)*) => (warn(&format_args!($($t)*).to_string()))
}

/// 一个接收音频 PCM 数据并转换成频谱的伪播放结构
/// 该结构会将传入的音频数据转换为单通道音频数据，然后进行频谱分析
#[wasm_bindgen]
pub struct FFTPlayer {
    last_fft_time: Instant,
    rate: usize,
    channels: usize,
    result_buf: [f32; 2048],
    pcm_queue: VecDeque<f32>,
    fft_duration: usize,
    resampler: Option<FastFixedOutResampler<f32>>,
    freq_range: Cell<(f32, f32)>,
}

// numpy.interp()
fn vec_interp(src: &[f32], dst: &mut [f32]) {
    if src.is_empty() {
        dst.fill(0.0);
        return;
    }
    if dst.is_empty() {
        return;
    }
    if src.len() == dst.len() {
        dst.copy_from_slice(src);
        return;
    }
    let src_len = src.len();
    let dst_len = dst.len();
    let src_step = src_len as f32 / dst_len as f32;
    let mut src_idx = 0.0;
    for dst in dst.iter_mut() {
        let src_idx_int = src_idx as usize;
        let src_idx_frac = src_idx - src_idx_int as f32;
        let src_idx_next = src_idx + src_step;
        let src_idx_next_int = src_idx_next as usize;
        let src_idx_next_frac = src_idx_next - src_idx_next_int as f32;
        let src_idx_next_frac_inv = 1.0 - src_idx_next_frac;
        let src_idx_frac_inv = 1.0 - src_idx_frac;
        let v = if src_idx_next_int < src_len {
            src[src_idx_int] * src_idx_frac_inv * src_idx_next_frac_inv
                + src[src_idx_next_int] * src_idx_frac * src_idx_next_frac_inv
        } else {
            src[src_idx_int] * src_idx_frac_inv
        };
        *dst = v;
        src_idx += src_step;
    }
}

impl Default for FFTPlayer {
    fn default() -> Self {
        Self::new()
    }
}

impl FFTPlayer {
    pub fn new() -> Self {
        Self {
            last_fft_time: Instant::now(),
            result_buf: [0.0; 2048],
            pcm_queue: VecDeque::with_capacity(4096),
            fft_duration: 0,
            resampler: None,
            freq_range: (80.0, 2000.0).into(),
            rate: 0,
            channels: 0,
        }
    }

    pub fn has_data(&self) -> bool {
        !self.pcm_queue.is_empty()
    }

    pub fn clear(&mut self) {
        self.pcm_queue.clear();
    }

    pub fn set_freq_range(&self, start_freq: f32, end_freq: f32) {
        self.freq_range.set((start_freq, end_freq));
    }

    pub fn read(&mut self, buf: &mut [f32]) -> bool {
        if self.pcm_queue.len() < 2048 {
            self.last_fft_time = Instant::now();
            return false;
        }

        let (start_freq, end_freq) = self.freq_range.get();

        let mut fft_buf = [0.0; 2048];
        self.pcm_queue
            .iter()
            .take(2048)
            .enumerate()
            .for_each(|(i, v)| {
                fft_buf[i] = *v;
            });

        let fft_buf = windows::hamming_window(&fft_buf);

        match samples_fft_to_spectrum(
            &fft_buf,
            44100,
            FrequencyLimit::Range(start_freq, end_freq),
            Some(&scaling::divide_by_N_sqrt),
        ) {
            Ok(spec) => {
                let result_buf_len = self.result_buf.len() as f32;
                let freq_min = spec.min_fr().val();
                let freq_max = spec.max_fr().val();
                let freq_range = freq_max - freq_min;
                self.result_buf.iter_mut().enumerate().for_each(|(i, v)| {
                    let freq = i as f32 / result_buf_len * freq_range + freq_min;
                    let freq = freq.clamp(freq_min, freq_max);
                    *v += spec.freq_val_exact(freq).val();
                    *v /= 2.0;
                });
                vec_interp(&self.result_buf, buf);

                let elapsed = self.last_fft_time.elapsed();
                let elapsed_sec = elapsed.as_secs_f64();
                self.last_fft_time = Instant::now();

                let cut_len = (elapsed_sec * 44100.0) as usize;
                for _ in 0..cut_len {
                    self.pcm_queue.pop_front();
                }
                self.pcm_queue.truncate(2048 * 4);
                true
            }
            Err(e) => {
                eprintln!("FFT error: {:?}", e);
                false
            }
        }
    }

    /// 将解码后的音频数据压入播放器
    /// 务必在添加数据后及时通过 `read` 方法读取频谱数据
    pub fn push_data<T: Sample + FromSample<f32> + IntoSample<f32> + Send>(
        &mut self,
        rate: usize,
        channels: usize,
        decoded: &[T],
    ) {
        if decoded.is_empty() {
            return;
        }

        let should_reset_fft = self.resampler.is_none()
            || self.fft_duration < decoded.len()
            || self.channels != channels
            || self.rate != rate;

        if should_reset_fft {
            self.fft_duration = self.fft_duration.max(decoded.len());
            self.channels = channels;
            self.rate = rate;

            let resampler = FastFixedOutResampler::new_fast_fixed(
                channels,
                rate,
                44100,
                1,
                self.fft_duration as _,
            );

            self.resampler = Some(resampler);

            self.pcm_queue.clear();
        }

        let rsp = self.resampler.as_mut().unwrap();

        rsp.resample(channels, decoded);

        while let Some(buf) = rsp.flush() {
            for v in buf.iter() {
                self.pcm_queue.push_back(*v);
            }
        }
    }
}

#[wasm_bindgen]
impl FFTPlayer {
    #[wasm_bindgen(constructor)]
    pub fn new_js() -> Self {
        Self::new()
    }

    #[wasm_bindgen(js_name = "hasData")]
    pub fn has_data_js(&self) -> bool {
        self.has_data()
    }

    /// 将解码后的音频数据压入播放器
    /// 务必在添加数据后及时通过 `read` 方法读取频谱数据
    #[wasm_bindgen(js_name = "pushDataI8")]
    pub fn push_data_i8_js(&mut self, rate: usize, channels: usize, decoded: &[i8]) {
        self.push_data(rate, channels, decoded);
    }

    /// 将解码后的音频数据压入播放器
    /// 务必在添加数据后及时通过 `read` 方法读取频谱数据
    #[wasm_bindgen(js_name = "pushDataU8")]
    pub fn push_data_u8_js(&mut self, rate: usize, channels: usize, decoded: &[u8]) {
        self.push_data(rate, channels, decoded);
    }

    /// 将解码后的音频数据压入播放器
    /// 务必在添加数据后及时通过 `read` 方法读取频谱数据
    #[wasm_bindgen(js_name = "pushDataI16")]
    pub fn push_data_i16_js(&mut self, rate: usize, channels: usize, decoded: &[i16]) {
        self.push_data(rate, channels, decoded);
    }

    /// 将解码后的音频数据压入播放器
    /// 务必在添加数据后及时通过 `read` 方法读取频谱数据
    #[wasm_bindgen(js_name = "pushDataU16")]
    pub fn push_data_u16_js(&mut self, rate: usize, channels: usize, decoded: &[u16]) {
        self.push_data(rate, channels, decoded);
    }

    /// 将解码后的音频数据压入播放器
    /// 务必在添加数据后及时通过 `read` 方法读取频谱数据
    #[wasm_bindgen(js_name = "pushDataF32")]
    pub fn push_data_f32_js(&mut self, rate: usize, channels: usize, decoded: &[f32]) {
        self.push_data(rate, channels, decoded);
    }

    /// 将解码后的音频数据压入播放器
    /// 务必在添加数据后及时通过 `read` 方法读取频谱数据
    #[wasm_bindgen(js_name = "pushDataF64")]
    pub fn push_data_f64_js(&mut self, rate: usize, channels: usize, decoded: &[f64]) {
        self.push_data(rate, channels, decoded);
    }

    /// 读取频谱数据
    #[wasm_bindgen(js_name = "read")]
    pub fn read_js(&mut self, buf: &mut [f32]) -> bool {
        self.read(buf)
    }
}
