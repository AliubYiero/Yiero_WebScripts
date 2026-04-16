import { VideoAdCache } from '../../store/videoAdCacheStore.ts';
import { gmMenuCommand } from '@yiero/gmlib';
import {
	banModeStore,
	currentBanListStore,
} from '../../store/banModeStore.ts';

/**
 * 渲染清除缓存按钮
 */
export const renderCacheClearButton = ( videoAdCache: VideoAdCache ) => {
	gmMenuCommand.create( '清除当前视频缓存', () => {
		videoAdCache.delete();
		gmMenuCommand.remove( '清除当前视频缓存' ).render();
	} ).render();
};

/**
 * 渲染白名单/黑名单列表
 */
export const renderBanlistToggleButton = ( mid: number, upName: string ) => {
	// const whitelist = whitelistUpStore.get();
	const titleMapper: Record<string, [ string, string ]> = {
		'白名单': [ `添加广告白名单 [${ upName }]`, `移除广告白名单 [${ upName }]` ],
		'黑名单': [ `添加广告黑名单 [${ upName }]`, `移除广告黑名单 [${ upName }]` ],
	};
	const banMode = banModeStore.get();
	const [ activeTitle, inactiveTitle ] = titleMapper[ banMode ];
	
	gmMenuCommand.createToggle( {
		active: {
			title: activeTitle,
			onClick() {
				currentBanListStore.add( String( mid ) );
			},
		},
		inactive: {
			title: inactiveTitle,
			onClick() {
				currentBanListStore.delete( String( mid ) );
			},
		},
	} ).render();
	if ( currentBanListStore.has( String( mid ) ) ) {
		gmMenuCommand
			.toggleActive( activeTitle )
			.toggleActive( inactiveTitle )
			.render();
	}
};

/**
 * 停止视频广告跳转
 */
export const renderStopVideoAdJumpButton = (
	videoContainer: HTMLElement,
	handle: ( e: Event ) => any,
) => {
	const activeTitle = '暂停跳过视频广告';
	const inactiveTitle = '开启跳过视频广告';
	
	gmMenuCommand
		.createToggle( {
			active: {
				title: activeTitle,
				onClick() {
					videoContainer.removeEventListener( 'timeupdate', handle );
				},
			},
			inactive: {
				title: inactiveTitle,
				onClick() {
					videoContainer.addEventListener( 'timeupdate', handle );
				},
			},
		} )
		.render();
};
