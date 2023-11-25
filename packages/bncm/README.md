# AMLL for BetterNCM

![AMLL-BNCM](https://img.shields.io/badge/BetterNCM-%23f6898d?label=Apple%20Music-like%20Lyrics&labelColor=%23FB5C74)

AMLL 组件的 BetterNCM 插件实现，提供给 NCM 软件的歌词播放页面支持。

![AMLL 歌词组件展示图，歌曲： Leave The Door Open ，TTML 歌词贡献者：Y-CIAO](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/8a6a671f-7d67-4b86-a152-b1d0aa53c24b)

<div align=center>
歌曲： Leave The Door Open
<br/>
TTML 歌词贡献者：Y-CIAO
</div>

![AMLL 歌词组件展示图，歌曲： 限りなく灰色へ ，歌词源自 NCM YRC 逐词歌词](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/3fab0eaf-c1f2-4239-b3ef-9deaa4c550d5)

<div align=center>
歌曲： 限りなく灰色へ
<br/>
歌词源自 NCM YRC 逐词歌词
</div>

![AMLL 歌词组件展示图，歌曲： Sugar ，TTML 歌词贡献者：Y-CIAO](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/1c4fc650-474b-4bf4-9ded-6a73b3d7fe9d)

<div align=center>
歌曲： Sugar
<br/>
TTML 歌词贡献者：Y-CIAO
</div>

![AMLL 歌词组件展示图，歌曲： Idol ，TTML 歌词贡献者：SteveXMH](https://github.com/Steve-xmh/applemusic-like-lyrics/assets/39523898/f6a14ee5-36fd-4529-99fc-1c123864819f)

<div align=center>
歌曲： Idol
<br/>
TTML 歌词贡献者：SteveXMH
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
