/**
 * 获取列表元素加载
 */
export function mutationListen(
	mutationCallback: MutationRecord[],
	callback: ( element: HTMLElement ) => void,
) {
	for ( const mutation of mutationCallback ) {
		const { addedNodes } = mutation;
		for ( const node of addedNodes ) {
			if ( node.nodeType !== Node.ELEMENT_NODE ) {
				continue;
			}
			
			callback( node as HTMLElement );
		}
	}
}
