import { UpdatedTimeRangeOption } from "@/FilterModal";

export const getUpdatedWithinMilliseconds = (updatedWithin: string) => {
	let updatedWithinMilliseconds = 0;
	if (updatedWithin === UpdatedTimeRangeOption.OneWeek)
		updatedWithinMilliseconds = 7 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === UpdatedTimeRangeOption.TwoWeek)
		updatedWithinMilliseconds = 14 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === UpdatedTimeRangeOption.OneMonth)
		updatedWithinMilliseconds = 30 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === UpdatedTimeRangeOption.ThreeMonth)
		updatedWithinMilliseconds = 90 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === UpdatedTimeRangeOption.SixMonth)
		updatedWithinMilliseconds = 180 * 24 * 60 * 60 * 1000;
	else if (updatedWithin === UpdatedTimeRangeOption.OneYear)
		updatedWithinMilliseconds = 365 * 24 * 60 * 60 * 1000;
	return updatedWithinMilliseconds;
};
