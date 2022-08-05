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

let year = new Date().getFullYear();

// If the weekNumber is high but it is still early in the year
// it must be from the previous year.
// Week 48 is roughly the start of December
// < 2 is January and February
if (Number(weekNumber) > 48 && new Date().getMonth() < 2) {
	--year;
}

const data = await extract(new URL(url, 'https://www.ksasz.ch/'));

assert(data.title.includes(String(year)));

await writeFile(
	new URL(`${year}-${weekNumber}.json`, outDir),
	JSON.stringify(data, undefined, '\t'),
);
