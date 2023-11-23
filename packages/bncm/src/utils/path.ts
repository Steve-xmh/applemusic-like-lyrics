/* eslint-disable max-depth, max-statements, complexity, max-lines-per-function */
const SLASH = 47;
const DOT = 46;

const assertPath = (path: string) => {
	const t = typeof path;
	if (t !== "string") {
		throw new TypeError(`Expected a string, got a ${t}`);
	}
};

// this function is directly from node source
const posixNormalize = (path: string, allowAboveRoot: boolean) => {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code: number | undefined;

	for (let i = 0; i <= path.length; ++i) {
		if (i < path.length) {
			code = path.charCodeAt(i);
		} else if (code === SLASH) {
			break;
		} else {
			code = SLASH;
		}
		if (code === SLASH) {
			if (lastSlash === i - 1 || dots === 1) {
				// NOOP
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (
					res.length < 2 ||
					lastSegmentLength !== 2 ||
					res.charCodeAt(res.length - 1) !== DOT ||
					res.charCodeAt(res.length - 2) !== DOT
				) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf("/");
						if (lastSlashIndex !== res.length - 1) {
							if (lastSlashIndex === -1) {
								res = "";
								lastSegmentLength = 0;
							} else {
								res = res.slice(0, lastSlashIndex);
								lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
							}
							lastSlash = i;
							dots = 0;
							continue;
						}
					} else if (res.length === 2 || res.length === 1) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0) {
						res += "/..";
					} else {
						res = "..";
					}
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) {
					res += `/${path.slice(lastSlash + 1, i)}`;
				} else {
					res = path.slice(lastSlash + 1, i);
				}
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === DOT && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}

	return res;
};

const decode = (s: string) => {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
};

export const normalizePath = (p: string) => {
	assertPath(p);

	let path = p.replaceAll("\\", "/");
	if (path.length === 0) {
		return ".";
	}

	const isAbsolute = path.charCodeAt(0) === SLASH;
	const trailingSeparator = path.charCodeAt(path.length - 1) === SLASH;

	path = decode(path);
	path = posixNormalize(path, !isAbsolute);

	if (path.length === 0 && !isAbsolute) {
		path = ".";
	}
	if (path.length > 0 && trailingSeparator) {
		path += "/";
	}
	if (isAbsolute) {
		return `/${path}`;
	}

	return path;
};
