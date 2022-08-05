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
	assert(groups, 'Could not find anchor with url');
	const {url} = groups;
	// This cannot fail, it's a type guard
	assert(url, 'Could net extract url');

	return new URL(url, mensaUrl);
};
