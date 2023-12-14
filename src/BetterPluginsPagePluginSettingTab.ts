import { App, PluginSettingTab } from "obsidian";
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
	}
}
