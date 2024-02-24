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
    pub translated_lyric: Cow<'a, str>,
    pub roman_lyric: Cow<'a, str>,
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

pub fn parse_ttml<'a, 'b: 'a>(data: impl BufRead) -> std::result::Result<TTMLLyric<'a>, TTMLError> {
    let mut reader = Reader::from_reader(data);
    let mut buf: Vec<u8> = Vec::with_capacity(256);
    let mut str_buf = String::with_capacity(256);
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
                            result.lines.push(TTMLLyricLine::default());
                        } else {
                            return Err(TTMLError::UnexpectedPElement(e.len()));
                        }
                    }
                    b"span" => match status {
                        CurrentStatus::InP => {
                            status = CurrentStatus::InSpan;
                            result.lines.last_mut().unwrap().words.push(LyricWord {
                                word: "".into(),
                                start_time: 0,
                                end_time: 0,
                            });
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
                            match a.key.as_ref() {
                                b"begin" => {
                                    if let CurrentStatus::InP = status {
                                        result.lines.last_mut().unwrap().start_time = 0;
                                    }
                                }
                                b"end" => {
                                    if let CurrentStatus::InP = status {
                                        result.lines.last_mut().unwrap().end_time = 0;
                                    }
                                }
                                _ => {}
                            }
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
                            result
                                .lines
                                .last_mut()
                                .unwrap()
                                .words
                                .last_mut()
                                .unwrap()
                                .word = str_buf.clone().into();
                            str_buf.clear();
                        }
                        CurrentStatus::InSpanInSpan => {
                            status = CurrentStatus::InSpan;
                        }
                        _ => return Err(TTMLError::UnexpectedTTElement(e.len())),
                    },
                    _ => {}
                }
            }
            Ok(Event::Text(e)) => match e.unescape() {
                Ok(txt) => {
                    println!("  text: {}", txt);
                    match status {
                        CurrentStatus::InDiv => {
                            result.lines.last_mut().unwrap().words.push(LyricWord {
                                word: txt.to_string().into(),
                                start_time: 0,
                                end_time: 0,
                            });
                        }
                        CurrentStatus::InSpan => {
                            str_buf.push_str(&txt);
                        }
                        _ => {}
                    }
                }
                Err(err) => return Err(TTMLError::XmlError(err)),
            },
            Err(err) => return Err(TTMLError::XmlError(err)),
            _ => (),
        }
        buf.clear();
    }
    Ok(result)
}

#[test]
fn test_ttml() {
    const TEST_TTML: &str = include_str!("../test/test.ttml");
    let t = std::time::Instant::now();
    let _ = dbg!(parse_ttml(TEST_TTML.as_bytes()));
    println!("ttml: {:?}", t.elapsed());
}

