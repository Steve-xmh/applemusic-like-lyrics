#![no_std]
extern crate alloc;

mod utils;

use alloc::{collections::VecDeque, sync::Arc, vec::Vec};

use instant::Instant;
use rustfft::{num_complex::Complex, *};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct AMLLFFT {
    data: VecDeque<f64>,
    fft: Arc<dyn Fft<f64>>,
    buf: Vec<Complex<f64>>,
    fft_size: usize,
    rate: usize,
    last_call_time: Instant,
}

#[wasm_bindgen]
impl AMLLFFT {
    pub fn new(rate: usize) -> AMLLFFT {
        let fft_size = 1024;
        AMLLFFT {
            data: VecDeque::with_capacity(rate),
            fft: FftPlanner::new().plan_fft_forward(fft_size),
            buf: core::iter::repeat(Complex::new(0.0, 0.0))
                .take(fft_size)
                .collect(),
            fft_size,
            rate,
            last_call_time: Instant::now(),
        }
    }

    pub fn push_data(&mut self, data: Vec<i16>) {
        let mut tmp = 0.0;
        for (i, v) in data.into_iter().enumerate() {
            if i % 2 == 0 {
                tmp = v as f64;
            } else {
                tmp = (tmp + v as f64) / 2.0;
                self.data.push_front(tmp);
            }
        }
        self.data.truncate(self.rate);
    }

    pub fn process_fft(&mut self) -> Vec<f64> {
        self.data.truncate(self.fft_size);
        for i in 0..self.buf.len() {
            self.buf[i] = Complex::new(self.data.pop_front().unwrap_or_default(), 1.0);
        }
        self.fft.process(self.buf.as_mut_slice());

        self.last_call_time = Instant::now();
        self.buf.iter().map(|x| x.re.abs()).take(self.buf.len() / 2).collect()
    }
}

impl Default for AMLLFFT {
    fn default() -> Self {
        Self::new(44000)
    }
}
