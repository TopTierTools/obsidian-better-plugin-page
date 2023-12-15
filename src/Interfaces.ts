import { NoticeManager } from "@/NoticeManager";
import type { Notice, Plugin as _Plugin } from "obsidian";
export interface ISettingManager<SettingType = unknown> {
	/**
	 * save settings
	 */
	saveSettings(): Promise<void>;

	/**
	 * update the settings of the plugin. The updateFunc will be called with the current settings as the argument
	 *
	 * @returns the updated settings
	 */
	updateSettings(
		updateFunc: (setting: typeof this.setting) => void
	): SettingType;

	/**
	 * get the settings of the plugin
	 */
	getSettings(): SettingType;

	/**
	 * return the settings of the plugin
	 */
	loadSettings(): Promise<SettingType>;
}

export interface Plugin extends _Plugin {
	settingManager: ISettingManager;
	noticeManager: NoticeManager;
	createNotice: (
		message: string | DocumentFragment,
		duration?: number | undefined
	) => Notice;
}
