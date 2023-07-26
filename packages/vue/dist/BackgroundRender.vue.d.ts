import { BackgroundRender } from "@applemusic-like-lyrics/core";
declare const _default: import("vue").DefineComponent<{
    albumImageUrl: {
        type: import("vue").PropType<string>;
    };
    fps: {
        type: import("vue").PropType<number>;
    };
    playing: {
        type: import("vue").PropType<boolean>;
    };
    flowSpeed: {
        type: import("vue").PropType<number>;
    };
    renderScale: {
        type: import("vue").PropType<number>;
    };
}, {
    bgRender: import("vue").Ref<BackgroundRender | undefined>;
    wrapperEl: import("vue").Ref<HTMLDivElement | undefined>;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    albumImageUrl: {
        type: import("vue").PropType<string>;
    };
    fps: {
        type: import("vue").PropType<number>;
    };
    playing: {
        type: import("vue").PropType<boolean>;
    };
    flowSpeed: {
        type: import("vue").PropType<number>;
    };
    renderScale: {
        type: import("vue").PropType<number>;
    };
}>>, {}, {}>;
export default _default;
