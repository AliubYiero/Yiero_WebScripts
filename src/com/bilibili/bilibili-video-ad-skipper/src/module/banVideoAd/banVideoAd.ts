import { getAdTime } from './getAdTime.ts';
import { skipAdListener } from './skipAdListener.ts';
import { VideoAdCache } from '../../store/videoAdCacheStore.ts';
import {
	renderBanlistToggleButton,
	renderCacheClearButton,
} from '../renderButton/renderButton.ts';
import { banModeStore, currentBanListStore } from '../../store/banModeStore.ts';
import { videoAdNotify } from '../../util/notify.ts';
import { AdIcon } from '../addAdIcon/addAdIcon.ts';
import { aiConfig } from '../../store/aiConfigStore.ts';
import {
	api_getDanmakuInfo,
	getVideoSubtitlesList,
} from '@yiero/bilibili-api-lib';


/**
 * 屏蔽视频广告
 */
export const banVideoAd = async () => {
	// 获取视频信息
	videoAdNotify.getVideoInfo();
	const videoInfo = await getVideoSubtitlesList();
	
	// 获取白名单信息, 并渲染
	renderBanlistToggleButton( videoInfo.uid, videoInfo.upName );
	// 判断信息, 决定是否屏蔽视频广告
	const inBanList = currentBanListStore.has( String( videoInfo.uid ) );
	const banMode = banModeStore.get();
	if ( banMode === '白名单' && inBanList ) {
		// 在白名单内, 不屏蔽视频广告
		return;
	}
	if ( banMode === '黑名单' && !inBanList ) {
		// 不在黑名单内, 不屏蔽视频广告
		return;
	}
	
	// 在视频状态栏中, 添加视频广告状态显示
	AdIcon.append();
	
	// 判断是否存在 API KEY, 如果不存在则退出
	if ( !aiConfig.apiKey ) {
		videoAdNotify.apiKeyLost();
		AdIcon.changeStatusToLostApiKey();
		return;
	}
	
	// 获取缓存
	const videoAdCache = new VideoAdCache( videoInfo.bvid );
	const cacheAdTimeInfo = videoAdCache.getAdStatus();
	// 读取缓存
	if ( cacheAdTimeInfo ) {
		// 添加清除缓存按钮
		renderCacheClearButton( videoAdCache );
		
		if ( cacheAdTimeInfo.hasAd ) {
			videoAdNotify.aiAnalysisComplete( cacheAdTimeInfo.adTimes );
			await skipAdListener( cacheAdTimeInfo.adTimes );
			AdIcon.changeStatusToAdTime( cacheAdTimeInfo.adTimes );
			return;
		}
		else {
			videoAdNotify.noAdInfo();
			AdIcon.changeStatusToNoAd();
			return;
		}
	}
	
	
	// 获取当前字幕信息
	const subtitleLineList = videoInfo.subtitles.length
		? await videoInfo.subtitles[ 0 ].getContent().then( res => res.body )
		: [];
	
	// 获取当前视频弹幕信息
	const danmakuLineList = await api_getDanmakuInfo( videoInfo.cid )
		.then( res => res.data );
	
	// 无内容可供识别
	if ( !subtitleLineList.length && !danmakuLineList.length) {
		AdIcon.changeStatusToCanNotAnalyze();
		videoAdNotify.noSubtitleWarning();
		return;
	}
	
	// 提问ai获取广告时间
	videoAdNotify.aiAnalysisStart();
	AdIcon.changeStatusToAiAnalyze();
	const aiStartTime = Date.now();
	const adTimeInfo = await getAdTime( subtitleLineList, danmakuLineList, videoInfo );
	if ( !adTimeInfo.hasAd ) {
		AdIcon.changeStatusToNoAd();
		videoAdNotify.noAdInfo();
		videoAdCache.add( adTimeInfo );
		return;
	}
	
	// 添加广告监听器
	const aiDuration = ( ( Date.now() - aiStartTime ) / 1000 ).toFixed( 1 );
	videoAdNotify.aiAnalysisComplete( adTimeInfo.adTimes, aiDuration );
	videoAdCache.add( adTimeInfo );
	renderCacheClearButton( videoAdCache );
	await skipAdListener( adTimeInfo.adTimes );
	AdIcon.changeStatusToAdTime( adTimeInfo.adTimes );
};
