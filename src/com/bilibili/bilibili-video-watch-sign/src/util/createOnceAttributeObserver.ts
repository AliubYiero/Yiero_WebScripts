/* ============== 重载 ==============*/
import { elementWaiter } from '@yiero/gmlib';

export function createOnceAttributeObserver(
	container: HTMLElement,
	callback: () => void,
): void

export function createOnceAttributeObserver(
	containerSelector: string,
	callback: () => void,
): void

/* ============== 实现 ==============*/
/**
 * 创建一个只执行一次的属性变化观察者
 */
export async function createOnceAttributeObserver(
	container: HTMLElement | string,
	callback: () => void,
) {
	if ( typeof container === 'string' ) {
		container = await elementWaiter<HTMLElement>( container, { delayPerSecond: 0 } );
	}
	
	const observer = new MutationObserver( () => {
		callback();
		observer.disconnect();
	} );
	observer.observe( container, {
		attributes: true,
	} );
};
