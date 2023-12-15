import { Notice, Plugin } from "obsidian";

// map the color to the color of the notice
const colorMap = {
	success: "green",
	warning: "yellow",
	error: "red",
	info: "blue",
};

export class NoticeManager {
	plugin: Plugin;
	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	createNotice = (
		message: string,
		duration?: number | undefined,
		color?: "success" | "warning" | "error" | "info"
	): Notice => {
		let notice: Notice;
		if (color) {
			// create a fragment, create a div inside, set the color and text of the div
			const fragment = document.createDocumentFragment();
			const div = document.createElement("div");
			div.style.color = colorMap[color];
			div.setText(`${this.plugin.manifest.name}: ${message}`);
			fragment.appendChild(div);

			notice = new Notice(fragment, duration);
		} else {
			notice = new Notice(
				`${this.plugin.manifest.name}: ${message}`,
				duration
			);
		}
		return notice;
	};
}
