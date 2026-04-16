import { elementWaiter } from '@yiero/gmlib';
import { AdTime } from '../banVideoAd/getAdTime.ts';
import { formatTime } from '../../util/formatTime.ts';
import { elementGetter } from '../../util/elementGetter.ts';
import { showIconStore } from '../../store/showIconStore.ts';

export class AdIcon {
	private static _adBanContentContainer: HTMLDivElement | null = null;
	
	static get adBanContentContainer() {
		if ( !this._adBanContentContainer ) {
			this._adBanContentContainer = document.createElement( 'div' );
			this._adBanContentContainer.classList.add( 'ad-ban-content' );
			Object.assign( this._adBanContentContainer.style, {
				color: '#9499A0',
				whiteSpace: 'nowrap',
			} );
			this._adBanContentContainer.textContent = '获取视频数据中...';
		}
		
		return this._adBanContentContainer;
	}
	
	/**
	 * 添加广告容器到页面中
	 */
	static async append() {
		if ( !showIconStore.get() ) {
			return;
		}
		
		
		await elementGetter( '.bpx-player-loading-panel:not(.bpx-state-loading)' );
		const container = await elementWaiter( '.video-info-detail-list' );
		const iconContainer = document.createElement( 'div' );
		Object.assign( iconContainer.style, {
			display: 'flex',
			gap: '4px',
			alignItems: 'center',
		} );
		
		iconContainer.innerHTML = `
<svg t="1769857927799" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4899" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><path d="M104.6 222.3V716h814.8V222.3H104.6zM873.4 670H150.6V268.3h722.8V670z" p-id="4900"></path><path d="M351.7 517.3h75.1l27.6 89.4H504l-91.2-275.5h-47.2l-90.4 275.5H324l27.7-89.4z m60.9-46h-46.7l23.4-75.7 23.3 75.7zM755.8 471.1v-3.8c0-74.9-61-135.9-135.9-135.9h-95.5V607h95.5c74.9 0 135.9-61 135.9-135.9z m-185.4-93.7h49.5c49.6 0 89.9 40.3 89.9 89.9v3.8c0 49.6-40.3 89.9-89.9 89.9h-49.5V377.4zM127.3 755.7h769.1v46H127.3z" p-id="4901"></path></svg>
	`;
		iconContainer.append( this.adBanContentContainer );
		container.append( iconContainer );
	}
	
	/**
	 * 修改视频广告状态: AI分析中
	 */
	static changeStatusToAiAnalyze() {
		this.adBanContentContainer.textContent = 'AI分析中...';
	}
	
	/**
	 * 修改视频广告状态: 无广告
	 */
	static changeStatusToNoAd() {
		this.adBanContentContainer.textContent = '当前视频无广告';
	}
	
	/**
	 * 修改视频广告状态: 广告时间显示
	 */
	static changeStatusToAdTime( adTimes: AdTime[] ) {
		this.adBanContentContainer.textContent = '广告时间: ' + adTimes.map(
			( { start, end } ) =>
				`${ formatTime( start ) }~${ formatTime( end ) }`,
		).join( ' | ' );
	}
	
	/**
	 * 修改视频广告状态: 无法识别
	 */
	static changeStatusToCanNotAnalyze() {
		this.adBanContentContainer.textContent = '当前视频无字幕, 无法识别';
	}
	
	/**
	 * 修改视频广告状态: 缺失API KEY
	 */
	static changeStatusToLostApiKey() {
		this.adBanContentContainer.textContent = '未配置 API_KEY';
	}
}
