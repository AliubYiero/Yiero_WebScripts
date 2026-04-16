/**
 * 使用定时器获取页面元素
 */
export const elementGetter = (
	selector: string,
	container: HTMLElement | Document = document,
): Promise<HTMLElement> => {
	return new Promise( ( resolve, reject ) => {
		const timeout = setTimeout( () => reject( 'timeout' ), 20_000 );
		
		const timer = setInterval( () => {
			const target = container.querySelector<HTMLElement>( selector );
			if ( target ) {
				clearInterval( timer );
				clearTimeout( timeout );
				resolve( target );
			}
		}, 100 );
	} );
};
