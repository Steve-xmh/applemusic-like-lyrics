/// <reference types="vite/client" />

declare module "*.svg" {
	declare const svgComponent: import("react").FC<import("react").HTMLProps<SVGElement>>;
	export default svgComponent;
}
