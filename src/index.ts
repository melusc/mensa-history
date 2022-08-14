import {extractMetadata} from './extract-metadata.js';

import {extract} from './extract.js';
import {getUrls} from './get-urls.js';
import {writeJson} from './write-json.js';

const urls = await getUrls();

const promises = urls.map(async url => {
	const data = await extract(url);

	return {
		...extractMetadata(url),
		data,
	};
});

await Promise.all(promises);

await writeJson(await Promise.all(promises));
