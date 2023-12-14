export const getUpdatedWithinMilliseconds = (updatedWithin: string) => {
	let updatedWithinMilliseconds = 0;
	if (updatedWithin === "1-week")
		updatedWithinMilliseconds = 7 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === "2-week")
		updatedWithinMilliseconds = 14 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === "1-month")
		updatedWithinMilliseconds = 30 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === "3-month")
		updatedWithinMilliseconds = 90 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === "6-month")
		updatedWithinMilliseconds = 180 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === "1-year")
		updatedWithinMilliseconds = 365 * 24 * 60 * 60 * 1000;
	return updatedWithinMilliseconds;
};
