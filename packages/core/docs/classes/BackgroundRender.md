[@applemusic-like-lyrics/core](../README.md) / [Exports](../modules.md) / BackgroundRender

# Class: BackgroundRender

拥有一个 HTML 元素的接口

可以通过 `getElement` 获取这个类所对应的 HTML 元素实例

## Hierarchy

- `PixiRenderer`

  ↳ **`BackgroundRender`**

## Implements

- [`HasElement`](../interfaces/HasElement.md)
- [`Disposable`](../interfaces/Disposable.md)

## Table of contents

### Constructors

- [constructor](BackgroundRender.md#constructor)

### Properties

- [element](BackgroundRender.md#element)

### Methods

- [dispose](BackgroundRender.md#dispose)
- [getElement](BackgroundRender.md#getelement)
- [pause](BackgroundRender.md#pause)
- [resume](BackgroundRender.md#resume)
- [setAlbumImage](BackgroundRender.md#setalbumimage)
- [setFPS](BackgroundRender.md#setfps)
- [setFlowSpeed](BackgroundRender.md#setflowspeed)
- [setRenderScale](BackgroundRender.md#setrenderscale)
- [setStaticMode](BackgroundRender.md#setstaticmode)

## Constructors

### constructor

• **new BackgroundRender**()

#### Overrides

PixiRenderer.constructor

#### Defined in

[packages/core/src/bg-render/index.ts:15](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/index.ts#L15)

## Properties

### element

• `Private` **element**: `HTMLCanvasElement`

#### Defined in

[packages/core/src/bg-render/index.ts:14](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/index.ts#L14)

## Methods

### dispose

▸ **dispose**(): `void`

销毁实现了该接口的对象实例，释放占用的资源

一般情况下，调用本函数后就不可以再调用对象的任何函数了

#### Returns

`void`

#### Implementation of

[Disposable](../interfaces/Disposable.md).[dispose](../interfaces/Disposable.md#dispose)

#### Overrides

PixiRenderer.dispose

#### Defined in

[packages/core/src/bg-render/index.ts:26](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/index.ts#L26)

___

### getElement

▸ **getElement**(): `HTMLCanvasElement`

获取这个类所对应的 HTML 元素实例

#### Returns

`HTMLCanvasElement`

#### Implementation of

[HasElement](../interfaces/HasElement.md).[getElement](../interfaces/HasElement.md#getelement)

#### Defined in

[packages/core/src/bg-render/index.ts:23](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/index.ts#L23)

___

### pause

▸ **pause**(): `void`

暂停背景动画，画面即便是更新了图片也不会发生变化

#### Returns

`void`

#### Inherited from

PixiRenderer.pause

#### Defined in

[packages/core/src/bg-render/pixi-renderer.ts:216](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/pixi-renderer.ts#L216)

___

### resume

▸ **resume**(): `void`

恢复播放背景动画

#### Returns

`void`

#### Inherited from

PixiRenderer.resume

#### Defined in

[packages/core/src/bg-render/pixi-renderer.ts:223](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/pixi-renderer.ts#L223)

___

### setAlbumImage

▸ **setAlbumImage**(`albumUrl`): `Promise`<`void`\>

设置背景专辑图片，图片材质加载并设置完成后会返回

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `albumUrl` | `string` | 图片的目标链接 |

#### Returns

`Promise`<`void`\>

#### Inherited from

PixiRenderer.setAlbumImage

#### Defined in

[packages/core/src/bg-render/pixi-renderer.ts:230](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/pixi-renderer.ts#L230)

___

### setFPS

▸ **setFPS**(`fps`): `void`

修改背景动画帧率，默认是 30 FPS

如果设置成 0 则会停止动画

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fps` | `number` | 目标帧率，默认 30 FPS |

#### Returns

`void`

#### Inherited from

PixiRenderer.setFPS

#### Defined in

[packages/core/src/bg-render/pixi-renderer.ts:210](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/pixi-renderer.ts#L210)

___

### setFlowSpeed

▸ **setFlowSpeed**(`speed`): `void`

修改背景的流动速度，数字越大越快，默认为 2

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `speed` | `number` | 背景的流动速度，默认为 2 |

#### Returns

`void`

#### Inherited from

PixiRenderer.setFlowSpeed

#### Defined in

[packages/core/src/bg-render/pixi-renderer.ts:120](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/pixi-renderer.ts#L120)

___

### setRenderScale

▸ **setRenderScale**(`scale`): `void`

修改背景的渲染比例，默认是 0.5

一般情况下这个程度既没有明显瑕疵也不会特别吃性能

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `scale` | `number` | 背景的渲染比例 |

#### Returns

`void`

#### Inherited from

PixiRenderer.setRenderScale

#### Defined in

[packages/core/src/bg-render/pixi-renderer.ts:129](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/pixi-renderer.ts#L129)

___

### setStaticMode

▸ **setStaticMode**(`enable?`): `void`

是否启用静态模式，即图片在更换后就会保持静止状态并禁用更新，以节省性能

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `enable` | `boolean` | `false` | 是否启用静态模式 |

#### Returns

`void`

#### Inherited from

PixiRenderer.setStaticMode

#### Defined in

[packages/core/src/bg-render/pixi-renderer.ts:200](https://github.com/Steve-xmh/applemusic-like-lyrics/blob/0cbfd70/packages/core/src/bg-render/pixi-renderer.ts#L200)
