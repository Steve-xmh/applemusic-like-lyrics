// Symphonia
// Copyright (c) 2019-2022 The Project Symphonia Developers.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

use symphonia_core::conv::{FromSample, IntoSample};
use symphonia_core::sample::Sample;

pub type FastFixedOutResampler<T> = Resampler<T, rubato::FastFixedOut<f32>>;

pub struct Resampler<T, S> {
    resampler: S,
    input: Vec<Vec<f32>>,
    output: Vec<Vec<f32>>,
    interleaved: Vec<T>,
    target_channels: usize,
    frames_len: usize,
}

impl<T, S> Resampler<T, S>
where
    T: Sample + FromSample<f32>,
    S: rubato::Resampler<f32>,
{
    fn resample_inner(&mut self) -> &[T] {
        // Resample.
        let (input_frames, output_frames) = {
            let mut input: arrayvec::ArrayVec<&[f32], 32> = Default::default();

            for channel in self.input.iter() {
                input.push(&channel[..self.frames_len]);
            }
            self.resampler
                .process_into_buffer(&input, &mut self.output, None)
                .unwrap()
        };

        // Remove consumed samples from the input buffer.
        for channel in self.input.iter_mut() {
            channel.drain(0..input_frames);
        }

        // Interleave the planar samples from Rubato.
        // let num_channels = self.output.len();

        self.interleaved
            .resize(self.target_channels * output_frames, T::MID);

        for (i, frame) in self
            .interleaved
            .chunks_exact_mut(self.target_channels)
            .enumerate()
        {
            for (ch, s) in frame[0..self.target_channels].iter_mut().enumerate() {
                *s = self
                    .output
                    .get(ch)
                    .and_then(|ch| ch.get(i).copied())
                    .map(|x| x.into_sample())
                    .unwrap_or(Sample::MID);
            }
        }

        &self.interleaved
    }
}

impl<T> Resampler<T, rubato::FastFixedOut<f32>>
where
    T: Sample + FromSample<f32> + IntoSample<f32> + Send,
{
    pub fn new_fast_fixed(
        src_channels: usize,
        src_rate: usize,
        to_sample_rate: usize,
        to_channels: usize,
        duration: u64,
    ) -> Self {
        let resample_ratio = to_sample_rate as f64 / src_rate as f64;

        let resampler = rubato::FastFixedOut::new(
            resample_ratio,
            2.0,
            rubato::PolynomialDegree::Nearest,
            duration as usize,
            src_channels,
        )
        .unwrap();

        Self::new_inner(resampler, to_channels)
    }
}

impl<T, S> Resampler<T, S>
where
    T: Sample + FromSample<f32> + IntoSample<f32> + Send,
    S: rubato::Resampler<f32>,
{
    fn new_inner(resampler: S, to_channels: usize) -> Self {
        let input = resampler.input_buffer_allocate(false);
        let output = resampler.output_buffer_allocate(true);
        let frames_len = rubato::Resampler::input_frames_next(&resampler);

        Self {
            resampler,
            input,
            output,
            frames_len,
            target_channels: to_channels,
            interleaved: Default::default(),
        }
    }

    /// Resamples a planar/non-interleaved input.
    ///
    /// Returns the resampled samples in an interleaved format.
    pub fn resample<RS: Sample + IntoSample<f32> + Send>(&mut self, channels: usize, input: &[RS]) {
        for i in input.chunks_exact(channels) {
            for (ch, s) in i.iter().copied().enumerate() {
                if let Some(channel) = self.input.get_mut(ch) {
                    channel.push(s.into_sample());
                }
            }
        }
    }

    /// Resample any remaining samples in the resample buffer.
    pub fn flush(&mut self) -> Option<&[T]> {
        if self.input[0].len() < self.frames_len {
            return None;
        }

        Some(self.resample_inner())
    }
}
