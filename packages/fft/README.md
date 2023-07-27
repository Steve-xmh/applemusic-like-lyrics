# AMLL FFT module

一个用来实现简易音频可视化的模块，使用 Rust 编写，并通过 `wasm-pack`
构建成 WASM 模块以提供给其他项目使用。

至于为什么会有这个模块，是为了给一些没办法直接使用 WebAudio API
的平台上实现音频可视化用的。

## 构建

安装好 `wasm-pack` 后输入以下指令：

```shell
wasm-pack build --scope applemusic-like-lyrics
```
