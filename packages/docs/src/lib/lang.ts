export interface Language {
    lang: string;
    display: string;
}

export const LANGUAGES: Language[] = [{
    lang: "zh-CN",
    display: "中文（简体）",
}, {
    lang: "en-US",
    display: "English (US)",
}];

export const DEFAULT_LANG = "zh-CN";
