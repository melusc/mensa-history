import {mkdir, writeFile} from 'node:fs/promises';

import type {Menu} from './types.js';

const outDir = new URL('../data/', import.meta.url);

export async function writeJson(result: Menu, fileName: string) {
	await mkdir(outDir, {
		recursive: true,
	});

	await writeFile(
		new URL(`${fileName}.json`, outDir),
		JSON.stringify(result, undefined, '\t'),
	);
}
