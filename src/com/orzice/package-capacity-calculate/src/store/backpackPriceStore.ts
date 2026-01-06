import { GmStorage } from '@yiero/gmlib';

export interface BackpackPrice {
	itemName: string;
	price: number;
	standardPrice: number;
	capacity: number;
	updateTime: number;
	type: '胸挂' | '背包';
}

export const backpackPriceStore = new GmStorage<Record<string, BackpackPrice>>( 'backpackPrice', {} );
