export function genRandomString(length: number) {
	const words = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		result.push(words.charAt(Math.floor(Math.random() * words.length)));
	}
	return result.join("");
}
