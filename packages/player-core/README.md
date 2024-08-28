# AMLL Player Core

AMLL Player 的播放后端库，通过几个简单的函数即可与播放线程交互并播放音乐。

- 支持基本播放列表操作，歌曲的播放进度控制，切歌等操作
- 可在 Rust 端扩展新的歌曲源，只要实现了 `MediaSource` 特质即可
- 支持实时生成 FFT 音频可视化信息，并返回给宿主程序以支持某些效果
- 足够低的后台占用（内存占用几乎不高于 30 MB，CPU 占用包括 FFT 数据生成也可以几乎忽略不计）
- 预计支持播放状态传输协议：[SMTC (Windows)](https://learn.microsoft.com/en-us/uwp/api/windows.media.systemmediatransportcontrols?view=winrt-26100) / [MPRIS (Linux/XDG)](https://www.freedesktop.org/wiki/Specifications/mpris-spec/) / [MPNowPlayingInfoCenter (macOS)](https://developer.apple.com/documentation/mediaplayer/mpnowplayinginfocenter)
