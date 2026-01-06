import { elementWaiter, gmDownload, gmMenuCommand } from '@yiero/gmlib';
import { backpackPriceStore } from './store/backpackPriceStore.ts';
import {
	appendBackpackCapacityUi,
	BackpackPriceItem,
} from './appendBackpackCapacityUi.ts';
import { clonePriceData } from './clonePriceData.ts';

const calculatePriceSet = () => {
	const backpackPrice = backpackPriceStore.get();
	const backpackPriceList = Object.values( backpackPrice );
	const {
		背包: bagPriceList = [],
		胸挂: necklacePriceList = [],
	} = Object.groupBy( backpackPriceList, ( item ) => item.type );
	// console.log( 'bagPriceList', bagPriceList );
	// console.log( 'necklacePriceList', necklacePriceList );
	
	// 生成集合
	const priceList: BackpackPriceItem[] = [];
	for ( const bagPriceItem of bagPriceList ) {
		priceList.push( {
			bag: bagPriceItem.itemName,
			bagCapacity: bagPriceItem.capacity,
			bagPrice: bagPriceItem.price,
			bagStandardPrice: bagPriceItem.standardPrice,
			necklace: '',
			necklaceCapacity: 0,
			necklacePrice: 0,
			necklaceStandardPrice: 0,
			totalCapacity: bagPriceItem.capacity,
			totalPrice: bagPriceItem.price,
			totalStandardPrice: bagPriceItem.standardPrice,
			singleCapacityPrice: ( bagPriceItem.price ) / ( bagPriceItem.capacity ),
		} );
		for ( let necklacePriceItem of necklacePriceList ) {
			priceList.push( {
				bag: bagPriceItem.itemName,
				bagCapacity: bagPriceItem.capacity,
				bagPrice: bagPriceItem.price,
				bagStandardPrice: bagPriceItem.standardPrice,
				necklace: necklacePriceItem.itemName,
				necklaceCapacity: necklacePriceItem.capacity,
				necklacePrice: necklacePriceItem.price,
				necklaceStandardPrice: necklacePriceItem.standardPrice,
				totalCapacity: bagPriceItem.capacity + necklacePriceItem.capacity,
				totalPrice: bagPriceItem.price + necklacePriceItem.price,
				totalStandardPrice: bagPriceItem.standardPrice + necklacePriceItem.standardPrice,
				singleCapacityPrice: ( bagPriceItem.price + necklacePriceItem.price ) / ( bagPriceItem.capacity + necklacePriceItem.capacity ),
			} );
		}
	}
	for ( let necklacePriceItem of necklacePriceList ) {
		priceList.push( {
			bag: '',
			bagCapacity: 0,
			bagPrice: 0,
			bagStandardPrice: 0,
			necklace: necklacePriceItem.itemName,
			necklaceCapacity: necklacePriceItem.capacity,
			necklacePrice: necklacePriceItem.price,
			necklaceStandardPrice: necklacePriceItem.standardPrice,
			totalCapacity: necklacePriceItem.capacity,
			totalPrice: necklacePriceItem.price,
			totalStandardPrice: necklacePriceItem.standardPrice,
			singleCapacityPrice: ( necklacePriceItem.price ) / ( necklacePriceItem.capacity ),
		} );
	}
	priceList.sort( ( a, b ) => a.totalCapacity - b.totalCapacity );
	return priceList;
};

const createCsvContent = ( priceList: BackpackPriceItem[] ) => {
	const header = `总容量,背包,背包容量,胸挂,胸挂容量,总价格,总战备,单格性价比\n`;
	const content = priceList.map( item => {
		return `${ item.totalCapacity },${ item.bag },${ item.bagCapacity },${ item.necklace },${ item.necklaceCapacity },${ item.totalPrice },${ item.totalStandardPrice },${ item.singleCapacityPrice }`;
	} ).join( '\n' );
	return header + content;
};

const createTableContent = ( priceList: BackpackPriceItem[] ) => {
	return priceList.map( item => {
		return [
			item.totalCapacity,
			item.bag,
			item.bagCapacity,
			item.necklace,
			item.necklaceCapacity,
			item.totalPrice,
			item.totalStandardPrice,
			item.singleCapacityPrice
		].join('\t')
	} ).join( '\n' );
};


const computedBestPrice = ( priceList: BackpackPriceItem[] ) => {
	return Object.values( Object.groupBy( priceList, ( item ) => item.totalCapacity ) ).map( list => {
		if ( !list ) return;
		list.sort( ( a, b ) => a.totalPrice - b.totalPrice );
		const best = list[ 0 ];
		console.log( `背包容量 ${ best.totalCapacity } 的最佳性价比为`, best );
		return best;
	} ).filter( Boolean ) as BackpackPriceItem[];
};

/**
 * 主函数
 */
const main = async () => {
	gmMenuCommand
		.create( '下载背包组合价格列表(csv)', () => {
			const priceList = calculatePriceSet();
			const content = createCsvContent( priceList );
			gmDownload.text( content, '背包价格列表', 'text/csv' );
		} )
		.create( '下载背包组合价格列表(table)', () => {
			const priceList = calculatePriceSet();
			const content = createTableContent( priceList );
			gmDownload.text( content, '背包价格列表' );
		} )
		.create( '下载背包最佳性价比(csv)', () => {
			const priceList = calculatePriceSet();
			// console.log( 'priceList', priceList );
			const bestList: BackpackPriceItem[] = computedBestPrice( priceList );
			const content = createCsvContent( bestList );
			gmDownload.text( content, '背包最佳性价比', 'text/csv' );
		} )
		.create( '下载背包最佳性价比(table)', () => {
			const priceList = calculatePriceSet();
			// console.log( 'priceList', priceList );
			const bestList: BackpackPriceItem[] = computedBestPrice( priceList );
			const content = createTableContent( bestList );
			gmDownload.text( content, '背包最佳性价比' );
		} )
		.render();
	
	
	const type = new URLSearchParams( location.search ).get( 'n' );
	const isBackpackPage = Boolean( type && [ '胸挂', '背包' ].includes( type ) );
	if ( !isBackpackPage ) return;
	
	const container = await elementWaiter( '.modern-table', { delayPerSecond: .05 } );
	if ( !container ) return;
	const isAppended = await appendBackpackCapacityUi( container );
	if ( !isAppended ) return;
	
	clonePriceData( container );
};

main().catch( error => {
	console.error( error );
} );
