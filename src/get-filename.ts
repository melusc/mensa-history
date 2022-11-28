import assert from 'node:assert/strict';

import type {DayMenu} from './types.js';

const toDate = (menu: DayMenu): string =>
	`${menu.date.year}-${menu.date.month}-${menu.date.day}`;

export const getFileName = (menu: DayMenu[], location: string): string => {
	const first = menu[0];
	const last = menu.at(-1);
	assert(first);
	assert(last);

	return `${toDate(first)}_${toDate(last)}-${location}`;
};
