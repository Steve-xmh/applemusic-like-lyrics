<template>
    <BackgroundRender :album="state.albumUrl" :album-is-video="state.albumIsVideo"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" />
    <LyricPlayer enable :lyric-lines="state.lyricLines" :current-time="state.currentTime"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; mix-blend-mode: plus-lighter;" />

    <div
        style="position: absolute; right: 0; bottom: 0; background-color: #0004; margin: 1rem; padding: 1rem; border-radius: 0.5rem; color: white; display: flex; flex-direction: column; gap: 0.5rem;">
        <div>AMLL Vue 绑定调试页面</div>
        <div>为了减少依赖，没有过多的调试设置。</div>
        <div>更加详尽的调试可以直接使用 Core 模块调试。</div>
        <button type="button" @click="onClickOpenAudio">
            加载音乐
        </button>
        <button type="button" @click="onClickOpenAlbumImage">
            加载专辑背景资源（图片/视频）
        </button>
        <button type="button" @click="onClickOpenTTMLLyric">
            加载歌词
        </button>
        <audio controls ref="audioRef" @play="onPlay" :src="state.audioUrl" preload="auto" />
    </div>
</template>

<script setup lang="ts">
import BackgroundRender from "./BackgroundRender.vue";
import LyricPlayer from "./LyricPlayer.vue";
import { reactive, ref } from "vue";
import { parseTTML } from "@applemusic-like-lyrics/ttml";
import type { LyricLine } from "@applemusic-like-lyrics/core";

const audioRef = ref<HTMLAudioElement>();
const state = reactive({
    audioUrl: "",
    albumUrl: "",
    albumIsVideo: false,
    currentTime: 0,
    lyricLines: [] as LyricLine[],
});

function onPlay() {
    const onFrame = () => {
        if (audioRef.value && !audioRef.value.paused) {
            state.currentTime = (audioRef.value.currentTime * 1000) | 0;
            requestAnimationFrame(onFrame);
        }
    };
    requestAnimationFrame(onFrame);
}

function onClickOpenAudio() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
            if (state.audioUrl.trim().length > 0) {
                URL.revokeObjectURL(state.audioUrl);
            }
            state.audioUrl = URL.createObjectURL(file);
            state.albumIsVideo = file.type.startsWith("video/");
        }
    };
    input.click();
}

function onClickOpenAlbumImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
            if (state.albumUrl.trim().length > 0) {
                URL.revokeObjectURL(state.albumUrl);
            }
            state.albumUrl = URL.createObjectURL(file);
        }
    };
    input.click();
}

function onClickOpenTTMLLyric() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ttml,text/*";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
            const text = await file.text();
            state.lyricLines = parseTTML(text).lyricLines;
        }
    };
    input.click();
}

</script>
