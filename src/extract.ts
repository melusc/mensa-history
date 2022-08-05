import assert from 'node:assert/strict';

import {chain, findIndex, findLastIndex} from 'lodash-es';
import pdfJs from 'pdfjs-dist';
import {TextItem} from 'pdfjs-dist/types/src/display/api.js';

type PickedText = {
	str: string;
	left: number;
	bottom: number;
};

const findByRegExp = (texts: PickedText[], matcher: RegExp): PickedText =>
	chain(texts)
		.find(({str}) => matcher.test(str))
		.tap(m => {
			assert(m, String(matcher));
		})
		.value();

export const extract = async (
	url: URL,
): Promise<{title: string; menu: string[][][]}> => {
	const pdf = await pdfJs.getDocument(url).promise;
	const page = await pdf.getPage(1);

	const {items} = await page.getTextContent();

	const texts = chain(items as TextItem[])
		.map(({str, transform}): PickedText => {
			const left = transform[4] as unknown;
			const bottom = transform[5] as unknown;

			assert(typeof str === 'string');
			assert(typeof left === 'number');
			assert(typeof bottom === 'number');
			return {
				str,
				left,
				bottom,
			};
		})
		.orderBy(['bottom', 'left'], ['desc', 'asc'])
		.value();

	const titleBottom = findByRegExp(texts, /menü der woche/i).bottom;
	const title = chain(texts)
		.filter(({bottom}) => bottom === titleBottom)
		.map(({str}) => str)
		.join('')
		.value();

	const borderBottom = findByRegExp(texts, /^\s*deklaration:/i).bottom;
	const borderTop = findByRegExp(texts, /^\s*montag/i).bottom;
	const borderLeft = findByRegExp(texts, /^menü 1/i).left;

	const dayIndices = chain(texts)
		.filter(({str}) =>
			/^(?:montag|dienstag|mittwoch|donnerstag|freitag)$/i.test(str),
		)
		.map(({bottom}) => bottom)
		.tap(r => {
			assert.equal(r.length, 5);
		})
		.value();

	const menuIndices = chain(texts)
		.filter(
			({str, bottom}) =>
				/^(?:menü [12]|vegi)$/i.test(str) && bottom > borderTop, // Sometimes there's things like "vegi-burger"
			// that get's split in to "vegi", "-", "burger"
			// therefore we also need to make sure it's high enough
		)
		.tap(c => {
			assert.equal(c.length, 3);
		})
		.map(({left}) => left)
		.value();

	const filtered = chain(texts)
		.filter(
			({bottom, left}) =>
				left >= borderLeft && bottom > borderBottom && bottom <= borderTop,
		)
		.tap(filtered => {
			assert(filtered.length > 0);
		});
	const dayGrouped = filtered
		// Group by day
		.groupBy(({bottom}) => findIndex(dayIndices, r => r < bottom));
	const menuGrouped = dayGrouped.map(day =>
		chain(day)
			// Group by menu
			.groupBy(({left}) => findLastIndex(menuIndices, c => c <= left))
			.map(menu =>
				chain(menu)
					// Group by row in block
					.groupBy(({bottom}) => bottom)
					.map(row =>
						row
							.map(({str}) => str)
							.join('')
							.trim(),
					)
					.filter(row => row.length > 0)
					.value(),
			)
			.tap(day => {
				// Things like "Happy Easter" is length 1
				assert(day.length === 3 || day.length === 1);
			})
			.value(),
	);

	return {
		title,
		menu: menuGrouped.value(),
	};
};
