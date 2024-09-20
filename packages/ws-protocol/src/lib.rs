use std::io::Cursor;

use binrw::prelude::*;
use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

use strings::NullString;

mod strings;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(all(target_arch = "wasm32", feature = "wee_alloc"))]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[binrw]
#[brw(little)]
#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Artist {
    pub id: NullString,
    pub name: NullString,
}

#[binrw]
#[brw(little)]
#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LyricWord {
    pub start_time: u32,
    pub end_time: u32,
    pub word: NullString,
}

#[binrw]
#[brw(little)]
#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LyricLine {
    #[bw(try_calc = u32::try_from(words.len()))]
    size: u32,
    #[br(count = size)]
    pub words: Vec<LyricWord>,
    #[serde(default)]
    pub translated_lyric: NullString,
    #[serde(default)]
    pub roman_lyric: NullString,
    #[serde(skip)]
    #[bw(calc = *is_bg as u8 | ((*is_duet as u8) << 1))]
    flag: u8,
    #[serde(default, rename = "isBG")]
    #[br(calc = flag & 0b01 != 0)]
    #[bw(ignore)]
    pub is_bg: bool,
    #[serde(default)]
    #[br(calc = flag & 0b10 != 0)]
    #[bw(ignore)]
    pub is_duet: bool,
}

/// 信息主体
#[binrw]
#[brw(little)]
#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase", tag = "type", content = "value")]
pub enum Body {
    #[brw(magic(0u16))]
    Ping,
    #[brw(magic(1u16))]
    Pong,
    #[brw(magic(2u16))]
    SetMusicId {
        id: NullString,
        name: NullString,
        duration: u64,
    },
    #[brw(magic(3u16))]
    SetMusicAlbum { id: NullString, name: NullString },
    #[serde(rename_all = "camelCase")]
    #[brw(magic(4u16))]
    SetMusicAlbumCoverImageURL { img_url: NullString },
    #[brw(magic(5u16))]
    SetMusicAlbumCoverImageData {
        #[bw(try_calc = u32::try_from(data.len()))]
        size: u32,
        #[br(count = size)]
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
    },
    #[brw(magic(6u16))]
    SetMusicArtists {
        #[bw(try_calc = u32::try_from(artists.len()))]
        size: u32,
        #[br(count = size)]
        artists: Vec<Artist>,
    },
    #[brw(magic(7u16))]
    OnLoadProgress { progress: f64 },
    #[brw(magic(8u16))]
    OnPlayProgress { progress: f64 },
    #[brw(magic(9u16))]
    OnPaused,
    #[brw(magic(10u16))]
    OnResumed,
    #[brw(magic(11u16))]
    SetPlayProgress { progress: f64 },
    #[brw(magic(12u16))]
    OnAudioData {
        #[bw(try_calc = u32::try_from(data.len()))]
        size: u32,
        #[br(count = size)]
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
    },
    #[brw(magic(13u16))]
    SetLyric {
        #[bw(try_calc = u32::try_from(data.len()))]
        size: u32,
        #[br(count = size)]
        data: Vec<LyricLine>,
    },
    #[brw(magic(14u16))]
    Pause,
    #[brw(magic(15u16))]
    Resume,
    #[brw(magic(16u16))]
    ForwardSong,
    #[brw(magic(17u16))]
    BackwardSong,
    #[brw(magic(18u16))]
    SetVolume { volume: f64 },
}

pub fn parse_body(body: &[u8]) -> anyhow::Result<Body> {
    Ok(Body::read(&mut Cursor::new(body))?)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(js_name = "parseBody")]
pub fn parse_body_js(body: &[u8]) -> Result<JsValue, String> {
    match parse_body(body) {
        Ok(body) => match serde_wasm_bindgen::to_value(&body) {
            Ok(body) => Ok(body),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}

pub fn to_body(body: &Body) -> anyhow::Result<Vec<u8>> {
    let mut cursor = Cursor::new(Vec::with_capacity(4096));
    body.write(&mut cursor)?;
    Ok(cursor.into_inner())
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(js_name = "toBody")]
pub fn to_body_js(body: JsValue) -> Result<Box<[u8]>, String> {
    match serde_wasm_bindgen::from_value(body) {
        Ok(body) => match to_body(&body) {
            Ok(data) => Ok(data.into_boxed_slice()),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
/// When the `console_error_panic_hook` feature is enabled, we can call the
/// `set_panic_hook` function at least once during initialization, and then
/// we will get better error messages if our code ever panics.
///
/// For more details see
/// https://github.com/rustwasm/console_error_panic_hook#readme
pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
