/**
 * 用于快速构建 CSS style 文本的对象
 */
class CSSBuilder {
	public css: string = "";
	private isInSelector: boolean = false;
	private isInMedia: boolean = false;
	/** 声明选择字符串 */
	public s(...selector: string[]) {
		this.fixSelectorBackParam();
		this.css += selector.join(",");
		this.css += "{";
		this.isInSelector = true;
		return this;
	}
	/** 写入原始字符串，顺便补充前面的括号 */
	public r(...data: string[]) {
		this.finish();
		this.css += data.join("\n");
		return this;
	}
	/** 声明属性 */
	public p(property: string, value: number | string | null | undefined) {
		if (!this.isInSelector) {
			throw "Can't define property outside the selector.";
		}
		if (!value) return this;
		this.css += property;
		this.css += ":";
		this.css += value;
		this.css += ";";
		return this;
	}
	/** 声明媒体选择器 */
	public m(value: string) {
		this.fixMediaBackParam();
		this.css += "@media ";
		this.css += value;
		this.css += "{";
		return this;
	}
	/** 重置构建器 */
	public reset() {
		this.css = "";
		this.isInSelector = false;
		this.isInMedia = false;
		return this;
	}
	/** 完成构建，填补花括号 */
	public finish() {
		this.fixMediaBackParam();
		return this;
	}
	/** 补齐媒体花括号 */
	private fixMediaBackParam() {
		this.fixSelectorBackParam();
		if (this.isInMedia) {
			this.css += "}";
			this.isInMedia = false;
		}
	}
	/** 补齐选择器花括号 */
	private fixSelectorBackParam() {
		if (this.isInSelector) {
			this.css += "}";
			this.isInSelector = false;
		}
	}
}

export default CSSBuilder;
