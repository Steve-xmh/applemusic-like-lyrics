<template>
    <div ref="wrapperRef" v-bind="$attrs"></div>
    <Teleport v-if="playerRef?.getBottomLineElement() && props.bottomLine" :to="playerRef?.getBottomLineElement()" />
</template>

<script setup lang="ts">
import { LyricPlayer, type LyricLineMouseEvent } from "@applemusic-like-lyrics/core";
import { onMounted, onUnmounted, ref, watchEffect } from "vue";
import type { LyricPlayerProps, LyricPlayerEmits, LyricPlayerRef } from ".";

defineOptions({
    inheritAttrs: false,
});

const props = defineProps<LyricPlayerProps>();
const emits = defineEmits<LyricPlayerEmits>();
const wrapperRef = ref<HTMLDivElement>();
const playerRef = ref<LyricPlayer>();

const lineClickHandler = (e: Event) =>
    emits("line-click", e as LyricLineMouseEvent);
const lineContextMenuHandler = (e: Event) =>
    emits("line-contextmenu", e as LyricLineMouseEvent);

onMounted(() => {
    if (wrapperRef.value) {
        playerRef.value = new LyricPlayer();
        wrapperRef.value.appendChild(playerRef.value.getElement());
        playerRef.value.addEventListener("line-click", lineClickHandler);
        playerRef.value.addEventListener("line-contextmenu", lineContextMenuHandler);
    }
});

onUnmounted(() => {
    if (playerRef.value) {
        playerRef.value.removeEventListener("line-click", lineClickHandler);
        playerRef.value.removeEventListener("line-contextmenu", lineContextMenuHandler);
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
    if (props.playing !== undefined) {
        if (props.playing) {
            playerRef.value?.resume();
        } else {
            playerRef.value?.pause();
        }
    } else playerRef.value?.resume();
});

watchEffect(() => {
    if (props.alignAnchor !== undefined)
        playerRef.value?.setAlignAnchor(props.alignAnchor);
});

watchEffect(() => {
    if (props.hidePassedLines !== undefined)
        playerRef.value?.setHidePassedLines(props.hidePassedLines);
});

watchEffect(() => {
    if (props.alignPosition !== undefined)
        playerRef.value?.setAlignPosition(props.alignPosition);
});

watchEffect(() => {
    if (props.enableSpring !== undefined)
        playerRef.value?.setEnableSpring(props.enableSpring);
    else
        playerRef.value?.setEnableSpring(true);
});

watchEffect(() => {
    if (props.enableBlur !== undefined)
        playerRef.value?.setEnableBlur(props.enableBlur);
    else
        playerRef.value?.setEnableBlur(true);
});

watchEffect(() => {
    if (props.enableScale !== undefined)
        playerRef.value?.setEnableScale(props.enableScale);
    else
        playerRef.value?.setEnableScale(true);
});

watchEffect(() => {
    if (props.lyricLines !== undefined)
        playerRef.value?.setLyricLines(props.lyricLines);
});

watchEffect(() => {
    if (props.currentTime !== undefined)
        playerRef.value?.setCurrentTime(props.currentTime);
});

watchEffect(() => {
    if (props.wordFadeWidth !== undefined)
        playerRef.value?.setWordFadeWidth(props.wordFadeWidth);
});

watchEffect(() => {
    if (props.linePosXSpringParams !== undefined)
        playerRef.value?.setLinePosXSpringParams(props.linePosXSpringParams);
});

watchEffect(() => {
    if (props.linePosYSpringParams !== undefined)
        playerRef.value?.setLinePosYSpringParams(props.linePosYSpringParams);
});

watchEffect(() => {
    if (props.lineScaleSpringParams !== undefined)
        playerRef.value?.setLineScaleSpringParams(props.lineScaleSpringParams);
});

defineExpose<LyricPlayerRef>({
    lyricPlayer: playerRef,
    wrapperEl: wrapperRef,
});

</script>