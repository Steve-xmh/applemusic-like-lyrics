import { LyricPlayer } from "@applemusic-like-lyrics/core";
declare const _default: import("vue").DefineComponent<{
    disabled: {
        type: import("vue").PropType<boolean>;
    };
    alignAnchor: {
        type: import("vue").PropType<"top" | "bottom" | "center">;
    };
    alignPosition: {
        type: import("vue").PropType<number>;
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
    bottomLine: {
        type: import("vue").PropType<import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>[]>;
    };
}, {
    lyricPlayer: import("vue").Ref<LyricPlayer | undefined>;
    wrapperEl: import("vue").Ref<HTMLDivElement | undefined>;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    disabled: {
        type: import("vue").PropType<boolean>;
    };
    alignAnchor: {
        type: import("vue").PropType<"top" | "bottom" | "center">;
    };
    alignPosition: {
        type: import("vue").PropType<number>;
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
    bottomLine: {
        type: import("vue").PropType<import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>[]>;
    };
}>>, {}, {}>;
export default _default;
