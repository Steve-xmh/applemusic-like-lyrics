/// <reference types="vite/client" />

declare module "*.glsl?raw" {
	const content: string;
	export default content;
}
