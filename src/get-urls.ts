import assert from 'node:assert/strict';

const mensaUrl = new URL('https://www.ksasz.ch/de/service/angebote/mensa');

export const getUrls = async (): Promise<URL[]> => {
	const pageResponse = await fetch(mensaUrl);
	const pageText = await pageResponse.text();

	const urlMatches = pageText.matchAll(
		/<a href="(?<url>\/images\/pdf-dokumente\/mensa\/mewo\d+n?\.pdf)" target="_blank">/gi,
	);

	const urls: URL[] = [];
	for (const match of urlMatches ?? []) {
		const {groups} = match;
		assert(groups, 'Could not find anchor with url');
		const {url} = groups;
		// This cannot fail, it's a type guard
		assert(url, 'Could net extract url');

		urls.push(new URL(url, mensaUrl));
	}

	return urls;
};
