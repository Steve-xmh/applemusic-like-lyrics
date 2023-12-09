import { callCachedSearchFunction } from "./func";

export const NCM_IMAGE_CDNS = [
	"https://p3.music.126.net/",
	"https://p4.music.126.net/",
];
let selectIndex = 0;
export function getNCMImageUrl(id: number | string) {
	selectIndex++;
	selectIndex %= NCM_IMAGE_CDNS.length;
	try {
		if (APP_CONF?.isOSX) {
			return `${NCM_IMAGE_CDNS[selectIndex]}${callCachedSearchFunction(
				"R$nameDo",
				["encryptId", id.toString()],
			)}/${id}.jpg`;
		} else {
			return `${NCM_IMAGE_CDNS[selectIndex]}${channel.encryptId(
				id.toString(),
			)}/${id}.jpg`;
		}
	} catch {
		return "";
	}
}
