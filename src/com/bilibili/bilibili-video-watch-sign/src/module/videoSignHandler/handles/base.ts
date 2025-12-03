import { IVideoItem } from '../types/IVideoItem.ts';
import { getVideoId } from '../../../util/getVideoId.ts';
import {
	videoSignProcessingQueue,
} from '../../videoSignProcessingQueue/videoSignProcessingQueue.ts';
import { elementWaiter } from '@yiero/gmlib';
import {
	createMutationObserver,
} from '../../../util/createMutationObserver.ts';
import { cacheWatchedStore } from '../../../store/cacheWatchedStore.ts';
import { handleAddSign } from '../../videoSignProcessingQueue/handleAddSign.ts';

/**
 * 通用视频信息解析
 */
export const baseParser = (
	container: HTMLElement,
	selectorList: {
		tagContainer: string,
		videoLink: string,
	},
	config: {
		isAd?: boolean,
		isWatchLater?: boolean,
		position?: 'left' | 'right',
	} = {},
): IVideoItem | null => {
	const {
		isAd = false,
		position = 'left',
		isWatchLater = false,
	} = config;
	
	// 获取视频链接
	const videoLink =
		container.querySelector<HTMLAnchorElement>( selectorList.videoLink );
	if ( !videoLink ) return null;
	let { href } = videoLink;
	if ( isAd ) {
		href = videoLink.dataset.targetUrl || '';
	}
	
	// 获取视频 id
	let videoId = getVideoId( href );
	if ( isWatchLater ) {
		videoId = new URL( href ).searchParams.get( 'bvid' );
	}
	if ( !videoId ) return null;
	
	// 获取标记容器
	const tagContainer =
		selectorList.tagContainer ?
			( container.querySelector<HTMLElement>( selectorList.tagContainer ) || container )
			: container;
	
	return {
		container,
		videoId,
		tagContainer,
		position,
	};
};


interface IVideoSignLoaderOptions {
	// 打开元素获取
	elementGetter: boolean;
	// 打开观察者
	observe: boolean;
	// 首次打开同时运行元素获取和观察者, 之后若存在观察者则只运行观察者
	throttle: boolean;
}

/**
 * 通用视频元素标记队列载入器
 */
export const baseVideoSignLoader = async (
	selectorList: {
		container: string,
		item: string,
	},
	parser: ( item: HTMLElement ) => IVideoItem | null,
	options: Partial<IVideoSignLoaderOptions> = {},
) => {
	options = {
		observe: true,
		elementGetter: true,
		throttle: false,
		...options,
	};
	
	// 等待元素载入
	try {
		await elementWaiter( selectorList.container, { delayPerSecond: 0 } );
	}
	catch ( e ) {
		return null;
	}
	
	const observerList: MutationObserver[] = [];
	const loadedContainerList = document.querySelectorAll<HTMLElement>( selectorList.container );
	
	// console.log('loadedContainerList', loadedContainerList);
	 
	for ( let loadedContainer of loadedContainerList ) {
		// 元素获取
		if (
			options.elementGetter
			|| !( options.throttle && loadedContainer.dataset.bindObserver )
		) {
			// 处理已加载元素
			const loadedItemList = Array.from( loadedContainer.querySelectorAll<HTMLElement>( selectorList.item ) )
				.map( parser );
			
			// console.log('loadedItemList', loadedItemList, loadedContainer.querySelectorAll<HTMLElement>( selectorList.item ));
			
			for ( let loadedItem of loadedItemList ) {
				if ( !loadedItem ) {
					continue;
				}
				// 提前将已缓存的视频标记
				if ( cacheWatchedStore.has( loadedItem.videoId ) ) {
					handleAddSign( loadedItem, 'watched', loadedItem.position );
					continue;
				}
				// console.log('loadedItem', loadedItem);
				videoSignProcessingQueue.push( loadedItem );
			}
		}
		
		// 观察者
		if ( options.observe ) {
			// 监听新增元素
			const observer = createMutationObserver( loadedContainer, ( item ) => {
				// console.log('item', item);
				
				if ( !item.closest( selectorList.item ) ) {
					return;
				}
				
				const loadedItem = parser( item );
				if ( !loadedItem ) {
					return;
				}
				// 提前将已缓存的视频标记
				if ( cacheWatchedStore.has( loadedItem.videoId ) ) {
					handleAddSign( loadedItem, 'watched', loadedItem.position );
					return;
				}
				
				// console.log('loadedItem', loadedItem);
				
				videoSignProcessingQueue.push( loadedItem );
			} );
			if ( observer ) {
				ObserverList.add( observer );
				observerList.push( observer );
			}
		}
	}
	
	return observerList;
};

/**
 * MutationObserver 集合管理器
 */
export class ObserverList {
	// 通用视频元素标记观察者列表
	private static observerSet: Set<MutationObserver> = new Set<MutationObserver>();
	
	static get list() {
		return this.observerSet;
	}
	
	static get size() {
		return this.observerSet.size;
	}
	
	static reset() {
		this.remove( ...Array.from( this.observerSet ) );
		console.log( 'this.observerSet', this.observerSet );
	}
	
	static add( observer: MutationObserver ) {
		this.observerSet.add( observer );
		return observer;
	}
	
	static remove( ...observers: MutationObserver[] ) {
		for ( const observer of observers ) {
			observer.disconnect();
			this.observerSet.delete( observer );
		}
	}
}
