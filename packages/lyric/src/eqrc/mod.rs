//! 针对加密的 QRC （此处定义为 Encrypted QRC (EQRC)）格式的解密模块
//!
//! 参考自 <https://github.com/WXRIW/Lyricify-Lyrics-Helper/blob/07d495c3b36ef24dbe5bc29c261e77bd16ff15d0/Lyricify.Lyrics.Helper/Decrypter/Qrc/Helper.cs#L49>
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;
pub(super) mod qdec;

const DEC_KEY: &[u8; 24] = b"!@#)(*$%123ZXC!@!@#)(NHL";

fn decode_hex(s: &str) -> Vec<u8> {
    if s.len() % 2 == 0 {
        (0..s.len())
            .step_by(2)
            .filter_map(|i| s.get(i..i + 2).map(|sub| u8::from_str_radix(sub, 16).ok()))
            .flatten()
            .collect()
    } else {
        vec![]
    }
}

pub fn decrypt_qrc_raw(data: &mut [u8]) -> String {
    let mut c = qdec::TripleQDES::new(DEC_KEY, true);

    for chunk in data.chunks_exact_mut(8) {
        c.crypt_inplace(chunk);
    }

    let decompressed = miniz_oxide::inflate::decompress_to_vec_zlib(data).unwrap_or_default();

    String::from_utf8_lossy(&decompressed).to_string()
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(js_name = "decryptQrcHex", skip_typescript)]
pub fn decrypt_qrc_hex_js(hex_data: &str) -> String {
    decrypt_qrc_hex(hex_data)
}

pub fn decrypt_qrc_hex(hex_data: &str) -> String {
    let mut hex_data = decode_hex(hex_data);
    decrypt_qrc_raw(&mut hex_data)
}
