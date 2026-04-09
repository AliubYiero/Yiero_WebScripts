let animationFrameId: number = 0;
let lastTimestamp: number = 0;
let scrollHeightPerMs: number = 0;
let scrollRemainder: number = 0;  // 累积未滚动的余数

const scroll = (timestamp: number) => {
	const elapsed = timestamp - lastTimestamp;
	lastTimestamp = timestamp;
	
	const delta = scrollHeightPerMs * elapsed + scrollRemainder;
	
	if ( delta >= 1 ) {
		window.scrollBy( 0, Math.floor( delta ) );
		scrollRemainder = delta - Math.floor( delta );
	} else {
		scrollRemainder = delta;
	}
	
	animationFrameId = requestAnimationFrame( scroll );
};

/**
 * 开始滚动
 * @param scrollLengthPerSecond 每秒滚动的像素数
 */
export const startScroll = (scrollLengthPerSecond: number) => {
	if ( animationFrameId ) {
		stopScroll();
	}
	scrollHeightPerMs = scrollLengthPerSecond / 1000;
	scrollRemainder = 0;  // 重置累积余数
	lastTimestamp = performance.now();
	animationFrameId = requestAnimationFrame( scroll );
};

export const stopScroll = () => {
	if ( animationFrameId ) {
		cancelAnimationFrame( animationFrameId );
		animationFrameId = 0;
	}
};
