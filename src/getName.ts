import $ from "jquery";

export const getName = (pluginCard: HTMLElement) => {
	return $(pluginCard)
		.find(".community-item-name")
		.contents()
		.text()
		.replace("Installed", "")
		.trim();
};
