/**
 * main.ts
 * created by 2024/3/5
 * @file 项目入口文件
 * @author  Yiero
 * */

import {
	addPageBottomBlankStyle,
	bindArrowEvent,
	bindSpaceEvent,
} from './module';

( () => {
	// 1. 开启本脚本后自动绑定空格键为开启键
	bindSpaceEvent();
	
	// 2. 绑定上箭头为增加速度, 绑定下箭头为减小速度
	bindArrowEvent();
	
	// 3. 向页面添加尾部空白
	addPageBottomBlankStyle();
} )();
