import { ButtonComponent, Modal, Setting } from "obsidian";
import { CommonSetting } from "./CommonSetting";
import BetterPluginsPagePlugin from "./main";

export enum UpdatedFilterOption {
	Within = "with in",
	Before = "before",
}

export enum UpdatedTimeRangeOption {
	none = "",
	OneWeek = "1 week",
	TwoWeek = "2 weeks",
	OneMonth = "1 month",
	ThreeMonth = "3 months",
	SixMonth = "6 months",
	OneYear = "1 year",
}

export enum DownloadCountCompareOption {
	less = "less",
	greater = "greater",
}

export class FilterModal extends Modal {
	plugin: BetterPluginsPagePlugin;
	commonSetting: CommonSetting;

	constructor(plugin: BetterPluginsPagePlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.commonSetting = new CommonSetting(plugin);
	}

	onOpen() {
		// sort the setting manager hidden pages value
		this.plugin.settingManager.updateSettings((setting) => {
			setting.value.hiddenPlugins = setting.value.hiddenPlugins
				.split("\n")
				.sort()
				.join("\n");

			setting.value.savedPlugins = setting.value.savedPlugins
				.split("\n")
				.sort()
				.join("\n");
		});

		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["better-plugins-page-plugin-setting-tab"]);

		// add a heading 2
		contentEl.createEl("h2", { text: "Filter", cls: "test" });

		const updatedFilterDropDown = new Setting(contentEl)
			.setName("Updated")
			.addDropdown((dropdown) => {
				const updatedWithinCompare = localStorage.getItem(
					"updated-within-compare"
				);

				return dropdown
					.addOption(
						UpdatedFilterOption.Before,
						UpdatedFilterOption.Before
					)
					.addOption(
						UpdatedFilterOption.Within,
						UpdatedFilterOption.Within
					)
					.setValue(
						updatedWithinCompare ?? UpdatedFilterOption.Within
					)
					.onChange(async (value) => {
						// set this in local storage
						localStorage.setItem(
							"updated-within-compare",
							value.toString()
						);
						// Trigger filtering when the dropdown changes
						this.plugin.debouncedFilterPlugins();
					});
			})
			.addDropdown((dropdown) => {
				const updatedWithin = localStorage.getItem("updated-within");
				return dropdown
					.addOption(
						UpdatedTimeRangeOption.none,
						UpdatedTimeRangeOption.none
					)
					.addOption(
						UpdatedTimeRangeOption.OneWeek,
						UpdatedTimeRangeOption.OneWeek
					)
					.addOption(
						UpdatedTimeRangeOption.TwoWeek,
						UpdatedTimeRangeOption.TwoWeek
					)
					.addOption(
						UpdatedTimeRangeOption.OneMonth,
						UpdatedTimeRangeOption.OneMonth
					)
					.addOption(
						UpdatedTimeRangeOption.ThreeMonth,
						UpdatedTimeRangeOption.ThreeMonth
					)
					.addOption(
						UpdatedTimeRangeOption.SixMonth,
						UpdatedTimeRangeOption.SixMonth
					)
					.addOption(
						UpdatedTimeRangeOption.OneYear,
						UpdatedTimeRangeOption.OneYear
					)
					.setValue(updatedWithin ?? UpdatedTimeRangeOption.none)
					.onChange(async (value) => {
						// set this in local storage
						localStorage.setItem(
							"updated-within",
							value.toString()
						);
						// Trigger filtering when the dropdown changes
						this.plugin.debouncedFilterPlugins();
					});
			});

		const downloadCountDropDown = new Setting(contentEl)
			.setName("Download count")
			.addDropdown((dropdown) => {
				const downloadCountCompare = localStorage.getItem(
					"download-count-compare"
				);

				return dropdown
					.addOption(
						DownloadCountCompareOption.less,
						DownloadCountCompareOption.less
					)
					.addOption(
						DownloadCountCompareOption.greater,
						DownloadCountCompareOption.greater
					)

					.setValue(
						downloadCountCompare ??
							DownloadCountCompareOption.greater
					)
					.onChange(async (value) => {
						// set in local storage
						localStorage.setItem(
							"download-count-compare",
							value.toString()
						);
						// Trigger filtering when the dropdown changes
						this.plugin.debouncedFilterPlugins();
					});
			})
			.addText((text) => {
				const downloadCount = localStorage.getItem("download-count");
				// this text input can only accept number
				text.inputEl.type = "number";
				return text
					.setPlaceholder("1000")
					.setValue(downloadCount ?? "")
					.onChange(async (value) => {
						// set in local storage
						localStorage.setItem(
							"download-count",
							value.toString()
						);
						// Trigger filtering when the dropdown changes
						this.plugin.debouncedFilterPlugins();
					});
			});

		// add a toggle to the modal
		const showSavedPluginToggle = new Setting(contentEl)
			.setName("Only show saved plugins")
			.addToggle((toggle) => {
				const onlyShowSavedPlugins =
					localStorage.getItem("show-saved-plugins");

				// parse the value to boolean, by default is false
				const onlyShowSavedPluginBool =
					onlyShowSavedPlugins === "true" ? true : false;
				return toggle
					.setValue(onlyShowSavedPluginBool)
					.onChange(async (value) => {
						// store the value in local storage
						localStorage.setItem(
							"show-saved-plugins",
							value.toString()
						);

						// Trigger filtering when the toggle changes
						this.plugin.debouncedFilterPlugins();
					});
			});
		showSavedPluginToggle.settingEl.addClasses([
			"show-saved-plugins-toggle",
		]);

		this.commonSetting.createSavedPluginsSetting(contentEl);

		// add a heading 2 to the modal
		contentEl.createEl("h2", { text: "Hidden plugins" });

		// add a toggle to the modal
		const toggle = new Setting(contentEl)
			.setName("Show hidden plugins")
			.addToggle((toggle) => {
				const showHiddenPlugins = localStorage.getItem(
					"show-hidden-plugins"
				);

				// parse the value to boolean, by default is false
				const showHiddenPluginsBool =
					showHiddenPlugins === "true" ? true : false;
				return toggle
					.setValue(showHiddenPluginsBool)
					.onChange(async (value) => {
						// store the value in local storage
						localStorage.setItem(
							"show-hidden-plugins",
							value.toString()
						);

						// Trigger filtering when the toggle changes
						this.plugin.debouncedFilterPlugins();
					});
			});
		toggle.settingEl.addClasses(["show-hidden-plugins-toggle"]);

		this.commonSetting.createHiddenPluginsSetting(contentEl);

		// add a button group to the modal
		const buttonGroup = contentEl.createDiv("button-group");
		buttonGroup.addClasses([
			"better-plugins-page-plugin-setting-button-group",
		]);
		// add a button to the button group
		const resetButton = new ButtonComponent(buttonGroup)
			.setButtonText("Reset")
			.onClick(() => {
				// reset the local storage
				localStorage.removeItem("download-count");
				localStorage.removeItem("download-count-compare");
				localStorage.removeItem("updated-within");
				localStorage.removeItem("updated-within-compare");
				localStorage.removeItem("show-hidden-plugins");
				localStorage.removeItem("show-saved-plugins");
				// reset the plugin setting
				this.plugin.settingManager.updateSettings((setting) => {
					setting.value.hiddenPlugins = "";
					setting.value.savedPlugins = "";
				});

				// reset the whole modal by calling onOpen
				this.onOpen();

				// trigger filtering
				this.plugin.debouncedFilterPlugins();
			});

		// add the button groups to the modal
		contentEl.appendChild(buttonGroup);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
