export type SingleItem = Readonly<{
	tags: Array<{
		title: string;
		icon: string;
	}>;
	title: string;
	menu: {
		menu: string[];
		declaration: string[];
	};
	price: string;
	allergens: Array<{
		title: string;
		icon: string;
	}>;
	nutritions: Array<{
		key: string;
		value: string;
	}>;
}>;

export type DayMenu = {
	day: string;
	date: {
		year: string;
		month: string;
		day: string;
	};
	menu: SingleItem[];
};

export type WeekMenu = DayMenu[];

export type Menu = {
	data: {
		location: string;
		menu: WeekMenu;
	};
	version: 3;
};
