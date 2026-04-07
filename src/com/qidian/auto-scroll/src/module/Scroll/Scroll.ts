let timer = 0;
export const startScroll = (
	scrollHeight: number,
	scrollTimePerCount: number,
) => {
	if ( timer ) {
		stopScroll();
	}
	timer = window.setInterval( () => {
		scrollBy( {
			top: scrollHeight,
			behavior: 'smooth',
		} );
	}, scrollTimePerCount );
};

export const stopScroll = () => {
	clearTimeout( timer );
	timer = 0;
};
