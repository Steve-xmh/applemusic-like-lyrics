# AMLL for BetterNCM

AMLL 组件的 BetterNCM 插件实现，提供给 NCM 软件的歌词播放页面支持。

## 安装说明

你可以前往本仓库的 Release 下载对应的插件包，也可以通过 BetterNCM 的插件商店安装本插件。

## 开发/构建/打包流程

安装好 `yarn`, `rustc`, `wasm-pack`，克隆本仓库到任意文件夹后在终端输入以下指令即可构建：

```bash
yarn
yarn dev # 开发构建，每次修改保存代码都会自动重载 NCM 软件
yarn build # 发行构建，会压缩代码，不包含 Source Map
```

## 鸣谢

- [MicroCBer/BetterNCM](https://github.com/MicroCBer/BetterNCM)
- [Steve-xmh/mrbncm](https://github.com/Steve-xmh/mrbncm)
- [Steve-xmh/mmbncm](https://github.com/Steve-xmh/mmbncm)
- [solstice23/refined-now-playing-netease](https://github.com/solstice23/refined-now-playing-netease)
- [Barba828/color-quantize](https://github.com/Barba828/color-quantize)
