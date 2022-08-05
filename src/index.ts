import assert from 'node:assert/strict';
import {writeFile, mkdir} from 'node:fs/promises';
import {extractMetadata} from './extract-metadata.js';

import {extract} from './extract.js';
import {getUrl} from './get-url.js';

const outDir = new URL('../data/', import.meta.url);
await mkdir(outDir, {
	recursive: true,
});

const url = await getUrl();
const {year, weekNumber} = extractMetadata(url);
const data = await extract(url);

assert(
	data.title.includes(String(year)),
	`Title did not contain year (${year})`,
);

await writeFile(
	new URL(`${year}-${weekNumber}.json`, outDir),
	JSON.stringify(data, undefined, '\t'),
);
