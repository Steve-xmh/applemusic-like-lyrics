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

#[cfg(feature = "ffmpeg-next")]
pub fn read_audio_info_ffmpeg(input: impl AsRef<std::path::Path> + std::fmt::Debug) -> AudioInfo {
    let mut new_audio_info = AudioInfo::default();
    let mut has_audio = false;

    if let Ok(mut ictx) = ffmpeg_next::format::input(&input) {
        for (key, value) in ictx.metadata().iter() {
            info!("媒体元数据 {key} = {value}");
            match key {
                "title" => {
                    new_audio_info.name = value.to_string();
                }
                "TITLE" => {
                    new_audio_info.name = value
                        .split(";")
                        .map(String::from)
                        .next()
                        .unwrap_or_default();
                }
                "album" => {
                    new_audio_info.album = value.to_string();
                }
                "ALBUM" => {
                    new_audio_info.album = value
                        .split(";")
                        .map(String::from)
                        .next()
                        .unwrap_or_default();
                }
                "artist" => {
                    new_audio_info.artist = value.to_string();
                }
                "ARTIST" => {
                    new_audio_info.artist = value
                        .split(";")
                        .map(String::from)
                        .next()
                        .unwrap_or_default();
                }
                "lyric" => {
                    new_audio_info.lyric = value.to_string();
                }
                "LYRIC" => {
                    new_audio_info.lyric = value
                        .split(";")
                        .map(String::from)
                        .next()
                        .unwrap_or_default();
                }
                _ => {}
            }
        }

        for (st, p) in ictx.packets() {
            if let Ok(codec) =
                ffmpeg_next::codec::context::Context::from_parameters(st.parameters())
            {
                let codec_name = codec.id().name();
                match codec.medium() {
                    ffmpeg_next::media::Type::Audio => {
                        if has_audio {
                            continue;
                        }
                        has_audio = true;
                        info!("使用的编码器: {codec_name}");
                        let time_base = st.time_base();
                        let duration = st.duration();

                        new_audio_info.duration = duration as f64 * f64::from(time_base);
                    }
                    ffmpeg_next::media::Type::Video => {
                        info!("使用的编码器: {codec_name}");
                        new_audio_info.cover = p.data().map(|x| x.to_vec());
                        new_audio_info.cover_media_type = match codec_name {
                            "mjpeg" => "image/jpeg",
                            other => {
                                warn!("遇到未知的图像/视频解码器：{other}");
                                "image"
                            }
                        }
                        .to_string();
                    }
                    _ => {}
                }
            }
        }
    }

    new_audio_info
}
