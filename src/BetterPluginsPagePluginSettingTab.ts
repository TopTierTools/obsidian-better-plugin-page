import { App, PluginSettingTab, Setting } from "obsidian";
import BetterPluginsPagePlugin from "./main";
import { CommonSetting } from "./CommonSetting";

export class BetterPluginsPagePluginSettingTab extends PluginSettingTab {
	plugin: BetterPluginsPagePlugin;

	constructor(app: App, plugin: BetterPluginsPagePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.addClasses(["better-plugins-page-plugin-setting-tab"]);

		const commonSetting = new CommonSetting(this.plugin);
		commonSetting.createHiddenPluginsSetting(containerEl);
		commonSetting.createSavedPluginsSetting(containerEl);

		// add a toggle for enabling the plugin note feature
		new Setting(containerEl)
			.setName("Enable plugin note feature")
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.settingManager.getSettings()
							.pluginNoteFeatureEnabled
					)
					.onChange(async (value) => {
						this.plugin.settingManager.updateSettings((setting) => {
							setting.value.pluginNoteFeatureEnabled = value;
						});
						this.plugin.modalContentObserver?.disconnect();
					});
			});
	}
}
