import $ from "jquery";

export const getName = (pluginCard: HTMLElement) => {
	const name = $(pluginCard).find(".community-item-name").contents().text();
	// if end with "Installed" remove it
	const prunedText = name.endsWith("Installed") ? name.slice(0, -9) : name;
	return prunedText.trim();
};
