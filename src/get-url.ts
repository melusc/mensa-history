import assert from 'node:assert/strict';

const mensaUrl = new URL('https://www.ksasz.ch/de/service/angebote/mensa');

export const getUrl = async () => {
	const pageResponse = await fetch(mensaUrl);
	const pageText = await pageResponse.text();

	const urlMatch
		= /<a href="(?<url>\/images\/pdf-dokumente\/mensa\/mewo\d+\.pdf)" target="_blank">/i.exec(
			pageText,
		);

	const groups = urlMatch?.groups;
	assert(groups, 'groups');
	const {url} = groups;
	assert(url, 'url');

	return new URL(url, mensaUrl);
};
