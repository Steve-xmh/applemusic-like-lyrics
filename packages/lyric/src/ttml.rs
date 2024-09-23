use std::borrow::Cow;

use crate::{LyricLine, LyricLineOwned};

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

#[derive(Debug, Default, Clone)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct TTMLLyricOwned {
    pub lines: Vec<LyricLineOwned>,
    pub metadata: Vec<(String, Vec<String>)>,
}

impl<'a> From<TTMLLyric<'a>> for TTMLLyricOwned {
    fn from(ttml: TTMLLyric<'a>) -> Self {
        Self {
            lines: ttml.lines.into_iter().map(|x| x.to_owned()).collect(),
            metadata: ttml
                .metadata
                .into_iter()
                .map(|(k, v)| {
                    (
                        k.into_owned(),
                        v.into_iter().map(|x| x.into_owned()).collect(),
                    )
                })
                .collect(),
        }
    }
}

impl TTMLLyricOwned {
    pub fn to_ref(&self) -> TTMLLyric {
        TTMLLyric {
            lines: self.lines.iter().map(|x| x.to_ref()).collect(),
            metadata: self
                .metadata
                .iter()
                .map(|(k, v)| {
                    (
                        k.as_str().into(),
                        v.iter().map(|x| x.as_str().into()).collect(),
                    )
                })
                .collect(),
        }
    }
}
