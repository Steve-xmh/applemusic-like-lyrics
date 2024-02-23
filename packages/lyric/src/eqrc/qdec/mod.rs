#[allow(unused)]
#[allow(clippy::upper_case_acronyms)]
mod bindgen;

pub struct TripleQDES {
    schdule: [[[u8; 6]; 16]; 3],
}

impl TripleQDES {
    pub fn new(key: &[u8], is_decrypt: bool) -> Self {
        let mut schdule = [[[0u8; 6]; 16]; 3];
        unsafe {
            bindgen::three_des_key_setup(
                key.as_ptr(),
                schdule.as_mut_ptr(),
                if is_decrypt {
                    bindgen::DES_MODE::DES_DECRYPT
                } else {
                    bindgen::DES_MODE::DES_ENCRYPT
                },
            );
        }
        Self { schdule }
    }

    pub fn crypt_inplace(&mut self, block: &mut [u8]) {
        debug_assert_eq!(block.len(), 8);
        let mut tmp = [0u8; 8];
        unsafe {
            bindgen::three_des_crypt(block.as_ptr(), tmp.as_mut_ptr(), self.schdule.as_mut_ptr());
        }
        block.copy_from_slice(&tmp);
    }
}
