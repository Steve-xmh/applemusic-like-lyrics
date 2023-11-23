[@applemusic-like-lyrics/core](../README.md) / [Exports](../modules.md) / LyricPlayer

# Class: LyricPlayer

歌词播放组件，本框架的核心组件

尽可能贴切 Apple Music for iPad 的歌词效果设计，且做了力所能及的优化措施

## Hierarchy

- `EventTarget`

  ↳ **`LyricPlayer`**

## Implements

- [`HasElement`](../interfaces/HasElement.md)
- [`Disposable`](../interfaces/Disposable.md)

## Table of contents

### Constructors

- [constructor](LyricPlayer.md#constructor)

### Properties

- [alignAnchor](LyricPlayer.md#alignanchor)
- [bufferedLines](LyricPlayer.md#bufferedlines)
- [currentTime](LyricPlayer.md#currenttime)
- [disableSpring](LyricPlayer.md#disablespring)
- [element](LyricPlayer.md#element)
- [enableBlur](LyricPlayer.md#enableblur)
- [hotLines](LyricPlayer.md#hotlines)
- [interludeDots](LyricPlayer.md#interludedots)
- [interludeDotsSize](LyricPlayer.md#interludedotssize)
- [lyricLines](LyricPlayer.md#lyriclines)
- [lyricLinesEl](LyricPlayer.md#lyriclinesel)
- [lyricLinesSize](LyricPlayer.md#lyriclinessize)
- [pos](LyricPlayer.md#pos)
- [posXSpringParams](LyricPlayer.md#posxspringparams)
- [posYSpringParams](LyricPlayer.md#posyspringparams)
- [processedLines](LyricPlayer.md#processedlines)
- [resizeObserver](LyricPlayer.md#resizeobserver)
- [scaleSpringParams](LyricPlayer.md#scalespringparams)
- [scrollToIndex](LyricPlayer.md#scrolltoindex)
- [size](LyricPlayer.md#size)
- [style](LyricPlayer.md#style)
- [supportMaskImage](LyricPlayer.md#supportmaskimage)
- [supportPlusLighter](LyricPlayer.md#supportpluslighter)

### Methods

- [addEventListener](LyricPlayer.md#addeventlistener)
- [calcLayout](LyricPlayer.md#calclayout)
- [dispatchEvent](LyricPlayer.md#dispatchevent)
- [dispose](LyricPlayer.md#dispose)
- [getCurrentInterlude](LyricPlayer.md#getcurrentinterlude)
- [getCurrentTime](LyricPlayer.md#getcurrenttime)
- [getElement](LyricPlayer.md#getelement)
- [getEnableSpring](LyricPlayer.md#getenablespring)
- [getLyricLines](LyricPlayer.md#getlyriclines)
- [onPageShow](LyricPlayer.md#onpageshow)
- [rebuildStyle](LyricPlayer.md#rebuildstyle)
- [removeEventListener](LyricPlayer.md#removeeventlistener)
- [setAlignAnchor](LyricPlayer.md#setalignanchor)
- [setCurrentTime](LyricPlayer.md#setcurrenttime)
- [setEnableBlur](LyricPlayer.md#setenableblur)
- [setEnableSpring](LyricPlayer.md#setenablespring)
- [setLinePosXSpringParams](LyricPlayer.md#setlineposxspringparams)
- [setLinePosYSpringParams](LyricPlayer.md#setlineposyspringparams)
- [setLineScaleSpringParams](LyricPlayer.md#setlinescalespringparams)
- [setLyricLines](LyricPlayer.md#setlyriclines)
- [update](LyricPlayer.md#update)

## Constructors

### constructor

• **new LyricPlayer**()

#### Overrides

EventTarget.constructor

#### Defined in

[packages/core/src/lyric-player/index.ts:198](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L198)

## Properties

### alignAnchor

• `Private` **alignAnchor**: `number` \| ``"bottom"`` \| ``"top"`` = `0.5`

#### Defined in

[packages/core/src/lyric-player/index.ts:63](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L63)

___

### bufferedLines

• `Private` **bufferedLines**: `Set`<`number`\>

#### Defined in

[packages/core/src/lyric-player/index.ts:30](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L30)

___

### currentTime

• `Private` **currentTime**: `number` = `0`

#### Defined in

[packages/core/src/lyric-player/index.ts:24](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L24)

___

### disableSpring

• `Private` **disableSpring**: `boolean` = `false`

#### Defined in

[packages/core/src/lyric-player/index.ts:62](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L62)

___

### element

• `Private` **element**: `HTMLElement`

#### Defined in

[packages/core/src/lyric-player/index.ts:23](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L23)

___

### enableBlur

• `Private` **enableBlur**: `boolean` = `true`

#### Defined in

[packages/core/src/lyric-player/index.ts:57](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L57)

___

### hotLines

• `Private` **hotLines**: `Set`<`number`\>

#### Defined in

[packages/core/src/lyric-player/index.ts:29](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L29)

___

### interludeDots

• `Private` **interludeDots**: `InterludeDots`

#### Defined in

[packages/core/src/lyric-player/index.ts:58](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L58)

___

### interludeDotsSize

• `Private` **interludeDotsSize**: [`number`, `number`]

#### Defined in

[packages/core/src/lyric-player/index.ts:59](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L59)

___

### lyricLines

• `Private` **lyricLines**: [`LyricLine`](../interfaces/LyricLine.md)[] = `[]`

#### Defined in

[packages/core/src/lyric-player/index.ts:25](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L25)

___

### lyricLinesEl

• `Private` **lyricLinesEl**: `LyricLineEl`[] = `[]`

#### Defined in

[packages/core/src/lyric-player/index.ts:27](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L27)

___

### lyricLinesSize

• `Private` **lyricLinesSize**: `Map`<`LyricLineEl`, [`number`, `number`]\>

#### Defined in

[packages/core/src/lyric-player/index.ts:28](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L28)

___

### pos

• `Readonly` **pos**: [`number`, `number`]

#### Defined in

[packages/core/src/lyric-player/index.ts:65](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L65)

___

### posXSpringParams

• `Private` **posXSpringParams**: `Partial`<[`SpringParams`](../interfaces/spring.SpringParams.md)\>

#### Defined in

[packages/core/src/lyric-player/index.ts:42](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L42)

___

### posYSpringParams

• `Private` **posYSpringParams**: `Partial`<[`SpringParams`](../interfaces/spring.SpringParams.md)\>

#### Defined in

[packages/core/src/lyric-player/index.ts:47](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L47)

___

### processedLines

• `Private` **processedLines**: [`LyricLine`](../interfaces/LyricLine.md)[] = `[]`

#### Defined in

[packages/core/src/lyric-player/index.ts:26](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L26)

___

### resizeObserver

• `Private` **resizeObserver**: `ResizeObserver`

#### Defined in

[packages/core/src/lyric-player/index.ts:32](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L32)

___

### scaleSpringParams

• `Private` **scaleSpringParams**: `Partial`<[`SpringParams`](../interfaces/spring.SpringParams.md)\>

#### Defined in

[packages/core/src/lyric-player/index.ts:52](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L52)

___

### scrollToIndex

• `Private` **scrollToIndex**: `number` = `0`

#### Defined in

[packages/core/src/lyric-player/index.ts:31](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L31)

___

### size

• `Readonly` **size**: [`number`, `number`]

#### Defined in

[packages/core/src/lyric-player/index.ts:64](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L64)

___

### style

• `Readonly` **style**: `StyleSheet`<``"lyricPlayer"`` \| ``"lyricLine"`` \| ``"@media (max-width: 1024px)"`` \| ``"lyricDuetLine"`` \| ``"lyricBgLine"`` \| ``"lyricMainLine"`` \| ``"lyricSubLine"`` \| ``"disableSpring"`` \| ``"interludeDots"`` \| ``"@supports (mix-blend-mode: plus-lighter)"`` \| ``"tmpDisableTransition"``\>

#### Defined in

[packages/core/src/lyric-player/index.ts:89](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L89)

___

### supportMaskImage

• `Readonly` **supportMaskImage**: `boolean`

#### Defined in

[packages/core/src/lyric-player/index.ts:61](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L61)

___

### supportPlusLighter

• `Readonly` **supportPlusLighter**: `boolean`

#### Defined in

[packages/core/src/lyric-player/index.ts:60](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L60)

## Methods

### addEventListener

▸ **addEventListener**(`type`, `callback`, `options?`): `void`

Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.

The options argument sets listener-specific options. For compatibility this can be a boolean, in which case the method behaves exactly as if the value was specified as options's capture.

When set to true, options's capture prevents callback from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE. When false (or not present), callback will not be invoked when event's eventPhase attribute value is CAPTURING_PHASE. Either way, callback will be invoked if event's eventPhase attribute value is AT_TARGET.

When set to true, options's passive indicates that the callback will not cancel the event by invoking preventDefault(). This is used to enable performance optimizations described in § 2.8 Observing event listeners.

When set to true, options's once indicates that the callback will only be invoked once after which the event listener will be removed.

If an AbortSignal is passed for options's signal, then the event listener will be removed when signal is aborted.

The event listener is appended to target's event listener list and is not appended if it has the same type, callback, and capture.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `callback` | ``null`` \| `EventListenerOrEventListenerObject` |
| `options?` | `boolean` \| `AddEventListenerOptions` |

#### Returns

`void`

#### Inherited from

EventTarget.addEventListener

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:8168

___

### calcLayout

▸ **calcLayout**(`reflow?`): `void`

重新布局定位歌词行的位置，调用完成后再逐帧调用 `update`
函数即可让歌词通过动画移动到目标位置。

此函数还有一个 `reflow` 参数，用于指定是否需要重新计算布局

因为计算布局必定会导致浏览器重排布局，所以会大幅度影响流畅度和性能，故请只在以下情况下将其​设置为 true：

1. 歌词页面大小发生改变时（这个组件会自行处理）
2. 加载了新的歌词时（不论前后歌词是否完全一样）
3. 用户自行跳转了歌曲播放位置（不论距离远近）

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `reflow` | `boolean` | `false` | 是否进行重新布局（重新计算每行歌词大小） |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:362](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L362)

___

### dispatchEvent

▸ **dispatchEvent**(`event`): `boolean`

Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is false or its preventDefault() method was not invoked, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |

#### Returns

`boolean`

#### Inherited from

EventTarget.dispatchEvent

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:8174

___

### dispose

▸ **dispose**(): `void`

销毁实现了该接口的对象实例，释放占用的资源

一般情况下，调用本函数后就不可以再调用对象的任何函数了

#### Returns

`void`

#### Implementation of

[Disposable](../interfaces/Disposable.md).[dispose](../interfaces/Disposable.md#dispose)

#### Defined in

[packages/core/src/lyric-player/index.ts:654](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L654)

___

### getCurrentInterlude

▸ **getCurrentInterlude**(): `undefined` \| [`number`, `number`]

获取当前播放时间里是否处于间奏区间
如果是则会返回单位为毫秒的始末时间
否则返回 undefined

这个只允许内部调用

#### Returns

`undefined` \| [`number`, `number`]

[开始时间,结束时间] 或 undefined 如果不处于间奏区间

#### Defined in

[packages/core/src/lyric-player/index.ts:220](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L220)

___

### getCurrentTime

▸ **getCurrentTime**(): `number`

获取当前歌词的播放位置

一般和最后调用 `setCurrentTime` 给予的参数一样

#### Returns

`number`

当前播放位置

#### Defined in

[packages/core/src/lyric-player/index.ts:460](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L460)

___

### getElement

▸ **getElement**(): `HTMLElement`

获取这个类所对应的 HTML 元素实例

#### Returns

`HTMLElement`

#### Implementation of

[HasElement](../interfaces/HasElement.md).[getElement](../interfaces/HasElement.md#getelement)

#### Defined in

[packages/core/src/lyric-player/index.ts:472](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L472)

___

### getEnableSpring

▸ **getEnableSpring**(): `boolean`

获取当前是否启用了物理弹簧

#### Returns

`boolean`

是否启用物理弹簧

#### Defined in

[packages/core/src/lyric-player/index.ts:86](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L86)

___

### getLyricLines

▸ **getLyricLines**(): [`LyricLine`](../interfaces/LyricLine.md)[]

获取当前歌词数组

一般和最后调用 `setLyricLines` 给予的参数一样

#### Returns

[`LyricLine`](../interfaces/LyricLine.md)[]

当前歌词数组

#### Defined in

[packages/core/src/lyric-player/index.ts:469](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L469)

___

### onPageShow

▸ `Private` **onPageShow**(): `void`

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:195](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L195)

___

### rebuildStyle

▸ **rebuildStyle**(): `void`

重建样式

这个只允许内部调用

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:251](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L251)

___

### removeEventListener

▸ **removeEventListener**(`type`, `callback`, `options?`): `void`

Removes the event listener in target's event listener list with the same type, callback, and options.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/removeEventListener)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `callback` | ``null`` \| `EventListenerOrEventListenerObject` |
| `options?` | `boolean` \| `EventListenerOptions` |

#### Returns

`void`

#### Inherited from

EventTarget.removeEventListener

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:8180

___

### setAlignAnchor

▸ **setAlignAnchor**(`alignAnchor`): `void`

设置歌词行的对齐方式，默认为 `top`

- 设置成 `top` 的话歌词将会向组件顶部对齐
- 设置成 `bottom` 的话歌词将会向组件底部对齐
- 设置成 [0.0-1.0] 之间任意数字的话则会根据当前组件高度从顶部向下位移为对齐位置垂直居中对齐

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `alignAnchor` | `number` \| ``"bottom"`` \| ``"top"`` | 歌词行对齐方式，详情见函数说明 |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:483](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L483)

___

### setCurrentTime

▸ **setCurrentTime**(`time`, `isSeek?`): `void`

设置当前播放进度，单位为毫秒且**必须是整数**，此时将会更新内部的歌词进度信息
内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好

调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `time` | `number` | `undefined` | 当前播放进度，单位为毫秒 |
| `isSeek` | `boolean` | `false` | - |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:493](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L493)

___

### setEnableBlur

▸ **setEnableBlur**(`enable`): `void`

设置是否启用歌词行的模糊效果

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `enable` | `boolean` | 是否启用 |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:270](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L270)

___

### setEnableSpring

▸ **setEnableSpring**(`enable?`): `void`

设置是否使用物理弹簧算法实现歌词动画效果，默认启用

如果启用，则会通过弹簧算法实时处理歌词位置，但是需要性能足够强劲的电脑方可流畅运行

如果不启用，则会回退到基于 `transition` 的过渡效果，对低性能的机器比较友好，但是效果会比较单一

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `enable` | `boolean` | `true` |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:73](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L73)

___

### setLinePosXSpringParams

▸ **setLinePosXSpringParams**(`params`): `void`

设置所有歌词行在横坐标上的弹簧属性，包括重量、弹力和阻力。

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Partial`<[`SpringParams`](../interfaces/spring.SpringParams.md)\> | 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样 |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:617](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L617)

___

### setLinePosYSpringParams

▸ **setLinePosYSpringParams**(`params`): `void`

设置所有歌词行在​纵坐标上的弹簧属性，包括重量、弹力和阻力。

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Partial`<[`SpringParams`](../interfaces/spring.SpringParams.md)\> | 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样 |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:631](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L631)

___

### setLineScaleSpringParams

▸ **setLineScaleSpringParams**(`params`): `void`

设置所有歌词行在​缩放大小上的弹簧属性，包括重量、弹力和阻力。

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Partial`<[`SpringParams`](../interfaces/spring.SpringParams.md)\> | 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样 |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:645](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L645)

___

### setLyricLines

▸ **setLyricLines**(`lines`): `void`

设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lines` | [`LyricLine`](../interfaces/LyricLine.md)[] | 歌词数组 |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:279](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L279)

___

### update

▸ **update**(`delta?`): `void`

更新动画，这个函数应该被逐帧调用或者在以下情况下调用一次：

1. 刚刚调用完设置歌词函数的时候

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `delta` | `number` | `0` | 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数） |

#### Returns

`void`

#### Defined in

[packages/core/src/lyric-player/index.ts:607](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/3f124db/packages/core/src/lyric-player/index.ts#L607)
