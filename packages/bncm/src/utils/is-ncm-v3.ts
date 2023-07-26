import semverLt from "semver/functions/lt";

let IS_NCMV3: boolean;
export function isNCMV3() {
	if (typeof IS_NCMV3 === "undefined") {
		try {
			IS_NCMV3 = !semverLt(
				APP_CONF.appver.split(".").slice(0, 3).join("."),
				"3.0.0",
			);
		} catch {
			try {
				IS_NCMV3 = !semverLt(
					betterncm.ncm.getNCMVersion().split(".").slice(0, 3).join("."),
					"3.0.0",
				);
			} catch {
				IS_NCMV3 = false;
			}
		}
	}
	return IS_NCMV3;
}
