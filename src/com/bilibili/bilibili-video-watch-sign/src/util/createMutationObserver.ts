/**
 * 创建新增 DOM 变化观察者
 */
export const createMutationObserver = (
	target: HTMLElement,
	callback: ( container: HTMLElement ) => void,
	options: MutationObserverInit = { childList: true, attributes: true },
) => {
	if ( target.dataset.bindObserver ) {
		return null;
	}
	
	const observer = new MutationObserver( ( records ) => {
		// console.log(records, ObserverList.list);
		for ( let record of records ) {
			// console.log(record);
			for ( let addedNode of record.addedNodes ) {
				if ( addedNode.nodeType !== Node.ELEMENT_NODE ) continue;
				callback( addedNode as HTMLElement );
			}
		}
	} );
	observer.observe( target, options );
	target.dataset.bindObserver = 'true';
	return observer;
};
