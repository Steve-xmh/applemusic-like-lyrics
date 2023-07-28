import { LyricPlayer as CoreLyricPlayer, type LyricLine, type spring } from "@applemusic-like-lyrics/core";
import { type HTMLProps } from "react";
/**
 * 歌词播放组件的属性
 */
export interface LyricPlayerProps {
    /**
     * 是否禁用歌词播放组件，默认为 `false`，歌词组件启用后将会开始逐帧更新歌词的动画效果，并对传入的其他参数变更做出反馈。
     *
     * 如果禁用了歌词组件动画，你也可以通过引用取得原始渲染组件实例，手动逐帧调用其 `update` 函数来更新动画效果。
     */
    disabled?: boolean;
    /**
     * 设置歌词行的对齐方式，如果为 `undefined` 则默认为 `top`
     *
     * - 设置成 `top` 的话歌词将会向组件顶部对齐
     * - 设置成 `bottom` 的话歌词将会向组件底部对齐
     * - 设置成 [0.0-1.0] 之间任意数字的话则会根据当前组件高度从顶部向下位移为对齐位置垂直居中对齐
     */
    alignAnchor?: "top" | "bottom" | number;
    /**
     * 设置是否使用物理弹簧算法实现歌词动画效果，默认启用
     *
     * 如果启用，则会通过弹簧算法实时处理歌词位置，但是需要性能足够强劲的电脑方可流畅运行
     *
     * 如果不启用，则会回退到基于 `transition` 的过渡效果，对低性能的机器比较友好，但是效果会比较单一
     */
    enableSpring?: boolean;
    /**
     * 设置是否启用歌词行的模糊效果，默认为 `true`
     */
    enableBlur?: boolean;
    /**
     * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
     */
    lyricLines?: LyricLine[];
    /**
     * 设置当前播放进度，单位为毫秒且**必须是整数**，此时将会更新内部的歌词进度信息
     * 内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好
     */
    currentTime?: number;
    /**
     * 设置所有歌词行在横坐标上的弹簧属性，包括重量、弹力和阻力。
     *
     * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
     */
    linePosXSpringParams?: Partial<spring.SpringParams>;
    /**
     * 设置所有歌词行在​纵坐标上的弹簧属性，包括重量、弹力和阻力。
     *
     * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
     */
    linePosYSpringParams?: Partial<spring.SpringParams>;
    /**
     * 设置所有歌词行在​缩放大小上的弹簧属性，包括重量、弹力和阻力。
     *
     * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
     */
    lineScaleSpringParams?: Partial<spring.SpringParams>;
}
/**
 * 歌词播放组件的引用
 */
export interface LyricPlayerRef {
    /**
     * 歌词播放实例
     */
    lyricPlayer?: CoreLyricPlayer;
    /**
     * 将歌词播放实例的元素包裹起来的 DIV 元素实例
     */
    wrapperEl: HTMLDivElement | null;
}
/**
 * 歌词播放组件，本框架的核心组件
 *
 * 尽可能贴切 Apple Music for iPad 的歌词效果设计，且做了力所能及的优化措施
 */
