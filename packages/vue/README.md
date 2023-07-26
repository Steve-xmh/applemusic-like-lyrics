# AMLL for Vue

AMLL 组件库的 Vue 绑定，你可以通过此库来更加方便地使用 AMLL 歌词组件。

详情可以访问 [Core 核心组件的 README.md](../core/README.md)。

## 安装

```bash
npm install @applemusic-like-lyrics/vue # 使用 npm
yarn add @applemusic-like-lyrics/vue # 使用 yarn
```

## 使用方式摘要

由于 Vue 组件不方便生成 API 文档，所以还请自行查阅类型定义文件确定用法。

（或者参考 React 绑定，二者属性和引用方式完全一致）

一个测试用途的程序可以在 [./src/test.ts](./src/test.ts) 里找到。

```vue
<tamplate>
    <LyricPlayer enable :lyric-lines="[]" :current-time="0" />
</tamplate>

<script setup lang="ts">
import { LyricPlayer } from "@applemusic-like-lyrics/vue";

</script>
```
