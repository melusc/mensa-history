import {extract} from './extract.js';
import {getFileName} from './get-filename.js';
import {writeJson} from './write-json.js';

const urls = [
	{
		url: 'https://www.eldora-schulenpfaeffikon.ch/de/kantonsschule-pfaeffikon/kantonsschule-pfaeffikon',
		location: 'Pfäffikon',
	},
	{
		url: 'https://www.eldora-schulenpfaeffikon.ch/de/kantonsschule-nuolen/kantonsschule-nuolen',
		location: 'Nuolen',
	},
] as const;

for (const {url, location} of urls) {
	// eslint-disable-next-line no-await-in-loop
	const menu = await extract(new URL(url));

	if (menu.length === 0) {
		continue;
	}

	// eslint-disable-next-line no-await-in-loop
	await writeJson(
		{
			data: {
				menu,
				location,
			},
			version: 3,
		},
		getFileName(menu, location),
	);
}
