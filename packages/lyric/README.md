# Lyric parser/writer for AMLL

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

## 构建

```shell
wasm-pack build --target bundler --release --scope applemusic-like-lyrics
```
