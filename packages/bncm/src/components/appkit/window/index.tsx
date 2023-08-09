import "./window.sass";
import {
	FC,
	HTMLProps,
	MouseEventHandler,
	PropsWithChildren,
	ReactNode,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

export const SidebarItem: FC<
	PropsWithChildren<{
		selected?: boolean;
		onClick?: MouseEventHandler;
	}>
> = (props) => {
	return (
		<div className={`sidebar-item${props.selected ? " selected" : ""}`}>
			{/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div onClick={props.onClick}>{props.children}</div>
		</div>
	);
};

export const AppKitWindowFrame: FC<
	PropsWithChildren<
		{
			sidebarItems?: ReactNode;
			sidebarBottomItems?: ReactNode;
			title?: string;
		} & HTMLProps<HTMLDivElement>
	>
> = ({
	sidebarItems,
	sidebarBottomItems,
	title,
	children,
	className,
	...props
}) => {
	return (
		<div
			className={
				"appkit-window" + (title ? " " : " no-title ") + (className || "")
			}
			{...props}
		>
			<div>
				<div className="window-sidebar">
					{title && <div className="window-controls-content" />}
					{sidebarItems}
					<div className="spacer" />
					{sidebarBottomItems}
				</div>
				<div className="window-sidebar-devider" />
				<div className="window-content">
					{title && (
						<div className="window-controls-content">
							<div className="title">{title}</div>
						</div>
					)}
					<div className="window-content-inner">
						<div>
							<div>{children}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const AppKitWindow: FC<
	PropsWithChildren<{
		hideZoomBtn?: boolean;
		hideMinimizeBtn?: boolean;
		sidebarItems?: React.ReactNode;
		sidebarBottomItems?: React.ReactNode;
		onClose?: React.MouseEventHandler;
		title?: string;
		zIndex?: number;
		width?: number;
		height?: number;
	}>
> = (props) => {
	const [pos, setPos] = useState([0, 0]);
	const winRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const win = winRef.current;
		if (win) {
			const rect = win.getBoundingClientRect();
			setPos([
				(window.innerWidth - rect.width) / 2,
				(window.innerHeight - rect.height) / 2,
			]);
			const onResize = () => {
				const rect = win.getBoundingClientRect();
				setPos((oldPos) => {
					return [
						Math.min(window.innerWidth - rect.width, oldPos[0]),
						Math.min(window.innerHeight - rect.height, oldPos[1]),
					];
				});
			};

			const obs = new ResizeObserver(onResize);

			obs.observe(win);

			window.addEventListener("resize", onResize);

			return () => {
				obs.disconnect();
				window.removeEventListener("resize", onResize);
			};
		}
	}, []);

	const onStartDraggingWindow: MouseEventHandler = (evt) => {
		const win = winRef.current;
		if (win) {
			const rect = win.getBoundingClientRect();
			const offsetX = evt.clientX - rect.left;
			const offsetY = evt.clientY - rect.top;
			const onMove = (evt: MouseEvent) => {
				win.style.left = `${Math.max(
					0,
					Math.min(window.innerWidth - rect.width, evt.clientX - offsetX),
				)}px`;
				win.style.top = `${Math.max(
					60,
					Math.min(window.innerHeight - rect.height, evt.clientY - offsetY),
				)}px`;
			};
			window.addEventListener("mousemove", onMove);
			window.addEventListener(
				"mouseup",
				(evt) => {
					setPos([
						Math.max(
							0,
							Math.min(window.innerWidth - rect.width, evt.clientX - offsetX),
						),
						Math.max(
							60,
							Math.min(window.innerHeight - rect.height, evt.clientY - offsetY),
						),
					]);
					window.removeEventListener("mousemove", onMove);
				},
				{ once: true },
			);
		}
	};

	return (
		<div
			className="appkit-window"
			style={{
				position: "fixed",
				left: `${pos[0]}px`,
				top: `${pos[1]}px`,
				width: props.width ? `${props.width}px` : undefined,
				height: props.height ? `${props.height}px` : undefined,
				zIndex: props.zIndex ?? 999,
			}}
			ref={winRef}
		>
			<div
				style={{
					width: props.width ? `${props.width}px` : undefined,
					height: props.height ? `${props.height}px` : undefined,
				}}
			>
				<div className="appkit-traffic-lights">
					<button onClick={props.onClose} className="close" />
					{!props.hideMinimizeBtn && <button className="minimize" />}
					{!props.hideZoomBtn && <button className="zoom" />}
				</div>
				<div className="window-sidebar">
					<div
						className="window-controls-content"
						onMouseDown={onStartDraggingWindow}
					/>
					{props.sidebarItems}
					<div className="spacer" />
					{props.sidebarBottomItems}
				</div>
				<div className="window-sidebar-devider" />
				<div className="window-content">
					<div
						className="window-controls-content"
						onMouseDown={onStartDraggingWindow}
					>
						<div className="title">{props.title}</div>
					</div>
					<div className="window-content-inner">
						<div>
							<div>{props.children}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