export declare const LyricPlayer: import("react").ForwardRefExoticComponent<Pick<HTMLProps<HTMLDivElement> & LyricPlayerProps, "accept" | "acceptCharset" | "action" | "allowFullScreen" | "allowTransparency" | "alt" | "as" | "async" | "autoComplete" | "autoFocus" | "autoPlay" | "capture" | "cellPadding" | "cellSpacing" | "charSet" | "challenge" | "checked" | "cite" | "classID" | "cols" | "colSpan" | "content" | "controls" | "coords" | "crossOrigin" | "data" | "dateTime" | "default" | "defer" | "disabled" | "download" | "encType" | "form" | "formAction" | "formEncType" | "formMethod" | "formNoValidate" | "formTarget" | "frameBorder" | "headers" | "height" | "high" | "href" | "hrefLang" | "htmlFor" | "httpEquiv" | "integrity" | "keyParams" | "keyType" | "kind" | "label" | "list" | "loop" | "low" | "manifest" | "marginHeight" | "marginWidth" | "max" | "maxLength" | "media" | "mediaGroup" | "method" | "min" | "minLength" | "multiple" | "muted" | "name" | "noValidate" | "open" | "optimum" | "pattern" | "placeholder" | "playsInline" | "poster" | "preload" | "readOnly" | "rel" | "required" | "reversed" | "rows" | "rowSpan" | "sandbox" | "scope" | "scoped" | "scrolling" | "seamless" | "selected" | "shape" | "size" | "sizes" | "span" | "src" | "srcDoc" | "srcLang" | "srcSet" | "start" | "step" | "summary" | "target" | "type" | "useMap" | "value" | "width" | "wmode" | "wrap" | "defaultChecked" | "defaultValue" | "suppressContentEditableWarning" | "suppressHydrationWarning" | "accessKey" | "className" | "contentEditable" | "contextMenu" | "dir" | "draggable" | "hidden" | "id" | "lang" | "nonce" | "slot" | "spellCheck" | "style" | "tabIndex" | "title" | "translate" | "radioGroup" | "role" | "about" | "datatype" | "inlist" | "prefix" | "property" | "resource" | "typeof" | "vocab" | "autoCapitalize" | "autoCorrect" | "autoSave" | "color" | "itemProp" | "itemScope" | "itemType" | "itemID" | "itemRef" | "results" | "security" | "unselectable" | "inputMode" | "is" | "aria-activedescendant" | "aria-atomic" | "aria-autocomplete" | "aria-busy" | "aria-checked" | "aria-colcount" | "aria-colindex" | "aria-colspan" | "aria-controls" | "aria-current" | "aria-describedby" | "aria-details" | "aria-disabled" | "aria-dropeffect" | "aria-errormessage" | "aria-expanded" | "aria-flowto" | "aria-grabbed" | "aria-haspopup" | "aria-hidden" | "aria-invalid" | "aria-keyshortcuts" | "aria-label" | "aria-labelledby" | "aria-level" | "aria-live" | "aria-modal" | "aria-multiline" | "aria-multiselectable" | "aria-orientation" | "aria-owns" | "aria-placeholder" | "aria-posinset" | "aria-pressed" | "aria-readonly" | "aria-relevant" | "aria-required" | "aria-roledescription" | "aria-rowcount" | "aria-rowindex" | "aria-rowspan" | "aria-selected" | "aria-setsize" | "aria-sort" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "children" | "dangerouslySetInnerHTML" | "onCopy" | "onCopyCapture" | "onCut" | "onCutCapture" | "onPaste" | "onPasteCapture" | "onCompositionEnd" | "onCompositionEndCapture" | "onCompositionStart" | "onCompositionStartCapture" | "onCompositionUpdate" | "onCompositionUpdateCapture" | "onFocus" | "onFocusCapture" | "onBlur" | "onBlurCapture" | "onChange" | "onChangeCapture" | "onBeforeInput" | "onBeforeInputCapture" | "onInput" | "onInputCapture" | "onReset" | "onResetCapture" | "onSubmit" | "onSubmitCapture" | "onInvalid" | "onInvalidCapture" | "onLoad" | "onLoadCapture" | "onError" | "onErrorCapture" | "onKeyDown" | "onKeyDownCapture" | "onKeyPress" | "onKeyPressCapture" | "onKeyUp" | "onKeyUpCapture" | "onAbort" | "onAbortCapture" | "onCanPlay" | "onCanPlayCapture" | "onCanPlayThrough" | "onCanPlayThroughCapture" | "onDurationChange" | "onDurationChangeCapture" | "onEmptied" | "onEmptiedCapture" | "onEncrypted" | "onEncryptedCapture" | "onEnded" | "onEndedCapture" | "onLoadedData" | "onLoadedDataCapture" | "onLoadedMetadata" | "onLoadedMetadataCapture" | "onLoadStart" | "onLoadStartCapture" | "onPause" | "onPauseCapture" | "onPlay" | "onPlayCapture" | "onPlaying" | "onPlayingCapture" | "onProgress" | "onProgressCapture" | "onRateChange" | "onRateChangeCapture" | "onResize" | "onResizeCapture" | "onSeeked" | "onSeekedCapture" | "onSeeking" | "onSeekingCapture" | "onStalled" | "onStalledCapture" | "onSuspend" | "onSuspendCapture" | "onTimeUpdate" | "onTimeUpdateCapture" | "onVolumeChange" | "onVolumeChangeCapture" | "onWaiting" | "onWaitingCapture" | "onAuxClick" | "onAuxClickCapture" | "onClick" | "onClickCapture" | "onContextMenu" | "onContextMenuCapture" | "onDoubleClick" | "onDoubleClickCapture" | "onDrag" | "onDragCapture" | "onDragEnd" | "onDragEndCapture" | "onDragEnter" | "onDragEnterCapture" | "onDragExit" | "onDragExitCapture" | "onDragLeave" | "onDragLeaveCapture" | "onDragOver" | "onDragOverCapture" | "onDragStart" | "onDragStartCapture" | "onDrop" | "onDropCapture" | "onMouseDown" | "onMouseDownCapture" | "onMouseEnter" | "onMouseLeave" | "onMouseMove" | "onMouseMoveCapture" | "onMouseOut" | "onMouseOutCapture" | "onMouseOver" | "onMouseOverCapture" | "onMouseUp" | "onMouseUpCapture" | "onSelect" | "onSelectCapture" | "onTouchCancel" | "onTouchCancelCapture" | "onTouchEnd" | "onTouchEndCapture" | "onTouchMove" | "onTouchMoveCapture" | "onTouchStart" | "onTouchStartCapture" | "onPointerDown" | "onPointerDownCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerUp" | "onPointerUpCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerOver" | "onPointerOverCapture" | "onPointerOut" | "onPointerOutCapture" | "onGotPointerCapture" | "onGotPointerCaptureCapture" | "onLostPointerCapture" | "onLostPointerCaptureCapture" | "onScroll" | "onScrollCapture" | "onWheel" | "onWheelCapture" | "onAnimationStart" | "onAnimationStartCapture" | "onAnimationEnd" | "onAnimationEndCapture" | "onAnimationIteration" | "onAnimationIterationCapture" | "onTransitionEnd" | "onTransitionEndCapture" | "key" | "alignAnchor" | "enableSpring" | "enableBlur" | "lyricLines" | "currentTime" | "linePosXSpringParams" | "linePosYSpringParams" | "lineScaleSpringParams"> & import("react").RefAttributes<LyricPlayerRef>>;
