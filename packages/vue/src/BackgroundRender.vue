<template>
    <div ref="wrapperRef"></div>
</template>

<script setup lang="ts">
import { AbstractBaseRenderer, BackgroundRender, EplorRenderer } from "@applemusic-like-lyrics/core";
import { onMounted, onUnmounted, ref, watchEffect } from "vue";
import type { BackgroundRenderProps, BackgroundRenderRef } from ".";

const props = defineProps<BackgroundRenderProps>();
const wrapperRef = ref<HTMLDivElement>();
const bgRenderRef = ref<AbstractBaseRenderer>();

onMounted(() => {
    if (wrapperRef.value) {
        bgRenderRef.value = BackgroundRender.new(props.renderer ?? EplorRenderer);
        const el = bgRenderRef.value.getElement();
        el.style.width = "100%";
        el.style.height = "100%";
        wrapperRef.value.appendChild(el);
    }
});

onUnmounted(() => {
    if (bgRenderRef.value) {
        bgRenderRef.value.dispose();
    }
});

watchEffect(() => {
    if (props.album)
        bgRenderRef.value?.setAlbum(props.album, props.albumIsVideo);
});

watchEffect(() => {
    if (props.fps)
        bgRenderRef.value?.setFPS(props.fps);
});

watchEffect(() => {
    if (props.playing)
        bgRenderRef.value?.pause();
    else
        bgRenderRef.value?.resume();
});

watchEffect(() => {
    if (props.flowSpeed)
        bgRenderRef.value?.setFlowSpeed(props.flowSpeed);
});

watchEffect(() => {
    if (props.renderScale)
        bgRenderRef.value?.setRenderScale(props.renderScale);
});

watchEffect(() => {
    if (props.lowFreqVolume)
        bgRenderRef.value?.setLowFreqVolume(props.lowFreqVolume);
});

watchEffect(() => {
    if (props.hasLyric !== undefined)
        bgRenderRef.value?.setHasLyric(props.hasLyric ?? true);
});

defineExpose<BackgroundRenderRef>({
    bgRender: bgRenderRef,
    wrapperEl: wrapperRef,
});

</script>