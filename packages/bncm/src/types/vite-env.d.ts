/// <reference types="vite/client" />

declare module "*.svg?component" {
	declare const svgComponent: import("react").FC;
	export default svgComponent;
}
