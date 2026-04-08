import { ScrollSpeedStorage } from '../../utils';
import {
	addPageBottomBlankStyle,
} from '../addPageBottomBlankStyle/addPageBottomBlankStyle.ts';

/**
 * 绑定上箭头为增加速度(+1px), 下箭头为减小速度(-1px)
 * */
export const bindArrowEvent = () => {
	window.addEventListener( 'keydown', ( e ) => {
		if ( ![ 'ArrowUp', 'ArrowDown' ].includes( e.code ) ) {
			return;
		}
		
		// 阻止默认箭头滚动事件
		e.preventDefault();
		
		// 创建Mapper
		const arrowSpeedChangeMapper = {
			'ArrowUp': 1,
			'ArrowDown': -1,
		};
		
		// 改变当前速度
		const currentScrollSpeed = ScrollSpeedStorage.get();
		// 限制速度最小为0并且是整数
		const willChangeScrollSpeed = Math.floor(
			Math.max(
				0, currentScrollSpeed + arrowSpeedChangeMapper[ <'ArrowUp' | 'ArrowDown'> ( e.code ) ],
			) );
		// 添加更改到存储中
		ScrollSpeedStorage.set( willChangeScrollSpeed );
		
		// 修改底部空白高度
		addPageBottomBlankStyle();
		
		// 输出信息
		console.log( `当前速度更改为: ${ willChangeScrollSpeed }` );
		
		// 不需要停止页面滚动, 因为页面滚动是持续获取数据库中的滚动速度数据而不是本地数据的.
	} );
};
