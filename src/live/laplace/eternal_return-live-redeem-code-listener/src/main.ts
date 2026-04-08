import { laplaceLiveListener } from './listeners/laplaceLiveListener.ts';
import { bilibiliLiveListener } from './listeners/bilibiliLiveListener.ts';
import { handleReceiveRedeemCode } from './handlers/handleReceiveRedeemCode.ts';

/**
 * 根据 host判断当前网页是 laplace-chat 还是 bilibili ,
 * 然后分别执行不同的兑换码监听事件
 */
const urlCallbackMapper: Record<string, () => Promise<void>> = {
	'chat.laplace.live': laplaceLiveListener,
	'live.bilibili.com': bilibiliLiveListener,
};

;( async () => {
	if ( location.host in urlCallbackMapper ) {
		// 执行兑换码监听
		const listener = urlCallbackMapper[ location.host ];
		await listener();

		// 执行兑换码接收事件回调
		handleReceiveRedeemCode();
	}
} )();
