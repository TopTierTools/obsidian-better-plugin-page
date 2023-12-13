import {
	App,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting,
	setIcon,
} from "obsidian";
import "@total-typescript/ts-reset";
import "@total-typescript/ts-reset/dom";
import { MySettingManager } from "@/SettingManager";
import $ from "jquery";
import { observeIsPresent } from "@/observer";
import debounce from "lodash/debounce";

export default class BetterPluginsPagePlugin extends Plugin {
	settingManager: MySettingManager;
	isPluginsPagePresentObserver: MutationObserver;

	async onload() {
		// initialize the setting manager
		this.settingManager = new MySettingManager(this);

		// load the setting using setting manager
		await this.settingManager.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-plugins-page",
			name: "Open plugins directory page",
			callback: this.openPluginsPage.bind(this),
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(
			new BetterPluginsPagePluginSettingTab(this.app, this)
		);

		this.isPluginsPagePresentObserver = observeIsPresent(
			"div.mod-community-modal",
			(isPresent) => {
				if (isPresent) {
					// console.log("community-item is present");
					this.onPluginsPageShow();
				} else {
					// console.log("community-item is not present");
					this.onPluginsPageClose();
				}
			}
		);
	}

	onPluginsPageClose = () => {
		// Disconnect the observer
		this.communityItemsObserver.disconnect();
	};

	communityItemsObserver = new MutationObserver((mutationsList) => {
		// Check if there are changes in the search results
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				this.debouncedFilterHiddenPlugins();
			}
		}
	});

	openPluginsPage() {
		// new SampleModal(this.app).open();
		// the community plugins tab id is "community-plugins", we get it from this.app.setting.settingTabs
		this.app.setting.open();
		this.app.setting.openTabById("community-plugins");

		// select the button.mod-cta:contains("Browse")  element
		const browseButton = $(
			'button.mod-cta:contains("Browse")'
		) as JQuery<HTMLButtonElement>;
		// click the button
		browseButton.trigger("click");
	}

	// Create a debounced function to batch process filtering
	debouncedFilterHiddenPlugins = debounce(
		() => {
			// Get the hidden plugins from the setting and split by new line
			const hiddenPlugins = this.settingManager
				.getSettings()
				.hiddenPlugins.trim()
				.split("\n");

			if (hiddenPlugins.length === 0) {
				// If there are no hidden plugins, then show all community items
				$(".community-item").show();
				return;
			}

			// Iterate through each hidden plugin name and show the matching items
			hiddenPlugins.forEach((pluginName) => {
				// Use a custom filter function for exact string matching
				$(`.community-item`)
					.filter(function () {
						return (
							$(this).find(".community-item-name").text() ===
							pluginName
						);
					})
					.hide();
			});
		},
		500,
		{
			leading: true,
			trailing: true,
		}
	);

	onPluginsPageShow() {
		// Select ".community-modal-controls .setting-item-control" and add a button.clickable-icon item to it
		const settingItemControl = $(
			".community-modal-controls .setting-item:not('.mod-toggle') .setting-item-control"
		);
		// Check if the button already exists within the settingItemControl
		if (
			!settingItemControl.find(".better-plugins-page-filter-btn").length
		) {
			// Create a button element and add the clickable icon class to it
			const button = $("<button></button>")
				.addClass("clickable-icon")
				.addClass("better-plugins-page-filter-btn");

			button.on("click", () => {
				// show the modal
				new FilterModal(this).open();
			});

			// Set the icon of the button
			setIcon(button.get(0) as HTMLButtonElement, "filter");

			// Add the button to the settingItemControl
			settingItemControl.append(button);
		}

		// observe div.community-modal-search-results in the community modal
		// if there is changes, then we need to filter the results
		// get the hidden plugins from the setting, each line from the value is a plugin name
		// then use jquery to get all the div.community-item:contains(plugin name) and hide them
		// hidden them by giving them a display: none style

		// Observe div.community-modal-search-results in the community modal
		const communityModalSearchResults = document.querySelector(
			"div.community-modal-search-results"
		)!;

		// Configure and start observing the search results
		this.communityItemsObserver.observe(communityModalSearchResults, {
			childList: true, // Observe changes in the child nodes
			subtree: true, // Observe changes in all descendants
		});

		// also if the hidden plugins setting changes, it need to do the filtering again
		// if the some plugins name is removed from the hidden plugins setting, then it need to show them again
		// if the some plugins name is added to the hidden plugins setting, then it need to hide them
		// you can use this.settingManager.setting.onChange to observe the changes
		// this.settingManager.setting.onChange((change) => {
		// 	console.log("the plugin name changes", change.newValue);
		// });

		this.settingManager.setting.onChange((change) => {
			if (change.currentPath === "hiddenPlugins") {
				// Handle changes to the hiddenPlugins setting here
				// You can use change.newValue and change.oldValue to compare and update the filtering
				this.updateFiltering(
					change.previousValue as string,
					change.newValue as string
				);
			}
		});
	}

	updateFiltering = debounce(
		(oldHiddenPlugins: string, newHiddenPlugins: string) => {
			// Split the old and new hidden plugin names by newline
			const oldHiddenPluginNames = oldHiddenPlugins.trim().split("\n");
			const newHiddenPluginNames = newHiddenPlugins.trim().split("\n");

			if (newHiddenPluginNames.length === 0) {
				// If there are no hidden plugins, then show all community items
				$(".community-item").show();
				return;
			}

			// Find added and removed plugin names
			const addedPluginNames = newHiddenPluginNames.filter(
				(name) => !oldHiddenPluginNames.includes(name)
			);
			const removedPluginNames = oldHiddenPluginNames.filter(
				(name) => !newHiddenPluginNames.includes(name)
			);

			// Update the filtering based on added and removed plugins
			addedPluginNames.forEach((pluginName) => {
				// Use a custom filter function for exact string matching
				$(`.community-item`)
					.filter(function () {
						return (
							$(this).find(".community-item-name").text() ===
							pluginName
						);
					})
					.hide();
			});

			removedPluginNames.forEach((pluginName) => {
				// Use a custom filter function for exact string matching
				$(`.community-item`)
					.filter(function () {
						return (
							$(this).find(".community-item-name").text() ===
							pluginName
						);
					})
					.show();
			});
		},
		500,
		{ leading: true, trailing: true }
	); // Debounce the updateFiltering function

	onunload() {
		super.onunload();
		this.isPluginsPagePresentObserver.disconnect();
		this.communityItemsObserver.disconnect(); // Disconnect the communityItemsObserver
	}
}

class CommonSetting {
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

class FilterModal extends Modal {
	plugin: BetterPluginsPagePlugin;

	constructor(plugin: BetterPluginsPagePlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["better-plugins-page-plugin-setting-tab"]);

		// add a toggle to the modal
		const toggle = new Setting(contentEl)
			.setName("Show hidden plugins")
			.addToggle((toggle) =>
				// get the value from local storage
				{
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
						});
				}
			);
		toggle.settingEl.addClasses(["show-hidden-plugins-toggle"]);

		const commonSetting = new CommonSetting(this.plugin);
		commonSetting.createHiddenPluginsSetting(contentEl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class BetterPluginsPagePluginSettingTab extends PluginSettingTab {
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
