import { warn } from "../utils/logger";

export class LyricEditorWSClient extends WebSocket {
	constructor(port = 15221) {
		super(`ws://localhost:${port}`);
		this.addEventListener("message", (evt) => {
			try {
				this.dispatchEvent(
					new MessageEvent("data", {
						data: JSON.parse(evt.data),
						lastEventId: evt.lastEventId,
						origin: evt.origin,
						ports: [...evt.ports],
						source: evt.source,
					}),
				);
			} catch (err) {
				warn("解析编辑器传回的数据时出错：", err);
			}
		});
	}

	send(data: string | ArrayBuffer | Blob | ArrayBufferView) {
		if (this.readyState === this.OPEN) {
			try {
				super.send(data);
			} catch (err) {
				warn(err);
			}
		}
	}

	dispose() {
		this.close();
	}
}
