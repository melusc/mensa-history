import assert from 'node:assert/strict';
import {writeFile, mkdir} from 'node:fs/promises';

import {extract} from './extract.js';

const outDir = new URL('../data/', import.meta.url);
await mkdir(outDir, {
	recursive: true,
});

const pageResponse = await fetch(
	'https://www.ksasz.ch/de/service/angebote/mensa',
);
const pageText = await pageResponse.text();

const urlMatch
	= /<a href="(?<url>\/images\/pdf-dokumente\/mensa\/mewo(?<weekNumber>\d+)\.pdf)" target="_blank">/i.exec(
		pageText,
	);

const groups = urlMatch?.groups;
assert(groups, 'groups');
const {url, weekNumber} = groups;
assert(url, 'url');
assert(weekNumber, 'weekNumber');

const data = await extract(url);
await writeFile(
	new URL(`${weekNumber}.json`, outDir),
	JSON.stringify(data, undefined, '\t'),
);
