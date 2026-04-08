/**
 * 页面触底判断函数
 *
 * @return { boolean }
 * */
export const isReachedPageBottom = (): boolean => {
	const {
		scrollTop,
		clientHeight,
		scrollHeight,
	} = document.documentElement;
	// 给10px的偏差值
	return ( scrollTop + clientHeight + 10 ) >= scrollHeight;
};
