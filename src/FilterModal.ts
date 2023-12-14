import { ButtonComponent, Modal, Setting } from "obsidian";
import { CommonSetting } from "./CommonSetting";
import BetterPluginsPagePlugin from "./main";

export class FilterModal extends Modal {
	plugin: BetterPluginsPagePlugin;

	constructor(plugin: BetterPluginsPagePlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["better-plugins-page-plugin-setting-tab"]);

		const updatedFilterDropDown = new Setting(contentEl)
			.setName("Updated within")
			.addDropdown((dropdown) => {
				const updatedWithinCompare = localStorage.getItem(
					"updated-within-compare"
				);

				return dropdown
					.addOption("within", "with in")
					.addOption("before", "before")
					.setValue(updatedWithinCompare ?? "within")
					.onChange(async (value) => {
						// set this in local storage
						localStorage.setItem(
							"updated-within-compare",
							value.toString()
						);
						// Trigger filtering when the dropdown changes
						this.plugin.debouncedFilterHiddenPlugins();
					});
			})
			.addDropdown((dropdown) => {
				const updatedWithin = localStorage.getItem("updated-within");
				return dropdown
					.addOption("", "")
					.addOption("1-week", "1 week")
					.addOption("2-week", "2 weeks")
					.addOption("1-month", "1 month")
					.addOption("3-month", "3 months")
					.addOption("6-month", "6 months")
					.addOption("1-year", "1 year")
					.setValue(updatedWithin ?? "")
					.onChange(async (value) => {
						// set this in local storage
						localStorage.setItem(
							"updated-within",
							value.toString()
						);
						// Trigger filtering when the dropdown changes
						this.plugin.debouncedFilterHiddenPlugins();
					});
			});

		const downloadCountDropDown = new Setting(contentEl)
			.setName("Download Count")
			.addDropdown((dropdown) => {
				const downloadCountCompare = localStorage.getItem(
					"download-count-compare"
				);

				return dropdown
					.addOption("greater", "greater than")
					.addOption("less", "less than")
					.setValue(downloadCountCompare ?? "greater")
					.onChange(async (value) => {
						// set in local storage
						localStorage.setItem(
							"download-count-compare",
							value.toString()
						);
						// Trigger filtering when the dropdown changes
						this.plugin.debouncedFilterHiddenPlugins();
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
						this.plugin.debouncedFilterHiddenPlugins();
					});
			});

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
						this.plugin.debouncedFilterHiddenPlugins();
					});
			});
		toggle.settingEl.addClasses(["show-hidden-plugins-toggle"]);

		const commonSetting = new CommonSetting(this.plugin);
		commonSetting.createHiddenPluginsSetting(contentEl);

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
				// reset the plugin setting
				this.plugin.settingManager.updateSettings((setting) => {
					setting.value.hiddenPlugins = "";
				});

				// reset the whole modal by calling onOpen
				this.onOpen();

				// trigger filtering
				this.plugin.debouncedFilterHiddenPlugins();
			});

		// add a apply button to the button group
		// const applyButton = new ButtonComponent(buttonGroup)
		// 	.setButtonText("Apply")
		// 	.onClick(() => {
		// 		console.log("apply button clicked");
		// 		this.plugin.debouncedFilterHiddenPlugins();
		// 	});

		// add the button groups to the modal
		contentEl.appendChild(buttonGroup);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
