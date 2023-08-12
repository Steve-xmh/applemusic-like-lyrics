<template>
    <div ref="wrapperRef"></div>
    <Teleport v-if="playerRef?.getBottomLineElement() && props.bottomLine" :to="playerRef?.getBottomLineElement()" />
</template>

<script setup lang="ts">
import { LyricPlayer } from "@applemusic-like-lyrics/core";
import { onMounted, onUnmounted, ref, watchEffect, toRaw } from "vue";
import type { LyricPlayerProps, LyricPlayerRef } from ".";

const props = defineProps<LyricPlayerProps>();
const wrapperRef = ref<HTMLDivElement>();
const playerRef = ref<LyricPlayer>();

onMounted(() => {
    if (wrapperRef.value) {
        playerRef.value = new LyricPlayer();
        wrapperRef.value.appendChild(playerRef.value.getElement());
    }
});

onUnmounted(() => {
    if (playerRef.value) {
        playerRef.value.dispose();
    }
});

watchEffect((onCleanup) => {
    if (!props.disabled) {
        let canceled = false;
        let lastTime = -1;
        const onFrame = (time: number) => {
            if (canceled) return;
            if (lastTime === -1) {
                lastTime = time;
            }
            playerRef.value?.update(time - lastTime);
            lastTime = time;
            requestAnimationFrame(onFrame);
        };
        requestAnimationFrame(onFrame);
        onCleanup(() => {
            canceled = true;
        });
    }
});

watchEffect(() => {
    if (props.alignAnchor)
        playerRef.value?.setAlignAnchor(props.alignAnchor);
});

watchEffect(() => {
    if (props.enableSpring)
        playerRef.value?.setEnableSpring(props.enableSpring);
});

watchEffect(() => {
    if (props.enableBlur)
        playerRef.value?.setEnableBlur(props.enableBlur);
});

watchEffect(() => {
    if (props.lyricLines)
        playerRef.value?.setLyricLines(props.lyricLines);
});

watchEffect(() => {
    if (props.currentTime)
        playerRef.value?.setCurrentTime(props.currentTime);
});

watchEffect(() => {
    if (props.linePosXSpringParams)
        playerRef.value?.setLinePosXSpringParams(props.linePosXSpringParams);
});

watchEffect(() => {
    if (props.linePosYSpringParams)
        playerRef.value?.setLinePosYSpringParams(props.linePosYSpringParams);
});

watchEffect(() => {
    if (props.lineScaleSpringParams)
        playerRef.value?.setLineScaleSpringParams(props.lineScaleSpringParams);
});

defineExpose<LyricPlayerRef>({
    lyricPlayer: playerRef,
    wrapperEl: wrapperRef,
});

</script>