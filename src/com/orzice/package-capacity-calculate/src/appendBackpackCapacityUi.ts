import { backpackCapacityStore } from './store/backpackCapacityStore.ts';

export interface BackpackPriceItem {
	bag: string;
	bagCapacity: number;
	bagPrice: number;
	bagStandardPrice: number;
	necklace: string;
	necklaceCapacity: number;
	necklacePrice: number;
	necklaceStandardPrice: number;
	totalCapacity: number;
	totalPrice: number;
	totalStandardPrice: number;
	singleCapacityPrice: number;
}

export const appendBackpackCapacityUi = ( container: HTMLElement ) => {
	// 添加 header
	const headerContainer = container.querySelector<HTMLElement>( 'thead > tr' );
	if ( !headerContainer ) {
		return false;
	}
	const priceColumn = headerContainer.querySelector<HTMLElement>( '.price-column' );
	if ( !priceColumn ) {
		return false;
	}
	const backpackCapacityColumn = document.createElement( 'th' );
	backpackCapacityColumn.classList.add( 'backpack-capacity-column' );
	backpackCapacityColumn.textContent = '背包容量';
	headerContainer.insertBefore( backpackCapacityColumn, priceColumn );
	
	// 添加 每个格子 的 UI
	const backpackCapacity = backpackCapacityStore.get();
	const rows = container.querySelectorAll<HTMLElement>( 'tbody > .table-row' );
	rows.forEach( row => {
		const itemCell = row.querySelector<HTMLElement>( '.item-cell .item-name' );
		if ( !itemCell ) return;
		const itemName = itemCell.innerText;
		
		// 读取 backpackCapacity
		const itemBackpackCapacity = backpackCapacity[ itemName ];
		// 读取 type
		const type = new URLSearchParams( location.search ).get( 'n' ) as '胸挂' | '背包';
		if ( !type ) return;
		
		const priceCell = row.querySelector<HTMLElement>( '.price-cell' );
		const backpackCapacityCell = document.createElement( 'td' );
		backpackCapacityCell.classList.add( 'backpack-capacity-cell' );
		backpackCapacityCell.innerHTML = `<input type="number" min="0"
class="backpack-capacity-input" value="${ itemBackpackCapacity.capacity || '' }"
data-name="${ itemName }"
data-type="${ type }"
style="
    width: 80px;
    height: 35px;
    line-height: 35px;
    border: 1px solid #ccc;
    border-radius: 5px;
    outline: none;
    padding: 5px 12px;
"/>`;
		row.insertBefore( backpackCapacityCell, priceCell );
		
		// 添加 dataset
		const itemPriceCell = row.querySelector<HTMLElement>( '.price-cell:has(.icon-gold)' );
		const standardItemPriceCell = row.querySelector<HTMLElement>( '.price-cell:has(.icon-gold):nth-child(6)' );
		if ( !itemPriceCell || !standardItemPriceCell ) return false;
		const itemPrice = Number( itemPriceCell.innerText.replace( /,\s?/, '' ) );
		const standardItemPrice = itemPrice + ( -1 * Number( standardItemPriceCell.innerText.replace( /,\s?/, '' ) ) );
		Object.assign( row.dataset, {
			type,
			name: itemName,
			price: itemPrice,
			capacity: itemBackpackCapacity.capacity || 0,
			standardPrice: standardItemPrice,
		} );
	} );
	
	container.addEventListener( 'input', ( e ) => {
		const input = e.target as HTMLInputElement;
		if ( !input.classList.contains( 'backpack-capacity-input' ) ) return;
		
		const { name: itemName, type } = input.dataset as {
			name: string;
			type: '胸挂' | '背包';
		};
		const backpackCapacity = backpackCapacityStore.get();
		backpackCapacity[ itemName ] = {
			itemName,
			type,
			capacity: input.valueAsNumber,
		};
		backpackCapacityStore.set( backpackCapacity );
	} );
	
	return true;
};
