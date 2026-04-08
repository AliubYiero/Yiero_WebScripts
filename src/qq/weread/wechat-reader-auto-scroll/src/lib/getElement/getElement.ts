/**
 * getElement.ts
 * created by 2023/7/19
 * @file
 * @author  Yiero
 * @version beta1.0.0
 * */

export {
	getElement,
};

/**
 * 使用提供的选择器检索父元素中的元素，并具有可选的超时。
 *
 * @param {Element} parent - 要在其中搜索的父元素。
 * @param {string} selector - 要搜索的CSS选择器。
 * @param {number} [timeout=0] - 可选超时（以毫秒为单位）。
 * @return {Promise<Element | null>} 使用已找到的元素解析的promise，如果未找到则为null。
 */
function getElement( parent: Element | HTMLElement | Document, selector: string, timeout: number = 0 ): Promise<Element | null> {
	return new Promise( resolve => {
		let result = parent.querySelector( selector );
		if ( result ) return resolve( result );
		let timer: NodeJS.Timeout;
		// @ts-ignore
		const mutationObserver = window.MutationObserver || window.WebkitMutationObserver || window.MozMutationObserver;
		if ( mutationObserver ) {
			const observer = new mutationObserver( mutations => {
				for ( let mutation of mutations ) {
					for ( let addedNode of mutation.addedNodes ) {
						if ( addedNode instanceof Element ) {
							result = addedNode.matches( selector ) ? addedNode : addedNode.querySelector( selector );
							if ( result ) {
								observer.disconnect();
								timer && clearTimeout( timer );
								// 为了避免在元素插入后立即解析，我们在这里添加一个短暂的延迟。
								setTimeout( () => resolve( result ), 300 );
							}
						}
					}
				}
			} );
			observer.observe( parent, {
				childList: true,
				subtree: true,
			} );
			if ( timeout > 0 ) {
				timer = setTimeout( () => {
					observer.disconnect();
					return resolve( null );
				}, timeout );
			}
		} else {
			const listener = ( e: any ) => {
				if ( e.target instanceof Element ) {
					result = e.target.matches( selector ) ? e.target : e.target.querySelector( selector );
					if ( result ) {
						parent.removeEventListener( 'DOMNodeInserted', listener, true );
						timer && clearTimeout( timer );
						return resolve( result );
					}
				}
			};
			parent.addEventListener( 'DOMNodeInserted', listener, true );
			if ( timeout > 0 ) {
				timer = setTimeout( () => {
					parent.removeEventListener( 'DOMNodeInserted', listener, true );
					return resolve( null );
				}, timeout );
			}
		}
	} );
}
