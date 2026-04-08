/**
 * 创建一个轮询函数，以指定的间隔重复执行所提供的函数。
 *
 * @param fn 要执行的函数。
 * @param [delayPerMs = 1000] 每次执行函数之间的延迟（以毫秒为单位）。默认值为1000ms。
 * @returns 返回一个新函数，当被调用时，以指定的间隔重复执行所提供的函数。
 */
export const polling = <T extends any[]>(
	fn: ( ...args: T ) => void,
	delayPerMs: number = 1_000,
): ( ...args: T ) => void => {
	/**
	 * 以指定的间隔重复执行提供的函数。
	 *
	 * @param args 要传递给函数的参数。
	 */
	return ( ...args: T ): void => {
		// 立即执行该功能
		fn( ...args );
		
		// 设置延时以在指定的延迟后再次执行该功能
		setInterval( () => {
			fn( ...args );
		}, delayPerMs );
	};
};
