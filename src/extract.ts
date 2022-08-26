import assert from 'node:assert/strict';
import {inspect} from 'node:util';

import {chain, findLastIndex} from 'lodash-es';
import pdfJs from 'pdfjs-dist';
import type {TextItem} from 'pdfjs-dist/types/src/display/api.js';

type PickedText = {
	str: string;
	left: number;
	bottom: number;
};

const lte = (a: number, b: number, precision = 2) =>
	// prettier-ignore
	Math.round(a * (10 ** precision)) <= Math.round(b * (10 ** precision));

const join = (items: string[]) => items.join(' ').replace(/\s+/g, ' ').trim();

const findByRegExp = (texts: PickedText[], regex: RegExp): PickedText =>
	chain(texts)
		.find(({str}) => regex.test(str))
		.tap(m => {
			assert(m, String(regex));
		})
		.value();

const getDays = (
	texts: PickedText[],
): {
	dayPositions: number[];
	dayTitles: string[];
	dayBottom: number;
} => {
	const byDayName = chain([
		/montag/i,
		/dienstag/i,
		/mittwoch/i,
		/donnerstag/i,
		/freitag/i,
	])
		.map(regex => findByRegExp(texts, regex))
		.value();

	const daysBottom = chain(byDayName)
		.map(({bottom}) => bottom)
		.thru(b => new Set(b))
		.tap(set => {
			assert(set.size === 1, 'More than one size');
		})
		.thru(set => [...set][0]!)
		.value();
	const daysLeft = byDayName.map(({left}) => left);

	const days = chain(texts)
		.filter(({bottom}) => bottom === daysBottom)
		.groupBy(({left}) => findLastIndex(daysLeft, c => lte(c, left)))
		.value();

	const titles = chain(days)
		.map(day => join(day.map(({str}) => str)))
		.value();

	return {
		dayTitles: titles,
		dayPositions: daysLeft,
		dayBottom: daysBottom,
	};
};

type SingleItem = {
	readonly title: string;
	readonly menu: readonly string[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	readonly nutritional: null | readonly string[];
	readonly price: readonly string[];
};

type WeekMenu = SingleItem[][];

const menuTitlesRegex
	= /^\s*(?:supp[äe]|w[äe]ltreise?|karma|streetfood|salatbar|süe?sses)\s*$/i;

const getMenus = (
	texts: PickedText[],
	dayBottom: number,
	dayPositions: number[],
): WeekMenu => {
	const filtered = chain(texts)
		.filter(({bottom}) => bottom < dayBottom)
		.value();

	const titlePositions = chain(filtered)
		.filter(({str}) => menuTitlesRegex.test(str))
		.groupBy(({str}) => str.toLowerCase().trim())
		.map(items => Math.max(...items.map(({bottom}) => bottom)))
		.value();

	const groupedByDay = chain(filtered)
		.groupBy(({left}) => findLastIndex(dayPositions, l => lte(l, left, 1)))
		.values()
		.value();

	const groupedByType = groupedByDay.map(day =>
		chain(day)
			.groupBy(({bottom}) => findLastIndex(titlePositions, b => lte(bottom, b)))
			.values()
			.tap(day => {
				assert(
					day.length <= 6 && day.length > 0,
					`Unexpected day.length: ${inspect(day)}`,
				);
			})
			.value(),
	);

	const groupedByRow = groupedByType.map(day =>
		day.map(menu =>
			chain(menu)
				.groupBy(({bottom}) => Math.round(bottom))
				.entries()
				.orderBy(v => Number(v[0]), ['desc'])
				.map(([, value]) => join(value.map(({str}) => str)))
				.tap(menu => {
					// Title
					// Menu
					// optional nutritional value
					// Price
					assert(menu.length >= 3, `menu.length <= 1: ${JSON.stringify(menu)}`);
				})
				.value(),
		),
	);

	return groupedByRow.map(day =>
		day.map(menu => {
			menu = menu.filter(Boolean);
			// Title: One line
			// ...Menu: Many lines
			// ...nutritional value: Probably only one line
			// ...price: one or two lines

			const priceFirstIndex = menu.findIndex(
				row =>
					/chf/i.test(row)
					// To not match nutritional values by accident
					// it should not be too general
					// Only "soup" and "dessert" prices are without "CHF" and both are 3.50
					|| row.trim() === '3.50',
			);

			// Optional: maybe -1
			const nutritionalFirstIndex = menu.findIndex(row => /kcal/i.test(row));

			const inspected = inspect(menu);
			assert(priceFirstIndex !== -1, `Price not found ${inspected}`);

			assert(
				priceFirstIndex !== nutritionalFirstIndex,
				`Price matched nutritional values: ${inspected}`,
			);

			if (nutritionalFirstIndex !== -1) {
				assert(
					nutritionalFirstIndex < priceFirstIndex,
					`Price was before nutritional ${inspected}`,
				);
			}

			const menuTo
				= nutritionalFirstIndex === -1 ? priceFirstIndex : nutritionalFirstIndex;

			const title = menu[0];

			assert(
				title && menuTitlesRegex.test(title),
				`Unexpected title: "${title!}", ${inspected}`,
			);

			return {
				title: menu[0]!,
				menu: menu.slice(1, menuTo),
				nutritional:
					nutritionalFirstIndex === -1
						? null
						: menu.slice(nutritionalFirstIndex, priceFirstIndex),
				price: menu.slice(priceFirstIndex),
			};
		}),
	);
};

export type FullMenu = {
	menu: WeekMenu;
	title: string;
	days: string[];
};

export const extract = async (url: URL): Promise<FullMenu> => {
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

	const titleBottom = findByRegExp(texts, /restaurant eldora/i).bottom;
	const title = chain(texts)
		.filter(({bottom}) => bottom === titleBottom)
		.map(({str}) => str)
		.thru(items => items.join('').replace(/\s+/g, ' ').trim())
		.value();

	const {dayBottom, dayPositions, dayTitles} = getDays(texts);

	return {
		title,
		days: dayTitles,
		menu: getMenus(texts, dayBottom, dayPositions),
	};
};
