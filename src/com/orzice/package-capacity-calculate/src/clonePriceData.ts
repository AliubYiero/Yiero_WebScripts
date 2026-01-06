import { backpackPriceStore } from './store/backpackPriceStore.ts';

export const clonePriceData = ( container: HTMLElement ) => {
	const backpackPrice = backpackPriceStore.get();
	
	const rows = container.querySelectorAll<HTMLElement>( 'tbody > .table-row' );
	rows.forEach( row => {
		const { name, type, price, capacity, standardPrice } = row.dataset;
		
		if ( !name || !type || !price || !capacity || !standardPrice ) return;
		backpackPrice[ name ] = {
			itemName: name,
			type: type as '胸挂' | '背包',
			price: Number( price ),
			capacity: Number( capacity ),
			updateTime: Date.now(),
			standardPrice: Number( standardPrice ),
		};
	} );
	backpackPriceStore.set( backpackPrice );
	console.log( 'clonePriceData', backpackPrice );
};
