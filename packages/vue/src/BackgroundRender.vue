<template>
    <div ref="wrapperRef"></div>
</template>

<script setup lang="ts">
import { BackgroundRender } from "@applemusic-like-lyrics/core";
import { onMounted, onUnmounted, ref, watchEffect } from "vue";
import type { BackgroundRenderProps, BackgroundRenderRef } from ".";

const props = defineProps<BackgroundRenderProps>();
const wrapperRef = ref<HTMLDivElement>();
const bgRenderRef = ref<BackgroundRender>();

onMounted(() => {
    if (wrapperRef.value) {
        bgRenderRef.value = new BackgroundRender();
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
    if (props.albumImageUrl)
        bgRenderRef.value?.setAlbumImage(props.albumImageUrl);
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

defineExpose<BackgroundRenderRef>({
    bgRender: bgRenderRef,
    wrapperEl: wrapperRef,
});

</script>