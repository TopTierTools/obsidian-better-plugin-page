import { Setting } from "obsidian";
import BetterPluginsPagePlugin from "./main";

export class CommonSetting {
	plugin: BetterPluginsPagePlugin;

	constructor(plugin: BetterPluginsPagePlugin) {
		this.plugin = plugin;
	}

	createHiddenPluginsSetting(container: HTMLElement) {
		const hiddenPluginsSetting = new Setting(container)
			.setName("Hidden Plugins")
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
					})
			);

		hiddenPluginsSetting.settingEl.addClasses(["hidden-plugins-setting"]);
	}
}
