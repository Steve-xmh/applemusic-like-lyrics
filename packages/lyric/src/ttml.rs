use std::borrow::Cow;

use crate::LyricLine;

mod read;
mod write;

pub use read::*;
pub use write::*;

#[cfg(feature = "serde")]
use serde::*;

#[derive(Debug, Default, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct TTMLLyric<'a> {
    pub lines: Vec<LyricLine<'a>>,
    pub metadata: Vec<(Cow<'a, str>, Vec<Cow<'a, str>>)>,
}
