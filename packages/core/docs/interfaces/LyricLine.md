[@applemusic-like-lyrics/core](../README.md) / [Exports](../modules.md) / LyricLine

# Interface: LyricLine

一行歌词，存储多个单词

## Table of contents

### Properties

- [endTime](LyricLine.md#endtime)
- [isBG](LyricLine.md#isbg)
- [isDuet](LyricLine.md#isduet)
- [romanLyric](LyricLine.md#romanlyric)
- [startTime](LyricLine.md#starttime)
- [translatedLyric](LyricLine.md#translatedlyric)
- [words](LyricLine.md#words)

## Properties

### endTime

• **endTime**: `number`

句子的结束时间

#### Defined in

[packages/core/src/interfaces.ts:49](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/interfaces.ts#L49)

___

### isBG

• **isBG**: `boolean`

该行是否为背景歌词行

#### Defined in

[packages/core/src/interfaces.ts:51](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/interfaces.ts#L51)

___

### isDuet

• **isDuet**: `boolean`

该行是否为对唱歌词行（即歌词行靠右对齐）

#### Defined in

[packages/core/src/interfaces.ts:53](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/interfaces.ts#L53)

___

### romanLyric

• **romanLyric**: `string`

#### Defined in

[packages/core/src/interfaces.ts:45](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/interfaces.ts#L45)

___

### startTime

• **startTime**: `number`

句子的起始时间

#### Defined in

[packages/core/src/interfaces.ts:47](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/interfaces.ts#L47)

___

### translatedLyric

• **translatedLyric**: `string`

#### Defined in

[packages/core/src/interfaces.ts:44](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/interfaces.ts#L44)

___

### words

• **words**: [`LyricWord`](LyricWord.md)[]

该行的所有单词
如果是 LyRiC 等只能表达一行歌词的格式，这里就只会有一个单词

#### Defined in

[packages/core/src/interfaces.ts:43](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/interfaces.ts#L43)
