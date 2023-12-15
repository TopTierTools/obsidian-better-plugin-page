import $ from "jquery";

export const prunedName = (text: string) => {
	return text.endsWith("Installed") ? text.slice(0, -9) : text;
};

export const getName = (pluginCard: HTMLElement) => {
	const name = $(pluginCard).find(".community-item-name").contents().text();
	// if end with "Installed" remove it
	return prunedName(name).trim();
};
