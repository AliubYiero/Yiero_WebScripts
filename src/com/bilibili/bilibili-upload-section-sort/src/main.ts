import { elementWaiter, hookXhr, Message } from '@yiero/gmlib';
import { EventListener } from './utils/EventListener.ts';
import ISeasonSectionInfo, {
	Episodes,
} from './interface/ISeasonSectionInfo.ts';
import { initSortButton } from './UI/SortButton.ts';
import { sleep } from 'radash';
import {
	api_editSeasonSection,
	api_getVideoInfo,
} from '@yiero/bilibili-api-lib';
import { publishTimeStore } from './store/publishTimeStore.ts';

/**
 * 主函数：初始化合集视频排序功能
 *
 * 功能说明：
 * 1. 监听合集章节数据请求
 * 2. 获取所有视频的发布时间（优先使用缓存）
 * 3. 动态创建排序按钮并显示加载倒计时
 * 4. 实现升序/降序排序功能
 * 5. 调用API更新视频排序
 */
const main = async () => {
	// 用于存储待处理的视频请求
	const requestQueue: Episodes[] = [];
	
	/**
	 * 事件监听器：处理合集章节数据
	 * @param response - 章节数据响应
	 */
	const handleSeasonData = async ( response: ISeasonSectionInfo ) => {
		console.log( '数据响应', response );
		
		// 清空待处理队列
		requestQueue.length = 0;
		
		const { episodes = [], section } = response;
		if ( !episodes.length || !section ) return;
		
		// 检测页面是否启用小节功能
		const isSectionEnabled = Boolean( document.querySelector( '.upload-manage .ep-section-edit' ) );
		
		// 等待目标容器加载
		const containerSelector = isSectionEnabled
			? '.ep-section-edit-video-list-nav'
			: '.ep-edit-section-list-nav';
		const container = await elementWaiter( containerSelector );
		
		// 初始化排序按钮
		const sortButton = initSortButton( container );
		sortButton.style.marginLeft = '22px';
		
		// 设置初始倒计时（每条视频200ms）
		const initialCountdown = episodes.length * 0.2;
		sortButton.countdown = initialCountdown;
		
		// 获取已缓存的发布时间
		const cachedPublishTimes = publishTimeStore.get();
		const videoPublishInfoList: { id: number; publishTime: number }[] = [];
		
		/**
		 * 处理单个视频发布时间
		 * @param episode - 视频条目
		 * @returns 处理结果
		 */
		const processEpisode = async ( episode: Episodes ): Promise<void> => {
			const { id, aid } = episode;
			if ( !id || !aid ) return;
			
			// 1. 优先使用缓存
			const cachedTime = cachedPublishTimes[ aid ];
			if ( cachedTime ) {
				videoPublishInfoList.push( { id, publishTime: cachedTime } );
				return;
			}
			
			// 2. 无缓存时请求API
			const videoInfo = await api_getVideoInfo( aid, true );
			const publishTime = videoInfo.data.pubdate!;
			
			// 3. 更新缓存
			cachedPublishTimes[ aid ] = publishTime;
			publishTimeStore.set( cachedPublishTimes );
			
			// 4. 添加到结果集
			videoPublishInfoList.push( { id, publishTime } );
			
			// 5. 遵守API限流（200ms间隔）
			await sleep( 200 );
		};
		
		// 顺序处理视频请求（遵守API限流）
		requestQueue.push( ...episodes );
		while ( requestQueue.length > 0 ) {
			// 获取当前视频请求
			const request = requestQueue.pop();
			if ( !request ) continue;
			
			// 处理视频请求
			await processEpisode( request );
			
			// 更新剩余时间（剩余视频数 * 0.2s）
			const remainingTime = requestQueue.length * 0.2;
			sortButton.countdown = remainingTime;
		}
		
		// 更新按钮状态
		sortButton.status = 'loaded';
		
		/**
		 * 执行视频排序
		 * @param sortOrder - 排序方向：'asc'升序 | 'desc'降序
		 */
		const executeSort = async ( sortOrder: 'asc' | 'desc' ) => {
			// 1. 按发布时间排序
			const sortedList = [ ...videoPublishInfoList ].sort( ( a, b ) =>
				sortOrder === 'asc'
					? a.publishTime - b.publishTime
					: b.publishTime - a.publishTime,
			);
			
			// 2. 生成排序参数
			const sortParams = sortedList.map( ( item, index ) => ( {
				id: item.id,
				sort: index + 1,
			} ) );
			
			// 3. 调用API更新排序
			await api_editSeasonSection(
				{
					id: section.id!,
					seasonId: section.seasonId!,
					title: section.title!,
					type: section.type! as 1,
				},
				sortParams,
			);
			
			// 4. 显示操作结果
			const message = sortOrder === 'asc'
				? '合集视频按发布时间升序（从旧到新）排序完成'
				: '合集视频按发布时间降序（从新到旧）排序完成';
			
			Message( {
				duration: 3000,
				message: `${ message }，请刷新页面查看结果`,
				position: 'top',
				type: 'success',
			} );
		};
		
		// 注册排序事件
		sortButton.addEventListener( 'ascend-sort', () => executeSort( 'asc' ) );
		sortButton.addEventListener( 'descend-sort', () => executeSort( 'desc' ) );
	};
	
	// 创建事件监听器
	const eventListener = new EventListener<ISeasonSectionInfo>( handleSeasonData );
	
	// 拦截章节数据请求
	hookXhr(
		( url ) => {
			return url.startsWith( 'https://member.bilibili.com/x2/creative/web/season/section  ' )
				|| url.startsWith( '/x2/creative/web/season/section' );
		},
		( response: Record<string, any> ) => {
			if ( response?.data ) {
				eventListener.dispatch( response.data as ISeasonSectionInfo );
			}
		},
	);
};

main().catch( error => {
	console.error( error );
} );
