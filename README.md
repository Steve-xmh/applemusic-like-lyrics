<div align=center>

![](packages/bncm/src/assets/amll-icon.svg)

# Apple Music-like Lyrics

一个基于 Web 技术制作的类 Apple Music 歌词显示组件库，同时支持[ DOM 原生](./packages/core/README.md)、[React ](./packages/react/README.md)和[ Vue ](./packages/react/README.md)绑定，并提供针对[ NCM 插件加载器的插件支持](./packages/bncm/README.md)。

前身是基于 NCM 插件加载器 [BetterNCM](https://github.com/MicroCBer/BetterNCM)/[MRBNCM](https://github.com/Steve-xmh/mrbncm)/[MMBNCM](https://github.com/Steve-xmh/mmbncm) 实现的的类 Apple Music 歌词显示插件。

这是你能在前端系里能见到的最像 iPad Apple Music 的播放页面了。

**—— AMLL 生态作品 ——**

[AMLL TTML DB 逐词歌词仓库](https://github.com/Steve-xmh/amll-ttml-db)
/
[AMLL TTML Tool 逐词歌词编辑器](https://github.com/Steve-xmh/amll-ttml-tool)

</div>

## 性能配置参考

经过性能基准测试，五年内的主流 CPU 处理器均可以以 30FPS 正常带动歌词页面，但如果需要 60FPS 流畅运行，请确保 CPU 频率至少为 4.2Ghz 或以上。

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

- [MicroCBer/BetterNCM](https://github.com/MicroCBer/BetterNCM)
- [Steve-xmh/mrbncm](https://github.com/Steve-xmh/mrbncm)
- [Steve-xmh/mmbncm](https://github.com/Steve-xmh/mmbncm)
- [solstice23/refined-now-playing-netease](https://github.com/solstice23/refined-now-playing-netease)
- [Barba828/color-quantize](https://github.com/Barba828/color-quantize)
- [woshizja/sound-processor](https://github.com/woshizja/sound-processor)

### 特别鸣谢

<div align="center">
<image src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg"></image>
<div>
感谢 <a href=https://jb.gg/OpenSourceSupport>JetBrains</a> 系列开发工具为 AMLL 项目提供的大力支持
</div>
</div>
