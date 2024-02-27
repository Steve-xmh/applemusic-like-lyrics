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
    #[error("xml error on parsing attr timestamp at {0}")]
    XmlTimeStampError(usize),
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
                // println!("start {}", String::from_utf8_lossy(attr_name.as_ref()));
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
                            // println!(
                            //     "  attr: {} = {}",
                            //     String::from_utf8_lossy(a.key.as_ref()),
                            //     String::from_utf8_lossy(a.value.as_ref())
                            // );
                            match a.key.as_ref() {
                                b"begin" => {
                                    if let CurrentStatus::InP = status {
                                        if let Ok((_, time)) = parse_timestamp(a.value.as_bytes()) {
                                            result.lines.last_mut().unwrap().start_time = time as _;
                                        } else {
                                            return Err(TTMLError::XmlTimeStampError(e.len()));
                                        }
                                    } else if let CurrentStatus::InSpan = status {
                                        if let Ok((_, time)) = parse_timestamp(a.value.as_bytes()) {
                                            result
                                                .lines
                                                .last_mut()
                                                .unwrap()
                                                .words
                                                .last_mut()
                                                .unwrap()
                                                .start_time = time as _;
                                        } else {
                                            return Err(TTMLError::XmlTimeStampError(e.len()));
                                        }
                                    }
                                }
                                b"end" => {
                                    if let CurrentStatus::InP = status {
                                        if let Ok((_, time)) = parse_timestamp(a.value.as_bytes()) {
                                            result.lines.last_mut().unwrap().end_time = time as _;
                                        } else {
                                            return Err(TTMLError::XmlTimeStampError(e.len()));
                                        }
                                    } else if let CurrentStatus::InSpan = status {
                                        if let Ok((_, time)) = parse_timestamp(a.value.as_bytes()) {
                                            result
                                                .lines
                                                .last_mut()
                                                .unwrap()
                                                .words
                                                .last_mut()
                                                .unwrap()
                                                .end_time = time as _;
                                        } else {
                                            return Err(TTMLError::XmlTimeStampError(e.len()));
                                        }
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
                // println!("end {}", String::from_utf8_lossy(attr_name.as_ref()));
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
                    // println!("  text: {:?}", txt);
                    match status {
                        CurrentStatus::InP => {
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
    let r = parse_ttml(TEST_TTML.as_bytes());
    let t = t.elapsed();
    println!("ttml: {:#?}", r);
    println!("ttml: {:?}", t);
}

use nom::{bytes::complete::*, combinator::*, sequence::tuple, *};
use std::str::FromStr;

pub fn parse_hour(input: &[u8]) -> IResult<&[u8], u64> {
    let (input, result) = take_while_m_n(2, 3, |x: u8| x.is_dec_digit())(input)?;
    let result = u64::from_str(std::str::from_utf8(result).unwrap()).unwrap();
    Ok((input, result))
}

pub fn parse_minutes_or_seconds(input: &[u8]) -> IResult<&[u8], u64> {
    let (input, result) = take_while_m_n(1, 2, |x: u8| x.is_dec_digit())(input)?;
    let result = u64::from_str(std::str::from_utf8(result).unwrap()).unwrap();
    Ok((input, result))
}

pub fn parse_fraction(input: &[u8]) -> IResult<&[u8], u64> {
    let (input, _) = tag(b".")(input)?;
    let (input, result) = take_while1(|x: u8| x.is_dec_digit())(input)?;
    let frac_str = std::str::from_utf8(result).unwrap();
    let result = match frac_str.len() {
        0 => unreachable!(),
        1 => u64::from_str(frac_str).unwrap() * 100,
        2 => u64::from_str(frac_str).unwrap() * 10,
        3 => u64::from_str(frac_str).unwrap(),
        _ => u64::from_str(&frac_str[0..3]).unwrap(),
    };
    Ok((input, result))
}

// HH:MM:SS.MS
// or MM:SS.MS
pub fn parse_timestamp(input: &[u8]) -> IResult<&[u8], u64> {
    match tuple((
        parse_hour,
        tag(b":"),
        parse_minutes_or_seconds,
        tag(b":"),
        parse_minutes_or_seconds,
        opt(parse_fraction),
        eof,
    ))(input)
    {
        Ok((input, result)) => {
            let time = result.0 * 60 * 60 * 1000 + result.2 * 60 * 1000 + result.4 * 1000;

            if let Some(frac) = result.5 {
                Ok((input, time + frac))
            } else {
                Ok((input, time))
            }
        }
        Err(_) => match tuple((
            parse_minutes_or_seconds,
            tag(b":"),
            parse_minutes_or_seconds,
            opt(parse_fraction),
            eof,
        ))(input)
        {
            Ok((input, result)) => {
                let time = result.0 * 60 * 1000 + result.2 * 1000;
                if let Some(frac) = result.3 {
                    Ok((input, time + frac))
                } else {
                    Ok((input, time))
                }
            }
            Err(_) => match tuple((parse_minutes_or_seconds, opt(parse_fraction), eof))(input) {
                Ok((input, result)) => {
                    let time = result.0 * 1000;
                    if let Some(frac) = result.1 {
                        Ok((input, time + frac))
                    } else {
                        Ok((input, time))
                    }
                }
                Err(err) => Err(err),
            },
        },
    }
}

#[test]
fn test_timestamp() {
    assert_eq!(
        parse_timestamp("00:00.088".as_bytes()),
        Ok(("".as_bytes(), 88))
    );
    assert_eq!(
        parse_timestamp("00:45:12.2".as_bytes()),
        Ok(("".as_bytes(), 2712200))
    );
    assert_eq!(
        parse_timestamp("00:00:10.254".as_bytes()),
        Ok(("".as_bytes(), 10254))
    );
    assert_eq!(
        parse_timestamp("00:01:10".as_bytes()),
        Ok(("".as_bytes(), 70000))
    );
    assert_eq!(
        parse_timestamp("01:10:24".as_bytes()),
        Ok(("".as_bytes(), 4224000))
    );
}
