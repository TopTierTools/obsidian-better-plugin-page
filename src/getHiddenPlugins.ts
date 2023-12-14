export const getHiddenPlugins = (hiddenPluginsString: string) => {
	if (hiddenPluginsString.trim() === "") {
		return [];
	}
	return hiddenPluginsString.trim().split("\n");
};
