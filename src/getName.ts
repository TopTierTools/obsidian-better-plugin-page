import $ from "jquery";

export const getName = (pluginCard: HTMLElement) => {
	return $(pluginCard)
		.find(".community-item-name")
		.contents()
		.filter(function () {
			return this.nodeType === 3; // Filter text nodes
		})
		.text()
		.trim();
};
