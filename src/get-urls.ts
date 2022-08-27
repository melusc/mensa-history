import assert from 'node:assert/strict';

const mensaUrl = new URL('https://www.ksasz.ch/de/service/angebote/mensa');

export const getUrls = async (): Promise<
	Array<{
		url: URL;
		title: string;
	}>
> => {
	const pageResponse = await fetch(mensaUrl);
	const pageText = await pageResponse.text();

	const urlMatches = pageText.matchAll(
		/<a href="(?<url>.+?\/mensa\/.+?)".*?>(?<title>.+?)<\/a>/gi,
	);

	const result: Array<{
		url: URL;
		title: string;
	}> = [];
	for (const match of urlMatches ?? []) {
		const {groups} = match;
		assert(groups, 'Could not find anchor with url');
		const {url, title} = groups;
		// This cannot fail, it's a type guard
		assert(url, 'Could net extract url');
		assert(title, 'Could net extract title');

		result.push({url: new URL(url, mensaUrl), title});
	}

	return result;
};
