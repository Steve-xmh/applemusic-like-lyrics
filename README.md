# Apple Music-like Lyrics

一个基于 [BetterNCM](https://github.com/MicroCBer/BetterNCM) 的类 Apple Music 歌词显示插件

![](./assets/demo0.png)
![](./assets/demo1.png)

## 开发/构建/打包流程

推荐将本仓库克隆到 BetterNCM 插件目录下的 `plugins_dev` 文件夹内，可以获得自动重载的能力。

```bash
yarn
yarn build:dev # 开发构建，包含 Source Map 方便查错
yarn build # 发行构建，会压缩代码，不包含 Source Map
yarn dist # 在发行构建的基础上打包 .plugin 插件文件
```
