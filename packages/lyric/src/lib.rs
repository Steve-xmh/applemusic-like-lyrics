mod ass;
#[cfg(feature = "qrc")]
mod eqrc;
mod eslrc;
mod lrc;
mod lys;
mod qrc;
mod utils;
mod yrc;
mod types {
    include!(concat!(env!("OUT_DIR"), "/types.rs"));
}

use std::borrow::Cow;

use serde::*;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricWord<'a> {
    pub start_time: usize,
    pub end_time: usize,
    pub word: Cow<'a, str>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LyricLine<'a> {
    pub words: Vec<LyricWord<'a>>,
    #[serde(default)]
    pub translated_lyric: String,
    #[serde(default)]
    pub roman_lyric: String,
    #[serde(default, rename = "isBG")]
    pub is_bg: bool,
    #[serde(default)]
    pub is_duet: bool,
}
