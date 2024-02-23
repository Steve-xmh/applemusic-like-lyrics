use quick_xml::{
    events::{attributes::AttrError, Event},
    *,
};
use std::{borrow::Cow, collections::HashMap, io::BufRead};
use thiserror::Error;

use crate::LyricWord;

enum CurrentStatus {
    None,
    InP,
    InSpan,
    InSpanInSpan,
    InDiv,
    InBody,
    InHead,
    InTtml,
}

#[derive(Error, Debug)]
pub enum TTMLError {
    #[error("unexpected tt element at {0}")]
    UnexpectedTTElement(usize),
    #[error("unexpected head element at {0}")]
    UnexpectedHeadElement(usize),
    #[error("unexpected body element at {0}")]
    UnexpectedBodyElement(usize),
    #[error("unexpected div element at {0}")]
    UnexpectedDivElement(usize),
    #[error("unexpected p element at {0}")]
    UnexpectedPElement(usize),
    #[error("unexpected span element at {0}")]
    UnexpectedSpanElement(usize),
    #[error("xml attr error: {0}")]
    XmlAttrError(#[from] AttrError),
    #[error("xml error: {0}")]
    XmlError(#[from] quick_xml::Error),
}

#[derive(Debug, Default, Clone)]
pub struct TTMLLyricLine<'a> {
    pub words: Vec<LyricWord<'a>>,
    pub translated_lyric: Option<Cow<'a, str>>,
    pub roman_lyric: Option<Cow<'a, str>>,
    pub is_bg: bool,
    pub is_duet: bool,
    pub start_time: u64,
    pub end_time: u64,
}

#[derive(Debug, Default, Clone)]
pub struct TTMLLyric<'a> {
    pub lines: Vec<TTMLLyricLine<'a>>,
    pub metadata: Vec<(Cow<'a, str>, Vec<Cow<'a, str>>)>,
}

pub fn parse_ttml(data: impl BufRead) -> std::result::Result<(), TTMLError> {
    let mut reader = Reader::from_reader(data);
    let mut buf = Vec::with_capacity(256);
    let mut status = CurrentStatus::None;
    let mut result = TTMLLyric::default();
    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Eof) => break,
            Ok(Event::Start(e)) => {
                let attr_name = e.name();
                println!("start {}", String::from_utf8_lossy(attr_name.as_ref()));
                match attr_name.as_ref() {
                    b"tt" => {
                        if let CurrentStatus::None = status {
                            status = CurrentStatus::InTtml;
                        } else {
                            return Err(TTMLError::UnexpectedTTElement(e.len()));
                        }
                    }
                    b"head" => {
                        if let CurrentStatus::InTtml = status {
                            status = CurrentStatus::InHead;
                        } else {
                            return Err(TTMLError::UnexpectedHeadElement(e.len()));
                        }
                    }
                    b"body" => {
                        if let CurrentStatus::InTtml = status {
                            status = CurrentStatus::InBody;
                        } else {
                            return Err(TTMLError::UnexpectedBodyElement(e.len()));
                        }
                    }
                    b"div" => {
                        if let CurrentStatus::InBody = status {
                            status = CurrentStatus::InDiv;
                        } else {
                            return Err(TTMLError::UnexpectedDivElement(e.len()));
                        }
                    }
                    b"p" => {
                        if let CurrentStatus::InDiv = status {
                            status = CurrentStatus::InP;
                        } else {
                            return Err(TTMLError::UnexpectedPElement(e.len()));
                        }
                    }
                    b"span" => match status {
                        CurrentStatus::InP => {
                            status = CurrentStatus::InSpan;
                        }
                        CurrentStatus::InSpan => {
                            status = CurrentStatus::InSpanInSpan;
                        }
                        _ => return Err(TTMLError::UnexpectedSpanElement(e.len())),
                    },
                    _ => {}
                }
                for attr in e.attributes() {
                    match attr {
                        Ok(a) => {
                            println!(
                                "  attr: {} = {}",
                                String::from_utf8_lossy(a.key.as_ref()),
                                String::from_utf8_lossy(a.value.as_ref())
                            );
                        }
                        Err(err) => return Err(TTMLError::XmlAttrError(err)),
                    }
                }
            }
            Ok(Event::End(e)) => {
                let attr_name = e.name();
                println!("end {}", String::from_utf8_lossy(attr_name.as_ref()));
                match attr_name.as_ref() {
                    b"tt" => {
                        if let CurrentStatus::InTtml = status {
                            status = CurrentStatus::None;
                        } else {
                            return Err(TTMLError::UnexpectedTTElement(e.len()));
                        }
                    }
                    b"head" => {
                        if let CurrentStatus::InHead = status {
                            status = CurrentStatus::InTtml;
                        } else {
                            return Err(TTMLError::UnexpectedTTElement(e.len()));
                        }
                    }
                    b"body" => {
                        if let CurrentStatus::InBody = status {
                            status = CurrentStatus::InTtml;
                        } else {
                            return Err(TTMLError::UnexpectedTTElement(e.len()));
                        }
                    }
                    b"div" => {
                        if let CurrentStatus::InDiv = status {
                            status = CurrentStatus::InBody;
                        } else {
                            return Err(TTMLError::UnexpectedTTElement(e.len()));
                        }
                    }
                    b"p" => {
                        if let CurrentStatus::InP = status {
                            status = CurrentStatus::InDiv;
                        } else {
                            return Err(TTMLError::UnexpectedTTElement(e.len()));
                        }
                    }
                    b"span" => match status {
                        CurrentStatus::InSpan => {
                            status = CurrentStatus::InP;
                        }
                        CurrentStatus::InSpanInSpan => {
                            status = CurrentStatus::InSpan;
                        }
                        _ => return Err(TTMLError::UnexpectedTTElement(e.len())),
                    },
                    _ => {}
                }
                buf.clear();
            }
            Ok(Event::Text(e)) => match e.unescape() {
                Ok(txt) => {
                    println!("  text: {}", txt);
                }
                Err(err) => return Err(TTMLError::XmlError(err)),
            },
            Err(err) => return Err(TTMLError::XmlError(err)),
            _ => (),
        }
    }
    Ok(())
}

#[test]
fn test_ttml() {
    const TEST_TTML: &str = include_str!("../test/test.ttml");
    let _ = dbg!(parse_ttml(TEST_TTML.as_bytes()));
}
