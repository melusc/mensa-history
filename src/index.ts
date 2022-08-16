import he from 'he';

import {extractMetadata} from './extract-metadata.js';

import {extract} from './extract.js';
import {getUrls} from './get-urls.js';
import {writeJson} from './write-json.js';

const urls = await getUrls();

const promises = urls.map(async ({url, title}) => {
	const metadata = extractMetadata(url);
	const data = await extract(url);

	return {
		...metadata,
		title: he.decode(title),
		data,
	};
});

await writeJson(await Promise.all(promises));
