# Lyric parser/writer for AMLL

> 警告：此为个人项目，且尚未完成开发，可能仍有大量问题，所以请勿直接用于生产环境！

![AMLL-Lyric](https://img.shields.io/badge/Lyric-%23FB8C84?label=Apple%20Music-like%20Lyrics&labelColor=%23FB5C74)
[![npm](https://img.shields.io/npm/dt/%40applemusic-like-lyrics/lyric)](https://www.npmjs.com/package/@applemusic-like-lyrics/lyric)
[![npm](https://img.shields.io/npm/v/%40applemusic-like-lyrics%2Flyric)](https://www.npmjs.com/package/@applemusic-like-lyrics/lyric)

一个 AMLL 的歌词解析/生成模块，使用 Rust 编写，并通过 `wasm-pack`
构建成 WASM 模块以提供给其他项目使用。

本模块由于只着重于歌词内容，所以会丢弃一切和歌词无关的信息，如需获取一个歌词文件中的详细信息（例如歌手）请考虑使用其他框架。

支持以下歌词格式的解析：
- LyRiC 格式 `.lrc`
- 网易云音乐逐词歌词格式 `.yrc`
- QQ 音乐逐词歌词格式 `.qrc`
- Lyricify Syllable 逐词歌词格式 `.lys`

支持以下歌词格式的导出：
- LyRiC 格式 `.lrc`
- 网易云音乐逐词歌词格式 `.yrc`
- QQ 音乐逐词歌词格式 `.qrc`
- Lyricify Syllable 逐词歌词格式 `.lys`
- ASS 字幕格式 `.ass`

## 与 Core 歌词组件一起使用

在和二者合用的时候，需要注意**两者的歌词行结构并不完全相同**，需要进行诸如（以 LyRiC 举例）下面的方式进行转换方可被歌词组件正确解析：

```typescript
import { parseLrc } from "@applemusic-like-lyrics/lyric";
const lines = parseLrc("[00:00.00]test");
const converted = lines.map((line, i, lines) => ({
    words: [
        {
            word: line.words[0]?.word ?? "",
            startTime: line.words[0]?.startTime ?? 0,
            endTime: lines[i + 1]?.words?.[0]?.startTime ?? Infinity,
        },
    ],
    startTime: line.words[0]?.startTime ?? 0,
    endTime: lines[i + 1]?.words?.[0]?.startTime ?? Infinity,
    translatedLyric: "",
    romanLyric: "",
    isBG: false,
    isDuet: false,
}));
// 此时就可以将 converted 传给 LyricPlayer 了
```

推荐使用 TypeScript，这样可以更方便地查错。

## 构建

```shell
wasm-pack build --target bundler --release --scope applemusic-like-lyrics
```
