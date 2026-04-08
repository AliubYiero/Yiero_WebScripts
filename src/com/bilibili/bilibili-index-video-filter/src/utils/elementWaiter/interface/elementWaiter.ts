import { ElementWaiterOptions } from '../elementWaiterOptions.ts';

/**
 * 元素等待器, 等待元素加载
 * @param selector 元素选择器
 * @param [options] 配置项
 * @returns {Promise<Element>}
 * */
export const elementWaiter = async (
	selector: ElementWaiterOptions['selector'],
	options: Omit<ElementWaiterOptions, 'selector'> = {},
): Promise<Element> => {
	// 解构赋值，将options对象中的属性father、selector和callback赋值给对应的变量
	const {
		father = document,
		timeoutPerSecond = 20,
		delayPerSecond = .3,
	} = options;
	
	
	/*
	* 声明 Promise
	* */
	let resolve: ( value: Element ) => void;
	let reject: ( reason?: any ) => void;
	const promise: Promise<Element> = new Promise( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	
	/*
	* 先进行一次元素获取
	* */
	const element = father.querySelector( selector );
	
	// 如果元素存在，则直接 resolve 该 Promise
	if ( element ) {
		setTimeout( () => {
			resolve( element );
		}, delayPerSecond * 1000 );
		return promise;
	}
	
	/*
	* 设置超时器
	* */
	// 设置超时器，该超时器在 timeoutPerSecond 秒后执行
	let timer = window.setTimeout( () => {
		// 清除超时器
		clearTimeout( timer );
		// 调用 reject 方法，并传入一个错误对象
		reject( new Error( `等待元素 ${ selector } 超时` ) );
	}, timeoutPerSecond * 1000 );
	
	
	// 创建一个 MutationObserver 实例，用于监听 DOM 变化
	const observer = new MutationObserver( ( mutationsList ) => {
			for ( let mutation of mutationsList ) {
				// 查询新增节点
				for ( let addedNode of mutation.addedNodes ) {
					// 判断新增节点是否为元素节点
					if ( addedNode.nodeType !== Node.ELEMENT_NODE ) {
						return;
					}
					
					// 获取新增节点的父元素
					const element = addedNode.parentNode?.querySelector( selector );
					
					// 判断新增节点是否为空
					if ( !element ) {
						return;
					}
					
					// 清除超时器
					clearTimeout( timer );
					// 调用 resolve 方法，并传入元素
					setTimeout( () => {
						resolve( element );
					}, delayPerSecond * 1000 );
					
					// 停止观察
					observer.disconnect();
				}
			}
		},
	);
	
	observer.observe( father, { childList: true, subtree: true } );
	
	return promise;
};
