import assert from 'node:assert/strict';

export const extractMetadata = (
	url: URL,
): {
	weekNumber: string;
	year: string;
} => {
	const match = /mewo(?<weekNumber>\d+)\.pdf/i.exec(url.href);
	console.log(url.href);

	const groups = match?.groups;

	assert(groups, 'Could not get week number');
	const {weekNumber} = groups;
	// This cannot fail, it's a type guard
	assert(weekNumber, 'weekNumber');

	let year = new Date().getFullYear();

	// If the weekNumber is high but it is still early in the year
	// it must be from the previous year.
	// Week 48 is roughly the start of December
	// < 2 is January and February
	if (Number(weekNumber) > 48 && new Date().getMonth() < 2) {
		--year;
	}

	return {year: String(year), weekNumber};
};
