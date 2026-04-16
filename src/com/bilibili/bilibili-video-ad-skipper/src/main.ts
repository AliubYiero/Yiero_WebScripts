import { banCommentAd } from './module/banCommentAd/banCommentAd.ts';
import { banVideoAd } from './module/banVideoAd/banVideoAd.ts';
import { commentAdBanModeStore } from './store/commentAdBanModeStore.ts';


/**
 * 主函数
 */
const main = async () => {
	// 屏蔽推广评论
	commentAdBanModeStore.get() && banCommentAd();
	
	// 屏蔽视频广告
	banVideoAd();
};

main().catch( error => {
	console.error( error );
} );
