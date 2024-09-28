import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resources from "virtual:i18next-loader";

console.log(resources);

declare module "i18next" {
	// Extend CustomTypeOptions
	interface CustomTypeOptions {
		resources: {
			translation: typeof resources;
		};
	}
}

i18n
	.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources,
		debug: import.meta.env.DEV,
		fallbackLng: "zh-CN",
		interpolation: {
			escapeValue: false, // react already safes from xss
		},
	});

export default i18n;
