import {
	PageBottomBlankStyle,
	ScrollSpeedStorage,
} from '../../utils';

/**
 * 添加页面底部空白
 * */
export const addPageBottomBlankStyle = () => {
	// 如果原先有底部空白元素则移除
	PageBottomBlankStyle.remove();
	
	// 计算空白高度 (160是默认的margin)
	const bottomBlankHeight =
		Math.max(
			0,
			Math.min(
				window.innerHeight,
				Math.floor( window.innerHeight / ( ScrollSpeedStorage.get() / 5 ) ),
			) - 160,
		);
	
	// 添加底部空白
	PageBottomBlankStyle.add( bottomBlankHeight );
};
