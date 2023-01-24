/**
 * @fileoverview
 * 用于监听网易云的各种事件和回调，并存储到 Atom 中供其他模块使用
 * 做这个的另外一个原因是方便做歌词调试，这样可以设置调试专用的事件回调，无需再打开网易云测试效果了。
 */

export const NeteaseAPIWrapper: React.FC<React.PropsWithChildren> = (props) => {
	return <>{props.children}</>;
};
