import assert from 'node:assert/strict';
import {inspect} from 'node:util';

import he from 'he';

import {extractMetadata} from './extract-metadata.js';
import {extract} from './extract.js';
import {getUrls} from './get-urls.js';
import {writeJson} from './write-json.js';

import type {Menu} from './types.js';

const urls = await getUrls();

const promises = urls.map(async ({url, title}) => {
	const {year, weekNumber, location} = extractMetadata(url);
	const {menus, pdfTitle} = await extract(url);

	return {
		year,
		weekNumber,
		menus,
		location,
		pdfTitle,
		linkTitle: he.decode(title),
	};
});

const result: Menu = {
	data: [],
	version: 2,
};

const weekNumbers = new Set<string>();
const years = new Set<string>();
for await (const {
	linkTitle,
	weekNumber,
	year,
	location,
	menus,
	pdfTitle,
} of promises) {
	result.data.push({
		linkTitle,
		pdfTitle,
		location,
		menus,
	});

	weekNumbers.add(weekNumber);
	years.add(year);
}

const getFromSet = <T>(set: Set<T>, name: string) => {
	assert.equal(
		set.size,
		1,
		`Did not find exactly one ${name}: ${inspect(set)}`,
	);
	return [...set][0]!;
};

const weekNumber = getFromSet(weekNumbers, 'week number');
const year = getFromSet(years, 'year');

await writeJson(result, weekNumber, year);
