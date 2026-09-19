# AMLL Core

[English](./README.md) / 简体中文

> 警告：此为个人项目，且尚未完成开发，可能仍有大量问题，所以请勿直接用于生产环境！

![AMLL-Core](https://img.shields.io/badge/Core-%233178c6?label=Apple%20Music-like%20Lyrics&labelColor=%23FB5C74)
[![npm](https://img.shields.io/npm/dt/%40applemusic-like-lyrics/core)](https://www.npmjs.com/package/@applemusic-like-lyrics/core)
[![npm](https://img.shields.io/npm/v/%40applemusic-like-lyrics%2Fcore)](https://www.npmjs.com/package/@applemusic-like-lyrics/core)

AMLL 的纯 JS 核心组件框架，包括歌词显示组件和背景组件等其它可以复用的组件。

此处的东西都是 UI 框架无关的，所以可以间接在各种动态页面框架下引用。

或者如果你需要使用组件绑定的话，这里有 [React 绑定版本](../react/README.md) 和 [Vue 绑定版本](../vue/README.md)

## 特性

- 纯前端渲染的歌词展示与背景渲染
- 动态逐字歌词、翻译与音译显示
- 支持多行、对唱与背景行
- 可通过 CSS 变量自定义颜色与部分表现

## 安装

安装使用的依赖（如果以下列出的依赖包没有安装的话需要自行安装）：
```bash
npm install @pixi/app @pixi/core @pixi/display @pixi/filter-blur @pixi/filter-bulge-pinch @pixi/filter-color-matrix @pixi/sprite # 使用 npm
yarn add @pixi/app @pixi/core @pixi/display @pixi/filter-blur @pixi/filter-bulge-pinch @pixi/filter-color-matrix @pixi/sprite # 使用 yarn
```

安装本体框架：
```bash
npm install @applemusic-like-lyrics/core # 使用 npm
yarn add @applemusic-like-lyrics/core # 使用 yarn
```

## 使用方式摘要

详细的 API 文档请参考 [AMLL Docs](https://amll.dev/reference/core.html)。


```typescript
import { LyricPlayer } from "@applemusic-like-lyrics/core";
import "@applemusic-like-lyrics/core/style.css"; // 导入需要的样式

const player = new LyricPlayer(); // 创建歌词播放组件
document.body.appendChild(player.getElement()); // 将组件的元素添加到页面
player.setLyricLines([]) // 设置歌词
player.setCurrentTime(0) // 设定当前播放时间（需要逐帧调用）
player.update(0) // 更新歌词组件动画（需要逐帧调用）
```

每次通过 `LyricPlayer.setLyricLines` 设置的歌词是一个 `LyricLine[]` 参数，具体可以参考 [./src/interfaces.ts](./src/interfaces.ts) 中的代码。

## 数据结构

歌词的输入结构为 `LyricLine[]`，其中每行包含：

- `words`: 逐字歌词数组，每个单词包含 `startTime` / `endTime` / `word`，并可选包含 `romanWord`、`ruby`、`obscene` 等字段
- `translatedLyric`: 翻译行文本
- `romanLyric`: 音译行文本
- `startTime` / `endTime`: 行级时间戳
- `isBG` / `isDuet`: 背景行与对唱行标记

## 样式定制

主要样式由 `@applemusic-like-lyrics/core/style.css` 提供，常用自定义方式为覆写 CSS 变量，例如：

```css
.amll-lyric-player {
  --amll-lp-color: #ffffff;
  --amll-lp-bg-color: rgba(0, 0, 0, 0.35);
}
```

广色域屏幕上 `--amll-lp-color-p3` 的优先级高于 `--amll-lp-color`，可以给能显示 Display P3 的屏幕单独指定一个更艳的歌词色。

## 输出色彩空间

背景渲染器写的是 WebGL 绘制缓冲，而绘制缓冲只能声明成 `srgb` 或 `display-p3`。所以这里的上限是 **广色域**，不是亮度上的 HDR：`display-p3` 拓宽的是色域，每个通道仍然封顶在 1.0。

色彩空间默认自动选择：显示设备报 `color-gamut: p3` 且绘制缓冲认这个色彩空间时用 `display-p3`，否则一律 `srgb`。不支持的设备上渲染结果与改动前逐字节一致。

```typescript
import {
  BackgroundRender,
  MeshGradientRenderer,
  getOutputColorSpaceSupport,
  setBackgroundColorSpacePreference,
} from "@applemusic-like-lyrics/core";

// 必须在渲染器构造之前调用：绘制缓冲的色彩空间只能在创建上下文时声明
setBackgroundColorSpacePreference("auto"); // 也可以是 "srgb" / "display-p3"

const background = BackgroundRender.new(MeshGradientRenderer);
background.getColorSpace(); // 实际写出的色彩空间，"srgb" | "display-p3"

getOutputColorSpaceSupport();
// { wideGamutDisplay, hdrDisplay, wideGamutDrawingBuffer }
```

`MeshGradientRenderer` 与 `IsolationRenderer` 支持 `display-p3`。`PixiRenderer` 一律报 `srgb`：它的内部纹理与滤镜缓冲都按 sRGB 处理，把绘制缓冲声明成 P3 只会把这些数值当成 P3 重新解释，整体偏色。

`hdrDisplay` 只是设备能力播报。显示设备支持广色域时，渲染器会额外在 Display P3 色域内做一次饱和度扩张，让原本被 sRGB 边界削平的颜色重新显出来。

## 开发与构建

```bash
pnpm --filter @applemusic-like-lyrics/core dev
pnpm --filter @applemusic-like-lyrics/core build
```
