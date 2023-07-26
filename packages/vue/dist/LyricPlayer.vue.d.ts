import { LyricPlayer } from "@applemusic-like-lyrics/core";
declare const _default: import("vue").DefineComponent<{
    enable: {
        type: import("vue").PropType<boolean>;
    };
    alignAnchor: {
        type: import("vue").PropType<number | "top" | "bottom">;
    };
    enableSpring: {
        type: import("vue").PropType<boolean>;
    };
    enableBlur: {
        type: import("vue").PropType<boolean>;
    };
    lyricLines: {
        type: import("vue").PropType<import("@applemusic-like-lyrics/core").LyricLine[]>;
    };
    currentTime: {
        type: import("vue").PropType<number>;
    };
    linePosXSpringParams: {
        type: import("vue").PropType<Partial<import("@applemusic-like-lyrics/core/dist/utils/spring").SpringParams>>;
    };
    linePosYSpringParams: {
        type: import("vue").PropType<Partial<import("@applemusic-like-lyrics/core/dist/utils/spring").SpringParams>>;
    };
    lineScaleSpringParams: {
        type: import("vue").PropType<Partial<import("@applemusic-like-lyrics/core/dist/utils/spring").SpringParams>>;
    };
}, {
    lyricPlayer: import("vue").Ref<LyricPlayer | undefined>;
    wrapperEl: import("vue").Ref<HTMLDivElement | undefined>;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    enable: {
        type: import("vue").PropType<boolean>;
    };
    alignAnchor: {
        type: import("vue").PropType<number | "top" | "bottom">;
    };
    enableSpring: {
        type: import("vue").PropType<boolean>;
    };
    enableBlur: {
        type: import("vue").PropType<boolean>;
    };
    lyricLines: {
        type: import("vue").PropType<import("@applemusic-like-lyrics/core").LyricLine[]>;
    };
    currentTime: {
        type: import("vue").PropType<number>;
    };
    linePosXSpringParams: {
        type: import("vue").PropType<Partial<import("@applemusic-like-lyrics/core/dist/utils/spring").SpringParams>>;
    };
    linePosYSpringParams: {
        type: import("vue").PropType<Partial<import("@applemusic-like-lyrics/core/dist/utils/spring").SpringParams>>;
    };
    lineScaleSpringParams: {
        type: import("vue").PropType<Partial<import("@applemusic-like-lyrics/core/dist/utils/spring").SpringParams>>;
    };
}>>, {}, {}>;
export default _default;
