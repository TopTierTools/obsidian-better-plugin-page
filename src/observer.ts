export function observeIsPresent(
	selector: string,
	onChange?: (isPresent: boolean) => void
) {
	let isTargetNodePresent = false;

	// Create a new MutationObserver with a callback function
	const observer = new MutationObserver(function () {
		// Select the target node
		const targetNode = document.querySelector(selector);

		// Check whether the target node exists
		const isPresentNow = !!targetNode;

		if (isPresentNow && !isTargetNodePresent) {
			// The target node has appeared
			if (onChange) onChange(true);
			isTargetNodePresent = true;
		} else if (!isPresentNow && isTargetNodePresent) {
			// The target node has disappeared
			if (onChange) onChange(false);
			isTargetNodePresent = false;
		}
	});

	// Start observing the changes in the document body (or any relevant parent node)
	observer.observe(document.body, { childList: true, subtree: true });
	return observer;
}