use nom::{bytes::complete::*, character::complete::one_of, combinator::*, *};
use std::str::FromStr;
// HH:MM:SS.MS
// or MM:SS.MS
pub fn parse_timestamp(src: &[u8]) -> IResult<&[u8], usize> {
    let (src, hour_or_min) = map_res(take_while1(|c: u8| c.is_ascii_digit()), |s: &[u8]| {
        std::str::from_utf8(s)
            .map_err(|_| nom::Err::Error(nom::error::Error::new(s, nom::error::ErrorKind::Digit)))
            .and_then(|s| {
                usize::from_str(s).map_err(|_| {
                    nom::Err::Error(nom::error::Error::new(
                        s.as_bytes(),
                        nom::error::ErrorKind::Digit,
                    ))
                })
            })
    })(src)?;
    let (src, _) = tag(":")(src)?;
    let (src, min_or_sec) = map_res(take_while1(|c: u8| c.is_ascii_digit()), |s: &[u8]| {
        std::str::from_utf8(s)
            .map_err(|_| nom::Err::Error(nom::error::Error::new(s, nom::error::ErrorKind::Digit)))
            .and_then(|s| {
                usize::from_str(s).map_err(|_| {
                    nom::Err::Error(nom::error::Error::new(
                        s.as_bytes(),
                        nom::error::ErrorKind::Digit,
                    ))
                })
            })
    })(src)?;
    
    if src.is_empty() {
        let time = hour_or_min * 60 * 1000 + min_or_sec * 1000;
        return Ok((src, time));
    }
    
    let (src, dot_or_colon) = one_of(".:")(src)?;

    match dot_or_colon {
        '.' => {
            let min = hour_or_min;
            let sec = min_or_sec;

            let (src, mss) = map_res(take_while1(|c: u8| c.is_ascii_digit()), |s: &[u8]| {
                std::str::from_utf8(s).map_err(|_| {
                    nom::Err::Error(nom::error::Error::new(s, nom::error::ErrorKind::Digit))
                })
            })(src)?;

            let mut ms = usize::from_str(mss).map_err(|_| {
                nom::Err::Error(nom::error::Error::new(src, nom::error::ErrorKind::Digit))
            })?;

            match mss.len() {
                0 => {}
                1 => {
                    ms *= 100;
                }
                2 => {
                    ms *= 10;
                }
                3 => {}
                _ => {
                    return Err(nom::Err::Error(nom::error::Error::new(
                        src,
                        nom::error::ErrorKind::Digit,
                    )))
                }
            }

            let time = min * 60 * 1000 + sec * 1000 + ms;

            Ok((src, time))
        }
        ':' => {
            let hour = hour_or_min;
            let min = min_or_sec;

            let (src, sec) = map_res(take_while1(|c: u8| c.is_ascii_digit()), |s: &[u8]| {
                std::str::from_utf8(s)
                    .map_err(|_| {
                        nom::Err::Error(nom::error::Error::new(s, nom::error::ErrorKind::Digit))
                    })
                    .and_then(|s| {
                        usize::from_str(s).map_err(|_| {
                            nom::Err::Error(nom::error::Error::new(
                                s.as_bytes(),
                                nom::error::ErrorKind::Digit,
                            ))
                        })
                    })
            })(src)?;
            
            let mut ms = 0;
            
            if let Ok((src, _)) = tag::<&str, &[u8], nom::error::Error<_>>(".")(src) {
                let (src, mss) = map_res(take_while1(|c: u8| c.is_ascii_digit()), |s: &[u8]| {
                    std::str::from_utf8(s).map_err(|_| {
                        nom::Err::Error(nom::error::Error::new(s, nom::error::ErrorKind::Digit))
                    })
                })(src)?;
    
                ms = usize::from_str(mss).map_err(|_| {
                    nom::Err::Error(nom::error::Error::new(src, nom::error::ErrorKind::Digit))
                })?;
    
                match mss.len() {
                    0 => {}
                    1 => {
                        ms *= 100;
                    }
                    2 => {
                        ms *= 10;
                    }
                    3 => {}
                    _ => {
                        return Err(nom::Err::Error(nom::error::Error::new(
                            src,
                            nom::error::ErrorKind::Digit,
                        )))
                    }
                }
            }

            let time = hour * 60 * 60 * 1000 + min * 60 * 1000 + sec * 1000 + ms;

            Ok((src, time))
        }
        _ => unreachable!(),
    }
}

#[test]
fn test_timestamp() {
    let t = std::time::Instant::now();
    assert_eq!(
        parse_timestamp("1.123".as_bytes()),
        Ok(("".as_bytes(), 1123))
    );
    assert_eq!(
        parse_timestamp("1.1".as_bytes()),
        Ok(("".as_bytes(), 1100))
    );
    assert_eq!(
        parse_timestamp("1.45".as_bytes()),
        Ok(("".as_bytes(), 1450))
    );
    assert_eq!(
        parse_timestamp("45:12.2".as_bytes()),
        Ok(("".as_bytes(), 2712200))
    );
    assert_eq!(
        parse_timestamp("00:10.254".as_bytes()),
        Ok(("".as_bytes(), 10254))
    );
    assert_eq!(
        parse_timestamp("1:10".as_bytes()),
        Ok(("".as_bytes(), 70000))
    );
    assert_eq!(
        parse_timestamp("1:10:24".as_bytes()),
        Ok(("".as_bytes(), 4224000))
    );
}
