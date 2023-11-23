/*********************************************************************
* 警告 WARNING:    本 DES 实现和原 DES 实现不同！
*               仅可用作 QQ Music 的有关加解密操作！
* 本代码原始来自：https://github.com/B-Con/crypto-algorithms/blob/master/des.c
* 根据QQ情况改后：https://github.com/SuJiKiNen/LyricDecoder/blob/master/LyricDecoder/LyricDecoder/QQMusicDES/des.c
* 本改版也进过一定修改以适配 Rust WASM 构建编译
*********************************************************************/

/*********************************************************************
* WARNING:    This implementation of DES is WRONG!
*             Never use this in real cryptography!
*********************************************************************/

/*********************************************************************
* Filename:   des.h
* Author:     Brad Conte (brad AT bradconte.com)
* Copyright:
* Disclaimer: This code is presented "as is" without any guarantees.
* Details:    Defines the API for the corresponding DES implementation.
              Note that encryption and decryption are defined by how
              the key setup is performed, the actual en/de-cryption is
              performed by the same function.
*********************************************************************/

#ifndef DES_H
#define DES_H

/****************************** MACROS ******************************/
#define DES_BLOCK_SIZE 8                // DES operates on 8 bytes at a time

/**************************** DATA TYPES ****************************/
#ifdef RS_PTR_WIDTH_16

  typedef unsigned char   BYTE;             // 8-bit byte
  typedef unsigned long   WORD;             // 32-bit word

#endif // RS_PTR_WIDTH_16

#ifdef RS_PTR_WIDTH_32

  typedef unsigned char   BYTE;             // 8-bit byte
  typedef unsigned int    WORD;             // 32-bit word

#endif // RS_PTR_WIDTH_32

#ifdef RS_PTR_WIDTH_64

  typedef unsigned char   BYTE;             // 8-bit byte
  typedef unsigned int    WORD;             // 32-bit word

#endif // RS_PTR_WIDTH_64

typedef enum {
	DES_ENCRYPT,
	DES_DECRYPT
} DES_MODE;

/*********************** FUNCTION DECLARATIONS **********************/
extern void des_key_setup(const BYTE key[], BYTE schedule[][6], DES_MODE mode);
extern void des_crypt(const BYTE in[], BYTE out[], const BYTE key[][6]);

extern void three_des_key_setup(const BYTE key[], BYTE schedule[][16][6], DES_MODE mode);
extern void three_des_crypt(const BYTE in[], BYTE out[], const BYTE key[][16][6]);

#endif   // DES_H
