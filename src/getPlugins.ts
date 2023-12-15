export const getPlugins = (pluginsString: string) => {
	if (pluginsString.trim() === "") {
		return [];
	}
	return pluginsString.trim().split("\n");
};
