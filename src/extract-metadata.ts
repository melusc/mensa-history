import assert from 'node:assert/strict';

export const extractMetadata = (
	url: URL,
): {
	weekNumber: string;
	year: string;
	location: 'P' | 'N';
} => {
	const match = /mewo(?<weekNumber>\d+)(?<location>n?)\.pdf/i.exec(url.href);

	const groups = match?.groups;

	assert(groups, 'Could not get week number');
	const {weekNumber, location} = groups;
	// This cannot fail, it's a type guard
	assert(weekNumber, 'weekNumber');
	assert(typeof location === 'string', 'location');

	let year = new Date().getFullYear();

	// If the weekNumber is high but it is still early in the year
	// it must be from the previous year.
	// Week 48 is roughly the start of December
	// < 2 is January and February
	if (Number(weekNumber) > 48 && new Date().getMonth() < 2) {
		--year;
	}

	return {
		year: String(year),
		weekNumber,
		location: (location.toUpperCase() as 'N') || 'P',
	};
};
