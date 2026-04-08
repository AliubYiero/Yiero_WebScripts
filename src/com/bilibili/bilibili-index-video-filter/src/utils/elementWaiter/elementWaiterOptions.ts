/**
 * 接口 ElementWaiterOptions
 * @interface ElementWaiterOptions
 * */
export interface ElementWaiterOptions {
	// 选择器
	selector: string;
	
	// 父元素
	father?: Document | Element | HTMLElement;
	
	// 超时时间，单位秒
	timeoutPerSecond?: number;
	
	// 延迟时间，单位秒
	delayPerSecond?: number;
}
