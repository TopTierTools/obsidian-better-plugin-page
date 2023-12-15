import { Notice, setIcon, setTooltip, Plugin, TFile } from "obsidian";

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
import { getPlugins } from "./getPlugins";
import { getName, prunedName } from "./getName";
import { getUpdatedWithinMilliseconds } from "./getUpdatedWithinMilliseconds";
import { NoticeManager } from "@/NoticeManager";
import { BetterPluginsPagePluginSettingTab } from "@/BetterPluginsPagePluginSettingTab";

export default class BetterPluginsPagePlugin extends Plugin {
	settingManager: MySettingManager;
	noticeManager: NoticeManager;

	isPluginsPagePresentObserver: MutationObserver;
	modalContentObserver: MutationObserver;
	lock = false;

	// we need this observer to observe the search results changes
	communityItemsObserver = new MutationObserver((mutationsList) => {
		// Check if there are changes in the search results
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				if (this.lock) return;
				this.debouncedFilterPlugins();
			}
		}
	});

	async onload() {
		// initialize the setting manager and notice manager
		this.settingManager = new MySettingManager(this);
		this.noticeManager = new NoticeManager(this);

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
		// Disconnect the modal content observer
		this.modalContentObserver?.disconnect();
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

	debouncedFilterPlugins = debounce(
		() => {
			// Get all community items and store them in an array
			const communityItems = Array.from(
				document.querySelectorAll(".community-item")
			);
			try {
				this.lock = true;

				// Get filter options from localStorage
				const downloadCountCompare =
					localStorage.getItem("download-count-compare") ??
					DownloadCountCompareOption.greater;
				const downloadCount = parseInt(
					localStorage.getItem("download-count") ?? "0",
					10
				);
				const updatedWithinCompare =
					localStorage.getItem("updated-within-compare") ??
					UpdatedFilterOption.Within;
				const updatedWithin =
					localStorage.getItem("updated-within") ??
					UpdatedTimeRangeOption.none;
				const onlyShowSavedPlugins =
					localStorage.getItem("show-saved-plugins") === "true";
				const showHiddenPlugins =
					localStorage.getItem("show-hidden-plugins") === "true";

				// Get settings from the setting manager
				const settings = this.settingManager.getSettings();

				communityItems.forEach((element) => {
					const jElement = $(element);
					const itemName = getName(element as HTMLElement);

					// Check if the plugin is saved
					const isSaved =
						settings.savedPluginsArray.includes(itemName);
					element.setAttribute("data-saved", isSaved.toString());

					if (downloadCount > 0) {
						const downloadsText = jElement
							.find(".community-item-downloads-text")
							.text()
							.replace(/,/g, "");
						const itemDownloads = parseInt(downloadsText, 10);

						if (
							(downloadCountCompare === "greater" &&
								itemDownloads <= downloadCount) ||
							(downloadCountCompare === "less" &&
								itemDownloads >= downloadCount)
						) {
							jElement.hide();
							return;
						}
					}

					if (updatedWithin !== UpdatedTimeRangeOption.none) {
						const updatedWithinMilliseconds =
							getUpdatedWithinMilliseconds(updatedWithin);
						const updatedText = jElement
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
								jElement.show();
							} else {
								jElement.hide();
								return;
							}
						}
					}

					if (onlyShowSavedPlugins && !isSaved) {
						jElement.hide();
						return;
					}

					const isHidden =
						settings.hiddenPluginsArray.includes(itemName);

					if (!isHidden) {
						jElement
							.removeClass(
								"better-plugins-page-hidden-community-item"
							)
							.show();
					} else {
						jElement.toggleClass(
							"better-plugins-page-hidden-community-item",
							showHiddenPlugins
						);
						showHiddenPlugins ? jElement.show() : jElement.hide();
					}
				});
			} catch (e) {
				console.error(e);
				// Handle the error
			} finally {
				this.lock = false;
				const summaryText = document.querySelector(
					".community-modal-search-summary"
				);
				this.addButtons(communityItems as HTMLElement[]);
				const visiblePlugins = communityItems.filter(
					(element: HTMLDivElement) =>
						!(element.style.display === "none")
				).length;
				summaryText?.setText(`Showing ${visiblePlugins} plugins:`);
			}
		},
		500,
		{ leading: true, trailing: true }
	);

	// Function to add the "Hide" and "Show" buttons to all community item cards
	addButtons(cards: HTMLElement[]) {
		cards.forEach((element) => {
			const card = element;
			const isInstalledPlugin =
				$(element).find(
					".community-item-name .flair.mod-pop:contains('Installed')"
				).length > 0;

			// set the data-installed attribute to the card
			card.setAttribute("data-installed", isInstalledPlugin.toString());

			// Check if the buttons container already exists in the card
			let buttonsContainer = card.querySelector(
				".buttons-container"
			) as HTMLDivElement;

			if (!buttonsContainer) {
				// Create the buttons container with a column layout
				buttonsContainer = document.createElement("div");
				buttonsContainer.classList.add("buttons-container");

				// Define button configurations
				const buttonConfigs = [
					{
						className: "hide-button",
						icon: "eye-off",
						tooltip: "Hide",
						toggle: true,
						settingKey: "hiddenPlugins",
					},
					{
						className: "show-button",
						icon: "eye",
						tooltip: "Show",
						toggle: false,
						settingKey: "hiddenPlugins",
					},
					{
						className: "save-button",
						icon: "star",
						tooltip: "Save",
						toggle: true,
						settingKey: "savedPlugins",
					},
					{
						className: "unsave-button",
						icon: "star-off",
						tooltip: "Unsave",
						toggle: false,
						settingKey: "savedPlugins",
					},
				] as const;

				buttonConfigs.forEach((config) => {
					const button = document.createElement("button");
					button.classList.add(config.className, "clickable-icon");
					setIcon(button, config.icon);
					setTooltip(button, config.tooltip);

					button.addEventListener("click", (event) => {
						event.stopImmediatePropagation();
						event.stopPropagation();
						const itemName = getName(card);
						this.togglePlugin(
							itemName,
							config.toggle,
							config.settingKey
						);
					});

					// Append the button to the container
					buttonsContainer.appendChild(button);
				});

				// Append the container to the card
				card.appendChild(buttonsContainer);
			}
		});
	}

	/**
	 * Function to toggle a community item to the hidden or saved plugins list.
	 * @param {string} pluginName - The name of the plugin to toggle.
	 * @param {boolean} toggle - Whether to toggle (hide/save) the plugin.
	 * @param {string} settingKey - The key for the setting ("hiddenPlugins" or "savedPlugins").
	 */
	togglePlugin(
		pluginName: string,
		toggle: boolean,
		settingKey: "hiddenPlugins" | "savedPlugins"
	) {
		const settingValue = getPlugins(
			this.settingManager.getSettings()[settingKey]
		);
		const pluginIndex = settingValue.indexOf(pluginName);

		if (toggle && pluginIndex === -1) {
			settingValue.push(pluginName);
		} else if (!toggle && pluginIndex !== -1) {
			settingValue.splice(pluginIndex, 1);
		}

		this.updateSettingAndFilter(settingValue, settingKey);
	}

	/**
	 * Update the setting and trigger the filter function.
	 * @param {string[]} updatedSetting - The updated setting array (hidden or saved plugins).
	 * @param {string} settingKey - The key for the setting ("hiddenPlugins" or "savedPlugins").
	 */
	updateSettingAndFilter(
		updatedSetting: string[],
		settingKey: "hiddenPlugins" | "savedPlugins"
	) {
		const newSetting = updatedSetting.join("\n");

		// Update the corresponding setting
		this.settingManager.updateSettings((setting) => {
			setting.value[settingKey] = newSetting;
			this.debouncedFilterPlugins();
		});
	}

	tryGetNote = (pluginName: string) => {
		// get the note path from the setting cache
		// const notePath =
		// 	this.settingManager.getSettings().pluginNoteCache[pluginName];

		// try to get the note from the path
		// const note = this.app.vault.getAbstractFileByPath(
		// 	notePath ?? ""
		// ) as TFile | null;

		// get the note with title equal to pluginName
		// if the note doesn't exist, then simply return
		// if the note exists, then we create a button to link to the note
		// if (note) return note;

		const notes = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.basename === pluginName);
		if (notes.length === 0) return null;
		if (notes.length > 1) {
			this.noticeManager.createNotice(
				"There are multiple plugin notes with the same name. Open the first note discovered. But please rename the notes to be unique.",
				5000,
				"warning"
			);
		}

		const targetNote = notes[0]!;
		// save this note path to the setting cache
		this.settingManager.updateSettings((setting) => {
			setting.value.pluginNoteCache[pluginName] = targetNote.path;
		});
		return targetNote;
	};

	onPluginDetailsShow() {
		const communityModalButtonContainer = document.querySelector(
			"div.community-modal-button-container"
		) as HTMLDivElement;

		if (!communityModalButtonContainer) return;

		const existingButton = communityModalButtonContainer.querySelector(
			".add-note-link-button"
		);

		if (!existingButton) {
			const pluginNameElement = document.querySelector(
				".community-modal-info-name"
			);

			if (!pluginNameElement) return;

			const pluginName = prunedName(pluginNameElement.textContent || "");

			if (pluginName) {
				const note = this.tryGetNote(pluginName);

				const button = document.createElement("button");
				button.classList.add("add-note-link-button");
				button.textContent = note ? "My Note" : "Create Note";
				setTooltip(
					button,
					note ? note.path : `Create ${pluginName}.md`
				);

				button.addEventListener("click", async () => {
					if (!note) {
						const newNote = await this.app.vault.create(
							`${pluginName}.md`,
							""
						);
						this.app.workspace.getLeaf().openFile(newNote);
					} else {
						this.app.workspace.getLeaf().openFile(note);
					}

					const closeButton = $(
						".modal-container .modal-close-button"
					) as JQuery<HTMLButtonElement>;
					closeButton.trigger("click");
				});

				communityModalButtonContainer.appendChild(button);
			}
		}
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

		if (this.settingManager.getSettings().pluginNoteFeatureEnabled)
			this.modalContentObserver = observeIsPresent(
				".community-modal-details .community-modal-info-name",
				(isPresent) => {
					if (isPresent) {
						this.onPluginDetailsShow();
					} else {
						// dummy
					}
				}
			);

		// set timeout 500 ms and then trigger the filtering
		setTimeout(() => {
			this.debouncedFilterPlugins();
		}, 500);
	}

	createNotice = (
		...props: Parameters<NoticeManager["createNotice"]>
	): Notice => this.noticeManager.createNotice(...props);

	onunload() {
		super.onunload();
		this.isPluginsPagePresentObserver.disconnect();
		this.communityItemsObserver.disconnect(); // Disconnect the communityItemsObserver
	}
}
