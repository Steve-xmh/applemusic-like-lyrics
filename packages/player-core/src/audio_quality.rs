use serde::*;
use symphonia::core::{codecs::*, formats::Track, sample::SampleFormat};

#[derive(Serialize, Deserialize, PartialEq, Debug, Default, Clone, TS)]
#[serde(rename_all = "camelCase")]
pub struct AudioQuality {
    pub sample_rate: Option<u32>,
    pub bits_per_coded_sample: Option<u32>,
    pub bits_per_sample: Option<u32>,
    pub channels: Option<u32>,
    pub sample_format: String,
    pub codec: String,
}

impl From<&Track> for AudioQuality {
    fn from(track: &Track) -> Self {
        Self {
            sample_rate: track.codec_params.sample_rate as _,
            bits_per_coded_sample: track.codec_params.bits_per_coded_sample,
            bits_per_sample: track.codec_params.bits_per_sample,
            channels: track.codec_params.channels.map(|x| x.count() as _),
            codec: match track.codec_params.codec {
                CODEC_TYPE_VORBIS => "vorbis",
                CODEC_TYPE_MP1 => "mp1",
                CODEC_TYPE_MP2 => "mp2",
                CODEC_TYPE_MP3 => "mp3",
                CODEC_TYPE_AAC => "aac",
                CODEC_TYPE_OPUS => "opus",
                CODEC_TYPE_FLAC => "flac",
                CODEC_TYPE_ALAC => "alac",
                _ => "unknown",
            }
            .to_string(),
            sample_format: match track.codec_params.sample_format {
                Some(SampleFormat::U8) => "u8",
                Some(SampleFormat::U16) => "u16",
                Some(SampleFormat::U24) => "u24",
                Some(SampleFormat::U32) => "u32",
                Some(SampleFormat::S8) => "i8",
                Some(SampleFormat::S16) => "i16",
                Some(SampleFormat::S24) => "i24",
                Some(SampleFormat::S32) => "i32",
                Some(SampleFormat::F32) => "f32",
                Some(SampleFormat::F64) => "f64",
                _ => "unknown",
            }
            .to_string(),
        }
    }
}
