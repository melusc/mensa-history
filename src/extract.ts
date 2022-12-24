import assert from 'node:assert/strict';

import {load, type AnyNode, type Cheerio, type CheerioAPI} from 'cheerio';
import type {DayMenu, SingleItem} from './types.js';

const getHtml = async (url: URL) => {
	const request = await fetch(url);
	const text = await request.text();
	return load(text);
};

const parseDateFilter = (date: string) => {
	date = date.trim();
	const match = /\b(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})$/.exec(date);

	assert(match?.groups);
	const {year, month, day} = match.groups;
	assert(year && month && day);

	return {
		year,
		month,
		day,
	};
};

type DataExtractor<T> = ($menu: Cheerio<AnyNode>, $: CheerioAPI) => T;

const getAllergens: DataExtractor<
	Array<{
		title: string;
		icon: string;
	}>
> = ($menu, $) => {
	const $list = $menu.find(
		'.menu-nutrition-infos-popup__body__allergens__icons',
	);
	return $list.toArray().map(element => {
		const $item = $(element);
		const $img = $item.find('img');
		const icon = $img.attr('src');
		assert(icon);
		const title = $img.attr('title');
		assert(title);
		return {
			title,
			icon,
		};
	});
};

const getNutritions: DataExtractor<
	Array<{
		key: string;
		value: string;
	}>
> = ($menu, $) => {
	const $table = $menu.find(
		'.menu-nutrition-infos-popup__body__nutrition__table',
	);

	return $table
		.slice(1)
		.toArray()
		.map(row => {
			const $row = $(row);
			const get = (n: number) => $row.children().eq(n).text().trim();
			const key = get(0);
			assert(key);
			const value = get(1);
			assert(value);
			return {
				key,
				value,
			};
		});
};

const getPrice: DataExtractor<string> = $menu => {
	const $price = $menu.find('.menu-list > .menu-list-item').first();
	const prices = $price.text().trim();
	assert(prices);
	assert.match(prices, /CHF/);
	return prices;
};

const getTitle: DataExtractor<string> = $menu => {
	const title = $menu.find('.menu-info > h3').text();

	assert(title);
	return title;
};

const getMenu: DataExtractor<{
	menu: string[];

	declaration: string[];
}> = ($menu_, $) => {
	const $menu = $menu_.find('.menu-info > h4');
	const declaration = $menu
		.find('small.text-muted')
		.toArray()
		.map(element => $(element).text().trim())
		.filter(Boolean);

	const text = $menu
		.contents()
		.toArray()
		.filter(element => element.type === 'text')
		.map(element => $(element).text());

	return {
		menu: text,
		declaration,
	};
};

const getTags: DataExtractor<
	Array<{
		title: string;
		icon: string;
	}>
> = ($menu, $) =>
	$menu
		.find('.menu-icon > img')
		.toArray()
		.map(img => {
			const $img = $(img);
			const icon = $img.attr('src');
			assert(icon);
			const title = $img.attr('title');
			assert(title);
			return {
				icon,
				title,
			};
		});

export const extract = async (url: URL): Promise<DayMenu[]> => {
	const $ = await getHtml(url);

	const location = $('#dropdown-location').text().trim();
	assert(location);

	const $days = $('.filter-list > .filter');

	const dayTitles = $days.toArray().map(element => {
		const $element = $(element);
		let day = $element.text().trim();
		const date = $element.data('filter');
		assert(typeof date === 'string');

		const parsedDate = parseDateFilter(date);
		if (!day) {
			const date = new Date(
				Number(parsedDate.year),
				Number(parsedDate.month) - 1,
				Number(parsedDate.day),
				8,
			);
			day = date.toLocaleString('de-CH', {weekday: 'long'});
		}

		return {
			day,
			date: parseDateFilter(date),
			filter: date,
		};
	});

	const menus: DayMenu[] = dayTitles.map(({filter, day, date}) => {
		const menus = $(filter)
			.toArray()
			.map((m): SingleItem => {
				const $menu = $(m);
				assert.equal($menu.length, 1);

				const tags = getTags($menu, $);
				const title = getTitle($menu, $);
				const menu = getMenu($menu, $);
				const price = getPrice($menu, $);
				const allergens = getAllergens($menu, $);
				const nutritions = getNutritions($menu, $);

				return {
					tags,
					title,
					menu,
					price,
					allergens,
					nutritions,
				};
			});

		return {
			day,
			date,
			menu: menus,
		};
	});

	return menus;
};
