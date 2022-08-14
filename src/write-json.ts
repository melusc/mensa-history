import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {inspect} from 'node:util';

import {FullMenu} from './extract.js';

const outDir = new URL('../data/', import.meta.url);

export async function writeJson(
	items: Array<{
		data: FullMenu;
		location: string;
		weekNumber: string;
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
	for (const {data, year, weekNumber, location} of items) {
		result.push({
			location,
			...data,
		});

		years.push(year);
		weekNumbers.push(weekNumber);
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
				data: result,
				version: 2,
			},
			undefined,
			'\t',
		),
	);
}
