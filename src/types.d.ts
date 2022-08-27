export type SingleItem = Readonly<{
	title: string;
	menu: readonly string[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	nutritional: null | readonly string[];
	price: readonly string[];
}>;

export type DayMenu = {
	day: string;
	menu: SingleItem[];
};

export type WeekMenu = DayMenu[];

export type Menu = {
	data: Array<{
		linkTitle: string;
		pdfTitle: string;
		location: 'P' | 'N';
		menus: WeekMenu;
	}>;
	version: 2;
};
