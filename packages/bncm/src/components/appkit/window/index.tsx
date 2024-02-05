import "./window.sass";
import {
	FC,
	HTMLProps,
	MouseEventHandler,
	PropsWithChildren,
	ReactNode,
	Suspense,
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
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
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
			className={`appkit-window${title ? " " : " no-title "}${className || ""}`}
			{...props}
		>
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
	);
};

export const AppKitWindow: FC<
	PropsWithChildren<
		{
			hideZoomBtn?: boolean;
			hideMinimizeBtn?: boolean;
			sidebarItems?: React.ReactNode;
			sidebarBottomItems?: React.ReactNode;
			onClose?: React.MouseEventHandler;
			title?: string;
			zIndex?: number;
			width?: number;
			height?: number;
			open?: boolean;
		} & HTMLProps<HTMLDivElement>
	>
> = ({
	hideZoomBtn,
	hideMinimizeBtn,
	sidebarItems,
	sidebarBottomItems,
	onClose,
	title,
	zIndex,
	width,
	height,
	children,
	className,
	style,
	open,
	...props
}) => {
	const [pos, setPos] = useState([0, 0]);
	const winRef = useRef<HTMLDivElement>(null);
	const shouldRecenterRef = useRef(true);

	useLayoutEffect(() => {
		const win = winRef.current;
		if (win) {
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

	useLayoutEffect(() => {
		const win = winRef.current;
		if (win && open && shouldRecenterRef.current) {
			const rect = win.getBoundingClientRect();
			setPos([
				(window.innerWidth - rect.width) / 2,
				(window.innerHeight - rect.height) / 2,
			]);
			shouldRecenterRef.current = false;
		} else if (!open) {
			shouldRecenterRef.current = true;
		}
	}, [open]);

	const onStartDraggingWindow: MouseEventHandler = (evt) => {
		const win = winRef.current;
		if (win) {
			const rect = win.getBoundingClientRect();
			const offsetX = evt.clientX - rect.left;
			const offsetY = evt.clientY - rect.top;
			const onMove = (evt: MouseEvent) => {
				const x = Math.max(
					0,
					Math.min(window.innerWidth - rect.width, evt.clientX - offsetX),
				);
				const y = Math.max(
					60,
					Math.min(window.innerHeight - rect.height, evt.clientY - offsetY),
				);
				win.style.transform = `translate(${x}px, ${y}px)`;
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
		open && (
			<div
				className={`appkit-window ${className}`}
				style={{
					position: "fixed",
					left: "0",
					top: "0",
					transform: `translate(${pos[0]}px, ${pos[1]}px)`,
					backfaceVisibility: "hidden",
					width: width ? `${width}px` : undefined,
					height: height ? `${height}px` : undefined,
					zIndex: zIndex ?? 999,
					...style,
				}}
				ref={winRef}
				{...props}
			>
				<div className="appkit-traffic-lights">
					<button type="button" onClick={onClose} className="close" />
					{!hideMinimizeBtn && <button type="button" className="minimize" />}
					{!hideZoomBtn && <button type="button" className="zoom" />}
				</div>
				{(sidebarItems || sidebarBottomItems) && (
					<>
						<div className="window-sidebar">
							<div
								className="window-controls-content"
								onMouseDown={onStartDraggingWindow}
							/>
							<Suspense fallback={<></>}>{sidebarItems}</Suspense>
							<div className="spacer" />
							<Suspense fallback={<></>}>{sidebarBottomItems}</Suspense>
						</div>
						<div className="window-sidebar-devider" />
					</>
				)}
				<div className="window-content">
					<div
						className="window-controls-content"
						onMouseDown={onStartDraggingWindow}
					>
						{!(sidebarItems || sidebarBottomItems) && (
							<div className="window-traffic-lights-spacer" />
						)}
						<div className="title">
							<Suspense fallback={<></>}>{title}</Suspense>
						</div>
					</div>
					<div className="window-content-inner">
						<div>
							<div>
								<Suspense fallback={<></>}>{children}</Suspense>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	);
};
