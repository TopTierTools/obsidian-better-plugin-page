import { ISettingManager } from "@/Interfaces";
import { AsyncQueue } from "@/util/AsyncQueue";
import { SettingSchema } from "@/SettingsSchemas";
import { createNotice } from "@/util/createNotice";
import { State } from "@/util/State";
import { Plugin } from "obsidian";
import { z } from "zod";

// the setting of slider
export const nodeSize = {
	min: 1,
	max: 10,
	step: 0.1,
	default: 3,
};

// export type BaseFilterSettings = Prettify<
// 	z.TypeOf<typeof BaseFilterSettingsSchema>
// >;

// export type LocalFilterSetting = Prettify<
// 	z.TypeOf<typeof LocalFilterSettingSchema>
// >;

// export type GroupSettings = Prettify<z.TypeOf<typeof GroupSettingsSchema>>;

// export type BaseDisplaySettings = Prettify<
// 	z.TypeOf<typeof BaseDisplaySettingsSchema>
// >;

// export type LocalDisplaySettings = Prettify<
// 	z.TypeOf<typeof LocalDisplaySettingsSchema>
// >;

// export type GlobalGraphSettings = Prettify<
// 	z.TypeOf<typeof GlobalGraphSettingsSchema>
// >;

// export type LocalGraphSettings = Prettify<
// 	z.TypeOf<typeof LocalGraphSettingsSchema>
// >;

// export type SavedSetting = Prettify<z.TypeOf<typeof SavedSettingSchema>>;

export type Setting = Prettify<z.TypeOf<typeof SettingSchema>>;

// export type GraphSetting = Exclude<SavedSetting["setting"], undefined>;

const corruptedMessage =
	"The setting is corrupted. You will not be able to save the setting. Please backup your data.json, remove it and reload the plugin. Then migrate your old setting back.";

/**
 * @remarks the setting will not keep the temporary setting. It will only keep the saved settings.
 */
export class MySettingManager implements ISettingManager<Setting> {
	private plugin: Plugin;
	private setting: State<Setting> = new State(DEFAULT_SETTING);
	private asyncQueue = new AsyncQueue();

	/**
	 * whether the setting is loaded successfully
	 */
	private isLoaded = false;

	/**
	 * @remarks don't forget to call `loadSettings` after creating this class
	 */
	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	/**
	 * this function will update the setting and save it to the json file. But it is still a sync function.
	 * You should always use this function to update setting
	 */
	updateSettings(
		updateFunc: (setting: typeof this.setting) => void
	): Setting {
		// update the setting first
		updateFunc(this.setting);
		// save the setting to json
		this.asyncQueue.push(this.saveSettings.bind(this));
		// return the updated setting
		return this.setting.value;
	}

	getSettings(): Setting {
		return this.setting.value;
	}

	/**
	 * load the settings from the json file
	 */
	async loadSettings() {
		// load the data, this can be null if the plugin is used for the first time
		const loadedData = (await this.plugin.loadData()) as unknown | null;

		console.log("loaded: ", loadedData);

		// if the data is null, then we need to initialize the data
		if (!loadedData) {
			this.setting.value = DEFAULT_SETTING;
			this.isLoaded = true;
			await this.saveSettings();
			return this.setting.value;
		}

		const result = SettingSchema.safeParse(loadedData);
		// the data schema is wrong or the data is corrupted, then we need to initialize the data
		if (!result.success) {
			createNotice(corruptedMessage);
			console.warn("parsed loaded data failed", result.error.flatten());
			this.isLoaded = false;
			this.setting.value = DEFAULT_SETTING;
			return this.setting.value;
		}

		console.log("parsed loaded data successfully");

		this.setting.value = result.data;
		return this.setting.value;
	}

	/**
	 * save the settings to the json file
	 */
	async saveSettings() {
		if (!this.isLoaded) {
			// try to parse it again to see if it is corrupted
			const result = SettingSchema.safeParse(this.setting.value);

			if (!result.success) {
				createNotice(corruptedMessage);
				console.warn(
					"parsed loaded data failed",
					result.error.flatten()
				);
				return;
			}

			this.isLoaded = true;
			console.log("parsed loaded data successfully");
		}
		await this.plugin.saveData(this.setting.value);
	}
}

export const DEFAULT_SETTING: Setting = {
	test: "test",
};
