import { beforeEach, describe, expect, it, vi } from "vitest";

const support = vi.hoisted(() => ({
	wideGamutDisplay: false,
	hdrDisplay: false,
	wideGamutDrawingBuffer: false,
}));

vi.mock("../src/bg-render/support.ts", () => ({
	isDisplayP3Supported: () => support.wideGamutDisplay,
	isHdrDisplaySupported: () => support.hdrDisplay,
	isWideGamutDrawingBufferSupported: () => support.wideGamutDrawingBuffer,
}));

import {
	detectBackgroundColorSpace,
	getOutputColorSpaceSupport,
	setBackgroundColorSpacePreference,
} from "../src/bg-render/color-space.ts";

function setSupport(
	next: Partial<{
		wideGamutDisplay: boolean;
		hdrDisplay: boolean;
		wideGamutDrawingBuffer: boolean;
	}>,
): void {
	support.wideGamutDisplay = false;
	support.hdrDisplay = false;
	support.wideGamutDrawingBuffer = false;
	Object.assign(support, next);
}

describe("detectBackgroundColorSpace", () => {
	beforeEach(() => {
		setSupport({});
		setBackgroundColorSpacePreference("auto");
	});

	it("宽色域屏幕与可声明 P3 的绘制缓冲都在时才用 display-p3", () => {
		setSupport({ wideGamutDisplay: true, wideGamutDrawingBuffer: true });
		expect(detectBackgroundColorSpace()).toBe("display-p3");
	});

	it("屏幕不宽时退回 srgb", () => {
		setSupport({ wideGamutDisplay: false, wideGamutDrawingBuffer: true });
		expect(detectBackgroundColorSpace()).toBe("srgb");
	});

	it("绘制缓冲声明不了 P3 时退回 srgb", () => {
		setSupport({ wideGamutDisplay: true, wideGamutDrawingBuffer: false });
		expect(detectBackgroundColorSpace()).toBe("srgb");
	});

	it("只有 HDR 屏幕不足以启用，背景拿不到亮度上的 HDR", () => {
		setSupport({ hdrDisplay: true, wideGamutDrawingBuffer: true });
		expect(detectBackgroundColorSpace()).toBe("srgb");
	});

	it("强制 srgb 时无视设备能力", () => {
		setSupport({
			wideGamutDisplay: true,
			hdrDisplay: true,
			wideGamutDrawingBuffer: true,
		});
		setBackgroundColorSpacePreference("srgb");
		expect(detectBackgroundColorSpace()).toBe("srgb");
	});

	it("强制 display-p3 时屏幕可以不宽，合成器会压回屏幕色域", () => {
		setSupport({ wideGamutDisplay: false, wideGamutDrawingBuffer: true });
		setBackgroundColorSpacePreference("display-p3");
		expect(detectBackgroundColorSpace()).toBe("display-p3");
	});

	it("强制 display-p3 但绘制缓冲不认时仍退回 srgb，避免数值被当 sRGB 解释", () => {
		setSupport({ wideGamutDisplay: true, wideGamutDrawingBuffer: false });
		setBackgroundColorSpacePreference("display-p3");
		expect(detectBackgroundColorSpace()).toBe("srgb");
	});
});

describe("getOutputColorSpaceSupport", () => {
	beforeEach(() => {
		setSupport({});
	});

	it("原样转述各项探测结果", () => {
		setSupport({ wideGamutDisplay: true, hdrDisplay: true });
		expect(getOutputColorSpaceSupport()).toEqual({
			wideGamutDisplay: true,
			hdrDisplay: true,
			wideGamutDrawingBuffer: false,
		});
	});
});
