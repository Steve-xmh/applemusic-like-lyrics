use symphonia::core::{
    meta::{MetadataRevision, StandardTagKey, StandardVisualKey},
    probe::ProbeResult,
};
use tracing::*;

use crate::AudioInfo;

pub fn read_audio_info(format_result: &mut ProbeResult) -> AudioInfo {
    let mut new_audio_info = AudioInfo::default();

    let mut read_rev = |rev: &MetadataRevision| {
        if rev.visuals().len() == 1 {
            let visual = &rev.visuals()[0];
            // trace!("仅有一个视觉图");
            // trace!(" 大小 {}", visual.data.len());
            // trace!(" 媒体类型为 {}", visual.media_type);
            // trace!(" 用途为 {:?}", visual.usage);
            // trace!(" 标签为 {:?}", visual.tags);
            new_audio_info.cover_media_type = visual.media_type.clone();
            new_audio_info.cover = Some(visual.data.to_vec());
        } else {
            for visual in rev.visuals() {
                if visual.usage == Some(StandardVisualKey::FrontCover) {
                    new_audio_info.cover_media_type = visual.media_type.clone();
                    new_audio_info.cover = Some(visual.data.to_vec());
                }
            }
        }
        for tag in rev.tags() {
            // trace!("已读取标签 {}", tag);
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
                Some(StandardTagKey::Comment) => {
                    new_audio_info.comment = tag.value.to_string();
                }
                Some(_) | None => {}
            }
        }
    };

    if let Some(mut metadata) = format_result.metadata.get() {
        while let Some(rev) = metadata.pop() {
            // trace!("已读取音频内容前元数据");
            read_rev(&rev);
        }
        if let Some(rev) = metadata.current() {
            // trace!("已读取音频内容前元数据");
            read_rev(rev);
        }
    }

    let mut metadata = format_result.format.metadata();
    while let Some(rev) = metadata.pop() {
        // trace!("已读取音频内容后元数据");
        read_rev(&rev);
    }
    if let Some(rev) = metadata.current() {
        // trace!("已读取音频内容后元数据");
        read_rev(rev);
    }

    if let Some(track) = format_result.format.default_track() {
        let timebase = track.codec_params.time_base.unwrap_or_default();
        let duration = timebase.calc_time(track.codec_params.n_frames.unwrap_or_default());
        let play_duration = duration.seconds as f64 + duration.frac;
        new_audio_info.duration = play_duration;
    }

    new_audio_info
}
