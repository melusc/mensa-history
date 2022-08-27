import {mkdir, writeFile} from 'node:fs/promises';

import type {Menu} from './types.js';

const outDir = new URL('../data/', import.meta.url);

export async function writeJson(
	result: Menu,
	weekNumber: string,
	year: string,
) {
	await mkdir(outDir, {
		recursive: true,
	});

	await writeFile(
		new URL(`${year}-${weekNumber}.json`, outDir),
		JSON.stringify(result, undefined, '\t'),
	);
}
