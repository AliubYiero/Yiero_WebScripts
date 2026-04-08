// 监听页面的元素


import {
	elementWaiter,
} from '../../utils/elementWaiter/interface/elementWaiter.ts';

export const observeContainerLoad = async () => {
	const containerSelector = '.recommended-container_floor-aside > .container';
	
	return await elementWaiter( containerSelector );
};
