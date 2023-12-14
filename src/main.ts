import { Plugin, setIcon, setTooltip } from "obsidian";
import "@total-typescript/ts-reset";
import "@total-typescript/ts-reset/dom";
import { MySettingManager } from "@/SettingManager";
import $ from "jquery";
import { observeIsPresent } from "@/observer";
import debounce from "lodash/debounce";
import * as chrono from "chrono-node";
// import { BetterPluginsPagePluginSettingTab } from "./BetterPluginsPagePluginSettingTab";
import {
	DownloadCountCompareOption,
	FilterModal,
	UpdatedFilterOption,
	UpdatedTimeRangeOption,
} from "./FilterModal";
import { getHiddenPlugins } from "./getHiddenPlugins";
import { getName } from "./getName";
import { getUpdatedWithinMilliseconds } from "./getUpdatedWithinMilliseconds";

export default class BetterPluginsPagePlugin extends Plugin {
	settingManager: MySettingManager;
	isPluginsPagePresentObserver: MutationObserver;
	lock = false;

	// we need this observer to observe the search results changes
	communityItemsObserver = new MutationObserver((mutationsList) => {
		// Check if there are changes in the search results
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				if (this.lock) return;
				this.debouncedFilterHiddenPlugins();
				// console.log("communityItemsObserver", mutationsList);
			}
		}
	});

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
		// this.addSettingTab(
		// 	new BetterPluginsPagePluginSettingTab(this.app, this)
		// );

		this.isPluginsPagePresentObserver = observeIsPresent(
			"div.mod-community-modal",
			(isPresent) => {
				if (isPresent) {
					this.onPluginsPageShow();
				} else {
					this.onPluginsPageClose();
				}
			}
		);
	}

	onPluginsPageClose = () => {
		// Disconnect the observer
		this.communityItemsObserver.disconnect();
	};

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

	debouncedFilterHiddenPlugins = debounce(
		() => {
			const that = this;
			const communityItems = $(".community-item");
			try {
				this.lock = true;
				// console.log("debouncedFilterHiddenPlugins");
				const downloadCountCompare =
					localStorage.getItem("download-count-compare") ??
					DownloadCountCompareOption.greater;
				const downloadCount =
					localStorage.getItem("download-count") ?? "";

				const updatedWithinCompare =
					localStorage.getItem("updated-within-compare") ??
					UpdatedFilterOption.Within;
				const updatedWithin =
					localStorage.getItem("updated-within") ??
					UpdatedTimeRangeOption.none;

				const downloadCountValue = parseInt(downloadCount, 10);

				if (
					this.settingManager.getSettings().hiddenPluginsArray
						.length === 0 &&
					!downloadCount &&
					!updatedWithin
				) {
					communityItems
						.removeClass(
							"better-plugins-page-hidden-community-item"
						)
						.show();
					return;
				}

				const showHiddenPlugins = localStorage.getItem(
					"show-hidden-plugins"
				);
				const shouldShowHiddenPlugins = showHiddenPlugins === "true";

				communityItems.each(function () {
					if (downloadCountValue) {
						const downloadsText = $(this)
							.find(".community-item-downloads-text")
							.text()
							.replace(/,/g, "");
						const itemDownloads = parseInt(downloadsText, 10);

						if (
							(downloadCountCompare === "greater" &&
								itemDownloads <= downloadCountValue) ||
							(downloadCountCompare === "less" &&
								itemDownloads >= downloadCountValue)
						) {
							$(this).hide();
							return;
						} else {
							$(this).show();
						}
					}

					if (updatedWithin !== UpdatedTimeRangeOption.none) {
						const updatedWithinMilliseconds =
							getUpdatedWithinMilliseconds(updatedWithin);

						const updatedText = $(this)
							.find(".community-item-updated")
							.text()
							.replace("Updated ", "");
						const updatedDate = chrono.parseDate(updatedText);

						if (updatedDate) {
							const currentDate = new Date();
							const timeDifference =
								currentDate.getTime() - updatedDate.getTime();

							if (
								(updatedWithinCompare ===
									UpdatedFilterOption.Within &&
									timeDifference <=
										updatedWithinMilliseconds) ||
								(updatedWithinCompare ===
									UpdatedFilterOption.Before &&
									timeDifference > updatedWithinMilliseconds)
							) {
								$(this).show();
							} else {
								$(this).hide();
								return;
							}
						}
					}

					const itemName = getName(this);
					const isHidden = that.settingManager
						.getSettings()
						.hiddenPluginsArray.includes(itemName);

					if (!isHidden) {
						$(this)
							.removeClass(
								"better-plugins-page-hidden-community-item"
							)
							.show();
						return;
					}

					$(this).toggleClass(
						"better-plugins-page-hidden-community-item",
						shouldShowHiddenPlugins
					);
					shouldShowHiddenPlugins ? $(this).show() : $(this).hide();
				});
			} catch (e) {
				// Handle the error
			} finally {
				this.lock = false;
				const summaryText = document.querySelector(
					".community-modal-search-summary"
				);
				this.addHideButtons(communityItems);
				// get the number of visible plugins
				const visiblePlugins = $(".community-item:visible").length;
				summaryText?.setText(`Showing ${visiblePlugins} plugins:`);
			}
		},
		500,
		{ leading: true, trailing: true }
	);

	// Function to add the "Hide" and "Show" buttons to all community item cards
	addHideButtons(cards: JQuery<HTMLElement>) {
		cards.each((index, element) => {
			const card = element;
			const isInstalledPlugin =
				$(element).find(
					".community-item-name .flair.mod-pop:contains('Installed')"
				).length > 0;

			// if (isInstalledPlugin) {
			// 	const itemName = getName(card);
			// 	console.log("isInstalledPlugin", isInstalledPlugin, itemName);
			// }

			if (!isInstalledPlugin) {
				// Check if the "Hide" button already exists in the card
				let hideButton = card.querySelector(
					".hide-button"
				) as HTMLButtonElement;

				if (!hideButton) {
					// Create the "Hide" button
					hideButton = document.createElement("button");
					hideButton.classList.add("hide-button", "clickable-icon");
					setIcon(hideButton, "eye-off");
					setTooltip(hideButton, "Hide");

					// Create the "Show" button
					const showButton = document.createElement("button");
					showButton.classList.add("show-button", "clickable-icon");
					setIcon(showButton, "eye");
					setTooltip(showButton, "Show");

					// Add click event listeners to both buttons
					hideButton.addEventListener("click", (event) => {
						event.stopImmediatePropagation();
						event.stopPropagation();
						// Get the item name of the community item that this button belongs to
						const itemName = getName(card);
						this.toggleHiddenPlugin(itemName, true);
					});

					showButton.addEventListener("click", (event) => {
						event.stopImmediatePropagation();
						event.stopPropagation();
						const itemName = getName(card);
						this.toggleHiddenPlugin(itemName, false);
					});

					// Append both buttons to the card
					card.appendChild(hideButton);
					card.appendChild(showButton);
				}
			}
		});
	}

	/**
	 * Function to toggle a community item to the hidden plugins list.
	 * If the plugin is already in the hidden plugins list, then it will be removed from the list.
	 * If the plugin is not in the hidden plugins list, it will be added to the list.
	 * @param {string} pluginName - The name of the plugin to toggle.
	 */
	// Function to toggle a community item to the hidden plugins list
	toggleHiddenPlugin(pluginName: string, hide: boolean) {
		const currentHiddenPlugins = getHiddenPlugins(
			this.settingManager.getSettings().hiddenPlugins
		);
		// if hide is true, then we hide the plugin
		// else we removed the plugin from the hidden plugins list

		if (hide) {
			if (!currentHiddenPlugins.includes(pluginName)) {
				currentHiddenPlugins.push(pluginName);
			}
		} else {
			const index = currentHiddenPlugins.indexOf(pluginName);
			if (index !== -1) {
				currentHiddenPlugins.splice(index, 1);
			}
		}

		const newHiddenPlugins = currentHiddenPlugins.join("\n");

		// Update the hidden plugins setting
		this.settingManager.updateSettings((setting) => {
			setting.value.hiddenPlugins = newHiddenPlugins;
			// console.log("hiddenPlugins", this.hiddenPlugins);
			this.debouncedFilterHiddenPlugins();
		});
	}

	onPluginsPageShow() {
		const settingItemControl = $(
			".community-modal-controls .setting-item:not('.mod-toggle') .setting-item-control"
		);

		if (
			!settingItemControl.find(".better-plugins-page-filter-btn").length
		) {
			const button = $("<button></button>")
				.addClass("clickable-icon")
				.addClass("better-plugins-page-filter-btn")
				.on("click", () => new FilterModal(this).open());

			setIcon(button[0] as HTMLButtonElement, "filter");
			setTooltip(button[0] as HTMLButtonElement, "Filter");
			settingItemControl.append(button);
		}

		const communityModalSearchResults = document.querySelector(
			"div.community-modal-search-results"
		)!;
		this.communityItemsObserver.observe(communityModalSearchResults, {
			childList: true,
			subtree: true,
		});

		// set timeout 500 ms and then trigger the filtering
		setTimeout(() => {
			this.debouncedFilterHiddenPlugins();
		}, 500);
	}

	onunload() {
		super.onunload();
		this.isPluginsPagePresentObserver.disconnect();
		this.communityItemsObserver.disconnect(); // Disconnect the communityItemsObserver
	}
}
