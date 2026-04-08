/**
 * main.ts
 * created by 2024/3/27
 * @file 项目入口文件
 * @author  Yiero
 * */

import {
	listenVideoCardLoad,
	observeContainerLoad,
	observeVideoCardLoad,
} from './module';
import { useReadVideoStore } from './store';

// 初始化
const init = async () => {
	// 监听页面加载完成
	const element = await observeContainerLoad();
	// console.log( 'container loaded', element );
	
	// 声明视频卡片加载回调 (先声明回调, 再监听元素加载)
	listenVideoCardLoad();
	
	// 监听视频卡片加载
	observeVideoCardLoad( <HTMLElement> element );
};

/*
* 启动项目
* */
( async () => {
	// test 清除数据库
	// useReadVideoStore.getInstance().delete();
	
	console.info(
		'[bilibili-index-video-filter] 当前已看视频数据库 (size: %sKB): ',
		Math.ceil( JSON.stringify( useReadVideoStore.getInstance().show() ).length / 1024 ),
		useReadVideoStore.getInstance().show(),
	);
	await init();
} )();
