import { Setting } from "obsidian";
import BetterPluginsPagePlugin from "./main";
import { getPlugins } from "@/getPlugins";

export class CommonSetting {
	plugin: BetterPluginsPagePlugin;

	constructor(plugin: BetterPluginsPagePlugin) {
		this.plugin = plugin;
	}

	createHiddenPluginsSetting(container: HTMLElement) {
		const hiddenPluginsSetting = new Setting(container)
			.setName("Hidden plugins")
			.setDesc("One line per plugin name")
			.addTextArea((text) =>
				text
					.setValue(
						this.plugin.settingManager.getSettings().hiddenPlugins
					)
					.onChange(async (value) => {
						this.plugin.settingManager.updateSettings((setting) => {
							setting.value.hiddenPlugins = value;
						});
						// console.log("hiddenPlugins", this.plugin.hiddenPlugins);
						this.plugin.debouncedFilterPlugins();
					})
			);

		hiddenPluginsSetting.settingEl.addClasses(["hidden-plugins-setting"]);
	}

	createSavedPluginsSetting(container: HTMLElement) {
		const savedPluginsSetting = new Setting(container)
			.setName("Saved plugins")
			.setDesc("One line per plugin name")
			.addTextArea((text) =>
				text
					.setValue(
						this.plugin.settingManager.getSettings().savedPlugins
					)
					.onChange(async (value) => {
						this.plugin.settingManager.updateSettings((setting) => {
							setting.value.savedPlugins = value;
						});
						// console.log("savedPlugins", this.plugin.savedPlugins);
						this.plugin.debouncedFilterPlugins();
					})
			);

		savedPluginsSetting.settingEl.addClasses(["saved-plugins-setting"]);
	}
}
