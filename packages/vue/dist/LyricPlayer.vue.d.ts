import { LyricPlayer, type LyricLineMouseEvent } from "@applemusic-like-lyrics/core";
import type { LyricPlayerProps } from ".";
declare const _default: import("vue").DefineComponent<__VLS_TypePropsToRuntimeProps<LyricPlayerProps>, {
    lyricPlayer: import("vue").Ref<LyricPlayer | undefined>;
    wrapperEl: import("vue").Ref<HTMLDivElement | undefined>;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "line-click": (line: LyricLineMouseEvent) => void;
    "line-contextmenu": (line: LyricLineMouseEvent) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<__VLS_TypePropsToRuntimeProps<LyricPlayerProps>>> & {
    "onLine-click"?: ((line: LyricLineMouseEvent) => any) | undefined;
    "onLine-contextmenu"?: ((line: LyricLineMouseEvent) => any) | undefined;
}, {}, {}>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
