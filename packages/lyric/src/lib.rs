#[cfg(feature = "ass")]
pub mod ass;
#[cfg(feature = "eqrc")]
pub mod eqrc;
#[cfg(feature = "eslrc")]
pub mod eslrc;
#[cfg(feature = "lrc")]
pub mod lrc;
#[cfg(feature = "lys")]
pub mod lys;
#[cfg(feature = "qrc")]
pub mod qrc;
#[cfg(feature = "ttml")]
pub mod ttml;
#[cfg(feature = "yrc")]
pub mod yrc;

pub mod utils;
#[cfg(target_arch = "wasm32")]
mod types {
    include!(concat!(env!("OUT_DIR"), "/types.rs"));
}

use std::borrow::Cow;

#[cfg(feature = "serde")]
use serde::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(all(target_arch = "wasm32", feature = "wee_alloc"))]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Debug, Clone, PartialEq, Default)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct LyricWord<'a> {
    pub start_time: u64,
    pub end_time: u64,
    pub word: Cow<'a, str>,
}

#[derive(Debug, Clone, PartialEq, Default)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct LyricLine<'a> {
    pub words: Vec<LyricWord<'a>>,
    #[cfg_attr(feature = "serde", serde(default))]
    pub translated_lyric: Cow<'a, str>,
    #[cfg_attr(feature = "serde", serde(default))]
    pub roman_lyric: Cow<'a, str>,
    #[cfg_attr(feature = "serde", serde(default, rename = "isBG"))]
    pub is_bg: bool,
    #[cfg_attr(feature = "serde", serde(default))]
    pub is_duet: bool,
    #[cfg_attr(feature = "serde", serde(default))]
    pub start_time: u64,
    #[cfg_attr(feature = "serde", serde(default))]
    pub end_time: u64,
}
