use symphonia::core::{
    meta::{StandardTagKey, StandardVisualKey},
    probe::ProbeResult,
};
use tracing::*;

use crate::AudioInfo;

pub fn read_audio_info(format_result: &mut ProbeResult) -> AudioInfo {
    let mut new_audio_info = AudioInfo::default();
    let metadata = format_result.format.metadata();

    if let Some(rev) = metadata.current() {
        if rev.visuals().len() == 1 {
            let visual = &rev.visuals()[0];
            new_audio_info.cover_media_type = visual.media_type.clone();
            new_audio_info.cover = Some(visual.data.to_vec());
        }
        for visual in rev.visuals() {
            if visual.usage == Some(StandardVisualKey::FrontCover) {
                new_audio_info.cover_media_type = visual.media_type.clone();
                new_audio_info.cover = Some(visual.data.to_vec());
            }
        }
        for tag in rev.tags() {
            match tag.std_key {
                Some(StandardTagKey::TrackTitle) => {
                    new_audio_info.name = tag.value.to_string();
                }
                Some(StandardTagKey::Artist) => {
                    new_audio_info.artist = tag.value.to_string();
                }
                Some(StandardTagKey::Album) => {
                    new_audio_info.album = tag.value.to_string();
                }
                Some(StandardTagKey::Lyrics) => {
                    new_audio_info.lyric = tag.value.to_string();
                }
                Some(_) | None => {}
            }
        }
    }

    if let Some(track) = format_result.format.default_track() {
        let timebase = track.codec_params.time_base.unwrap_or_default();
        let duration = timebase.calc_time(track.codec_params.n_frames.unwrap_or_default());
        let play_duration = duration.seconds as f64 + duration.frac;
        new_audio_info.duration = play_duration;
    }

    new_audio_info
}
