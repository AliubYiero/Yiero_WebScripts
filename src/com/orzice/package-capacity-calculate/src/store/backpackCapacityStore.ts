import { GmStorage } from '@yiero/gmlib';

export interface BackpackCapacity {
	itemName: string;
	capacity: number;
	type: '胸挂' | '背包';
}

const backpackCapacities: Record<string, BackpackCapacity> = {
	'3H战术背包': { itemName: '3H战术背包', capacity: 18, type: '背包' },
	'ALS背负系统': { itemName: 'ALS背负系统', capacity: 28, type: '背包' },
	'D01轻型胸挂': { itemName: 'D01轻型胸挂', capacity: 8, type: '胸挂' },
	'D2战术登山包': { itemName: 'D2战术登山包', capacity: 24, type: '背包' },
	'D3战术登山包': { itemName: 'D3战术登山包', capacity: 28, type: '背包' },
	'D7战术背包': { itemName: 'D7战术背包', capacity: 35, type: '背包' },
	'DAR突击手胸挂': { itemName: 'DAR突击手胸挂', capacity: 24, type: '胸挂' },
	'DASH战术背包': { itemName: 'DASH战术背包', capacity: 20, type: '背包' },
	'DG运动背包': { itemName: 'DG运动背包', capacity: 12, type: '背包' },
	'DRC先进侦察胸挂': {
		itemName: 'DRC先进侦察胸挂',
		capacity: 17,
		type: '胸挂',
	},
	'DSA战术胸挂': { itemName: 'DSA战术胸挂', capacity: 12, type: '胸挂' },
	'G01战术弹挂': { itemName: 'G01战术弹挂', capacity: 13, type: '胸挂' },
	'GA野战背包': { itemName: 'GA野战背包', capacity: 20, type: '背包' },
	'GIR野战胸挂': { itemName: 'GIR野战胸挂', capacity: 20, type: '胸挂' },
	'GT1户外登山包': { itemName: 'GT1户外登山包', capacity: 25, type: '背包' },
	'GT5野战背包': { itemName: 'GT5野战背包', capacity: 30, type: '背包' },
	'GTO重型战术包': { itemName: 'GTO重型战术包', capacity: 45, type: '背包' },
	'HD3战术胸挂': { itemName: 'HD3战术胸挂', capacity: 12, type: '胸挂' },
	'HK3便携胸挂': { itemName: 'HK3便携胸挂', capacity: 8, type: '胸挂' },
	'HLS-2重型背包': { itemName: 'HLS-2重型背包', capacity: 28, type: '背包' },
	'MAP侦察背包': { itemName: 'MAP侦察背包', capacity: 24, type: '背包' },
	'便携胸包': { itemName: '便携胸包', capacity: 6, type: '胸挂' },
	'大型登山包': { itemName: '大型登山包', capacity: 16, type: '背包' },
	'尼龙挎包': { itemName: '尼龙挎包', capacity: 8, type: '背包' },
	'帆布背囊': { itemName: '帆布背囊', capacity: 10, type: '背包' },
	'强袭战术背心': { itemName: '强袭战术背心', capacity: 14, type: '胸挂' },
	'快速侦察胸挂': { itemName: '快速侦察胸挂', capacity: 6, type: '胸挂' },
	'战术快拆背包': { itemName: '战术快拆背包', capacity: 15, type: '背包' },
	'斜挎包': { itemName: '斜挎包', capacity: 8, type: '背包' },
	'旅行背包': { itemName: '旅行背包', capacity: 10, type: '背包' },
	'生存战术背包': { itemName: '生存战术背包', capacity: 28, type: '背包' },
	'突击者战术背心': {
		itemName: '突击者战术背心',
		capacity: 16,
		type: '胸挂',
	},
	'突袭战术背包': { itemName: '突袭战术背包', capacity: 15, type: '背包' },
	'简易挂载包': { itemName: '简易挂载包', capacity: 6, type: '胸挂' },
	'简易携行弹挂': { itemName: '简易携行弹挂', capacity: 10, type: '胸挂' },
	'轻型战术胸挂': { itemName: '轻型战术胸挂', capacity: 6, type: '胸挂' },
	'轻型户外背包': { itemName: '轻型户外背包', capacity: 12, type: '背包' },
	'运动背包': { itemName: '运动背包', capacity: 8, type: '背包' },
	'通用战术胸挂': { itemName: '通用战术胸挂', capacity: 9, type: '胸挂' },
	'重型登山包': { itemName: '重型登山包', capacity: 40, type: '背包' },
	'野战徒步背包': { itemName: '野战徒步背包', capacity: 24, type: '背包' },
	'雨林猎手背包': { itemName: '雨林猎手背包', capacity: 21, type: '背包' },
	'露营背包': { itemName: '露营背包', capacity: 15, type: '背包' },
	'飓风战术胸挂': { itemName: '飓风战术胸挂', capacity: 22, type: '胸挂' },
	'黑鹰野战胸挂': { itemName: '黑鹰野战胸挂', capacity: 22, type: '胸挂' },
};

export const backpackCapacityStore = new GmStorage<Record<string, BackpackCapacity>>( 'backpackCapacity', backpackCapacities );
