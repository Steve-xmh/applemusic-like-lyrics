<div align=center>

![](packages/bncm/src/assets/amll-icon.svg)

# Apple Music-like Lyrics

一个基于 Web 技术制作的类 Apple Music 歌词显示组件库，同时支持[ DOM 原生](./packages/core/README.md)、[React ](./packages/react/README.md)和[ Vue ](./packages/react/README.md)绑定，[与各种平台兼容的外置播放器](./packages/player/README.md)也仍在制作当中。

这是你能在前端系里能见到的最像 iPad Apple Music 的播放页面了。

**—— AMLL 生态作品 ——**

[AMLL TTML DB 逐词歌词仓库](https://github.com/Steve-xmh/amll-ttml-db)
/
[AMLL TTML Tool 逐词歌词编辑器](https://github.com/Steve-xmh/amll-ttml-tool)

</div>

## AMLL 生态及源码结构

### 主要模块

- [![AMLL-Core](https://img.shields.io/badge/Core-%233178c6?label=Apple%20Music-like%20Lyrics&labelColor=%23FB5C74)](./packages/core/README.md)：AMLL 核心组件库，以 DOM 原生方式编写，提供歌词显示组件和动态流体背景组件
- [![AMLL-React](https://img.shields.io/badge/React-%23149eca?label=Apple%20Music-like%20Lyrics&labelColor=%23FB5C74)](./packages/react/README.md)：AMLL React 绑定，提供 React 组件形式的歌词显示组件和动态流体背景组件
- [![AMLL-Vue](https://img.shields.io/badge/Vue-%2342d392?label=Apple%20Music-like%20Lyrics&labelColor=%23FB5C74)](./packages/vue/README.md)：AMLL Vue 绑定，提供 Vue 组件形式的歌词显示组件和动态流体背景组件
- [![AMLL-Lyric](https://img.shields.io/badge/Lyric-%23FB8C84?label=Apple%20Music-like%20Lyrics&labelColor=%23FB5C74)](./packages/lyric/README.md)：AMLL 歌词解析模块，提供对 LyRiC, YRC, QRC, Lyricify Syllable 各种歌词格式的解析和序列化支持

### 外部工具

- [AMLL Player](./packages/player/README.md)：AMLL 外置播放器，提供独立的外置歌词播放器，并通过独有的 WebSocket 协议与 AMLL 任意实现了协议的程序进行通信展示歌词
- [AMLL TTML Tool](https://github.com/Steve-xmh/amll-ttml-tool)： AMLL TTML 编辑器，提供对 TTML 格式歌词的编辑支持，并使用 AMLL Core 进行实时预览
- [AMLL TTML Database](https://github.com/Steve-xmh/amll-ttml-db)： AMLL TTML 数据库，提供 TTML 歌词存储仓库，以让各类歌词播放器可以使用由社区制作的 TTML 逐词歌词

## 歌词组件截图展示

![AMLL 歌词组件展示图，歌曲： Jake Miller, HOYO-MiX - WHITE NIGHT (不眠之夜) ，TTML 歌词贡献者： @Xionghaizi001](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/776939ff-24af-4bd0-aba6-262e903ab816)

<div align=center>
歌曲： Jake Miller, HOYO-MiX - WHITE NIGHT (不眠之夜)
<br/>
TTML 歌词贡献者： @Xionghaizi001
</div>

![AMLL 歌词组件展示图，歌曲： Maroon 5 - Sugar ，TTML 歌词贡献者： @Y-CIAO](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/02ecc483-565e-45d3-8ff7-06f65cfd4c0d)

<div align=center>
歌曲： Maroon 5 - Sugar
<br/>
TTML 歌词贡献者： @Y-CIAO
</div>

![AMLL 歌词组件展示图，歌曲： Taylor Swift, Brendon Urie - ME! ，TTML 歌词贡献者： @Xionghaizi001](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/b19bf9b4-352b-4459-9293-439836cea231)

<div align=center>
歌曲： Taylor Swift, Brendon Urie - ME!
<br/>
TTML 歌词贡献者： @Xionghaizi001
</div>

## 浏览器兼容性提醒

本组件框架最低要求使用以下浏览器或更新版本：
- Chromuim/Edge 91+
- Firefox 100+
- Safari 9.1+

完整呈现组件所有效果需要使用以下浏览器或更新版本：
- Chromuim 120+
- Firefox 100+
- Safari 15.4+

参考链接：
- [https://caniuse.com/mdn-css_properties_mask-image](https://caniuse.com/mdn-css_properties_mask-image)
- [https://caniuse.com/mdn-css_properties_mix-blend-mode_plus-lighter](https://caniuse.com/mdn-css_properties_mix-blend-mode_plus-lighter)

## 性能配置参考

经过性能基准测试，五年内的主流 CPU 处理器均可以以 30FPS 正常带动歌词组件，但如果需要 60FPS 流畅运行，请确保 CPU 频率至少为 3.0Ghz 或以上。如果需要 144FPS 以上流畅运行，请确保 CPU 频率至少为 4.2Ghz 或以上。

GPU 性能在以下状况下能够以预期尺寸下满 60 帧运行：
- `1080p (1920x1080)`: NVIDIA GTX 10 系列及以上
- `2160p (3840x2160)`: NVIDIA RTX 2070 及以上

## 代码贡献

由于作者精力有限，已经无力处理大家使用过程中产生的问题，所以关闭了 Issues 板块，但是欢迎任何对代码有积极贡献的 Pull Request！

## 开发/构建/打包流程

安装好 `yarn`, `rustc`, `wasm-pack`，克隆本仓库到任意文件夹后在终端输入以下指令即可构建：

```bash
yarn
yarn lerna run build:dev --scope "@applemusic-like-lyrics/*" # 开发构建
yarn lerna run build --scope "@applemusic-like-lyrics/*" # 发行构建
```

## 鸣谢

- [woshizja/sound-processor](https://github.com/woshizja/sound-processor)
- [MovingParts - Gradient Meshes in SceneKit](https://movingparts.io/gradient-meshes)
- 还有很多被 AMLL 使用的框架和库，非常感谢！

### 特别鸣谢

<div align="center">
<image src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg"></image>
<div>
感谢 <a href=https://jb.gg/OpenSourceSupport>JetBrains</a> 系列开发工具为 AMLL 项目提供的大力支持
</div>
</div>
