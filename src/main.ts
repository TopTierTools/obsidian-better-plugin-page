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

const getHiddenPlugins = (hiddenPluginsString: string) => {
	if (hiddenPluginsString.trim() === "") {
		return [];
	}
	return hiddenPluginsString.trim().split("\n");
};

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

	// Updated debouncedFilterHiddenPlugins function
	debouncedFilterHiddenPlugins = debounce(
		() => {
			// Get the hidden plugins from the setting and split by new line
			const hiddenPlugins = getHiddenPlugins(
				this.settingManager.getSettings().hiddenPlugins
			);

			const communityItems = $(".community-item");

			// update the div.community-modal-search-summary text content to show the number of plugins
			const searchSummary = document.querySelector(
				"div.community-modal-search-summary"
			)!;

			if (hiddenPlugins.length === 0) {
				// If there are no hidden plugins, then show all community items
				communityItems.show();
				searchSummary.setText(`Found ${communityItems.length} plugins`);
				return;
			}

			// Check the state of the "Show hidden plugins" toggle
			const showHiddenPlugins = localStorage.getItem(
				"show-hidden-plugins"
			);
			const shouldShowHiddenPlugins = showHiddenPlugins === "true";

			// Iterate through each community item and update its visibility
			communityItems.each(function () {
				// ! the this keyword refers to the current community item
				const itemName = $(this).find(".community-item-name").text();
				const isHidden = hiddenPlugins.includes(itemName);

				if (!isHidden) {
					// If the item is not hidden, show it and continue to the next item
					$(this)
						.removeClass(
							"better-plugins-page-hidden-community-item"
						)
						.show();
					return;
				}

				// Toggle the better-plugins-page-hidden-community-item class based on the "Show hidden plugins" toggle
				$(this).toggleClass(
					"better-plugins-page-hidden-community-item",
					shouldShowHiddenPlugins
				);
				// Show or hide the item based on the "Show hidden plugins" toggle
				shouldShowHiddenPlugins ? $(this).show() : $(this).hide();
			});

			const numberOfPlugins = communityItems.length;
			// get all the community item element with display: none style or .better-plugins-page-hidden-community-item
			const numberOfHiddenPlugins = hiddenPlugins.length;
			// set text
			searchSummary.setText(
				`Found ${numberOfPlugins} plugins, Showing ${
					numberOfPlugins - numberOfHiddenPlugins
				}, Hidden ${numberOfHiddenPlugins}`
			);

			// Add "Hide" button to all community item cards
			this.addHideButtons(communityItems);
		},
		500,
		{ leading: true, trailing: true }
	);

	// Function to create and add the "Hide" button to a community item card
	addHideButton(card: HTMLElement) {
		const that = this;
		// Check if the "Hide" button already exists in the card
		if (!card.querySelector(".hide-button")) {
			const hideButton = document.createElement("button");
			hideButton.addClasses(["hide-button", "clickable-icon"]);

			// Your SVG icon goes here
			setIcon(hideButton, "eye-off");

			hideButton.addEventListener("click", function (event) {
				event.stopImmediatePropagation();
				event.stopPropagation();
				// Add your "Hide" button click event handling logic here
				const itemName = $(card).find(".community-item-name").text();
				that.addHiddenPlugin(itemName);
			});

			card.appendChild(hideButton);
		}
	}

	// Function to add the "Hide" button to all community item cards
	addHideButtons(cards: JQuery<HTMLElement>) {
		const that = this;
		cards.each(function (index, element) {
			that.addHideButton(element);
		});
	}

	// Function to add a community item to the hidden plugins list
	addHiddenPlugin(pluginName: string) {
		const currentHiddenPlugins = getHiddenPlugins(
			this.settingManager.getSettings().hiddenPlugins
		);

		// Check if the pluginName is not already in the hidden plugins list
		if (!currentHiddenPlugins.includes(pluginName)) {
			currentHiddenPlugins.push(pluginName);
			const newHiddenPlugins = currentHiddenPlugins.join("\n");

			// Update the hidden plugins setting
			this.settingManager.updateSettings((setting) => {
				setting.value.hiddenPlugins = newHiddenPlugins;
			});
		}
	}

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

		// Observe div.community-modal-search-results in the community modal
		const communityModalSearchResults = document.querySelector(
			"div.community-modal-search-results"
		)!;

		// Configure and start observing the search results
		this.communityItemsObserver.observe(communityModalSearchResults, {
			childList: true, // Observe changes in the child nodes
			subtree: true, // Observe changes in all descendants
		});

		this.settingManager.setting.onChange((change) => {
			if (change.currentPath === "hiddenPlugins") {
				// Handle changes to the hiddenPlugins setting here
				// You can use change.newValue and change.oldValue to compare and update the filtering
				this.debouncedFilterHiddenPlugins();
			}
		});
	}

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

							// Trigger filtering when the toggle changes
							this.plugin.debouncedFilterHiddenPlugins();
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
