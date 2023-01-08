# Apple Music-like Lyrics

一个基于 [BetterNCM](https://github.com/MicroCBer/BetterNCM) 的类 Apple Music 歌词显示插件

![](./assets/demo0.png)
![](./assets/demo1.png)

## 安装说明

你可以前往本仓库的 Release 下载对应的插件包，也可以通过 BetterNCM 的插件商店安装本插件。

请不要将本插件与其它同功能用途的插件混用，**作者不会为其做兼容工作**！以下是不兼容或有功能影响的插件清单：

- [RefinedNowPlaying - 一个美化网易云音乐播放界面的 BetterNCM 插件](https://github.com/solstice23/refined-now-playing-netease)

主题插件作者推荐使用 MoTheme 或 Material You，其它主题插件作者没有使用过，可能需要你做一定的设置调整才能契合主题。

## 开发/构建/打包流程

推荐将本仓库克隆到 BetterNCM 插件目录下的 `plugins_dev` 文件夹内，可以获得自动重载的能力。

```bash
yarn
yarn build:dev # 开发构建，包含 Source Map 方便查错
yarn build # 发行构建，会压缩代码，不包含 Source Map
yarn dist # 在发行构建的基础上打包 .plugin 插件文件
```

## 鸣谢

- [MicroCBer/BetterNCM](https://github.com/MicroCBer/BetterNCM)
- [Barba828/color-quantize](https://github.com/Barba828/color-quantize)
