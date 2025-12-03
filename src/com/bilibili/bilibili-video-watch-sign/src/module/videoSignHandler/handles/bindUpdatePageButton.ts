import { elementWaiter } from '@yiero/gmlib';
import {
	updatePageEvent,
	updateStatusEvent,
} from '../../../util/updateEvent.ts';

/**
 * 绑定点击按钮触发的页面更新
 */
export class BindUpdatePageButton {
	static async base(
		containerSelector: string,
		buttonSelector: string,
		updateWay: 'updatePage' | 'updateStatus' = 'updatePage',
	) {
		// 触发页面更新, 重新绑定标记
		const container = await elementWaiter( containerSelector );
		if ( container.dataset.bindUpdate ) return;
		
		container.addEventListener( 'click', ( { target } ) => {
			const element = target as HTMLElement;
			
			// console.log( element, buttonSelector, element.closest( buttonSelector )  );
			
			if ( element.closest( buttonSelector ) ) {
				updateWay === 'updatePage' && updatePageEvent();
				updateWay === 'updateStatus' && updateStatusEvent();
			}
		} );
		container.dataset.bindUpdate = 'true';
	}
	
	/**
	 * 分页按钮触发的页面更新
	 */
	static pagination() {
		return this.base(
			'.vui_pagenation--btns',
			'.vui_button',
		);
	}
	
	/**
	 * 分页按钮触发的状态更新
	 */
	static paginationWithStatus() {
		return this.base(
			'.vui_pagenation--btns',
			'.vui_button',
			'updateStatus',
		);
	}
	
	/**
	 * 视频过滤器触发的页面更新
	 */
	static filter() {
		return this.base(
			'.radio-filter',
			'.radio-filter__item',
		);
	}
	
	/**
	 * UP主对应的动态
	 */
	static upDynamic() {
		return this.base(
			'.bili-dyn-up-list__content',
			'.bili-dyn-up-list__item',
		);
	}
	
	/**
	 * 侧边栏
	 */
	static sidebar() {
		return this.base(
			'.side-nav',
			'.side-nav__item',
		);
	}
	
	/**
	 * 稍后再看过滤器
	 */
	static watchLaterFilter() {
		return this.base(
			'.list-header',
			'.list-header-filter__btn',
		);
	}
	
	/**
	 * 首页刷新按钮
	 */
	static indexRefresh() {
		return Promise.any([
			this.base(
				'.feed-roll-btn',
				'.feed-roll-btn',
			),
			this.base(
				'.palette-button-wrap',
				'.flexible-roll-btn',
			),
		]) ;
	}
}
