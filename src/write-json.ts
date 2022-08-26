import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {inspect} from 'node:util';

import type {FullMenu} from './extract.js';

const outDir = new URL('../data/', import.meta.url);

export async function writeJson(
	items: Array<{
		data: FullMenu;
		location: string;
		weekNumber: string;
		title: string;
		year: string;
	}>,
) {
	const result: Array<
		FullMenu & {
			location: string;
		}
	> = [];
	const years: string[] = [];
	const weekNumbers: string[] = [];
	const titles: string[] = [];
	for (const {data, year, weekNumber, location, title} of items) {
		result.push({
			location,
			...data,
		});

		years.push(year);
		weekNumbers.push(weekNumber);
		titles.push(title);
	}

	assert(
		new Set(weekNumbers).size === 1,
		`More than one week number: ${inspect(weekNumbers)}`,
	);
	assert(new Set(years).size === 1, `More than one year: ${inspect(years)}`);

	await mkdir(outDir, {
		recursive: true,
	});

	await writeFile(
		new URL(`${years[0]!}-${weekNumbers[0]!}.json`, outDir),
		JSON.stringify(
			{
				titles,
				data: result,
				version: 2,
			},
			undefined,
			'\t',
		),
	);
}
