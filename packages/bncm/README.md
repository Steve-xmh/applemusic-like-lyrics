# AMLL for BetterNCM

AMLL 组件的 BetterNCM 插件实现，提供给 NCM 软件的歌词播放页面支持。

<div align=center>

![](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/b9dc5226-e08c-475c-a90d-1d1dbb3e0d70)
![](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/b26631f6-5925-4de9-ba9c-fc4d41bc14da)
![](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/6a36d069-559e-4bce-8904-31a8f8648a0f)
![](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/8049da87-c6ef-4140-b324-e0f78a9c5ba4)
![](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/e9cebc5b-9778-4914-9460-ebdcfa7f1e68)

</div>

## 安装说明

你可以前往本仓库的 Release 下载对应的插件包，也可以通过 BetterNCM 的插件商店安装本插件。

## 开发/构建/打包流程

安装好 `yarn`, `rustc`, `wasm-pack`，克隆本仓库到任意文件夹后在终端输入以下指令即可构建：

```bash
yarn
yarn dev # 开发构建，每次修改保存代码都会自动重载 NCM 软件
yarn build # 发行构建，会压缩代码，不包含 Source Map
```

### 浏览器开发调试

如果需要*更加方便（？）*的开发体验，可以设置 `NCM_COOKIE` 环境变量后使用 `yarn vite dev` 启动开发服务器，即可体验更加舒适的开发环境。

## 鸣谢

- [MicroCBer/BetterNCM](https://github.com/MicroCBer/BetterNCM)
- [Steve-xmh/mrbncm](https://github.com/Steve-xmh/mrbncm)
- [Steve-xmh/mmbncm](https://github.com/Steve-xmh/mmbncm)
- [solstice23/refined-now-playing-netease](https://github.com/solstice23/refined-now-playing-netease)
- [Barba828/color-quantize](https://github.com/Barba828/color-quantize)
