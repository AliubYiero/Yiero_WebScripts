import { elementWaiter } from '@yiero/gmlib';
import { videoAdNotify } from '../../util/notify.ts';

/**
 * 判断当前评论是否为广告评论, 并移除广告评论
 */
const removeAdComment = ( commentContainer: HTMLElement ) => {
	// 从层层 shadowRoot 中进入到评论内容
	if ( !commentContainer.shadowRoot ) return;
	// console.log( commentContainer );
	const commentContentContainer = commentContainer.shadowRoot.querySelector<HTMLElement>( 'bili-comment-renderer' )!;
	// console.log( commentContentContainer );
	if ( !( commentContainer && commentContainer.shadowRoot ) ) return;
	// console.log( commentContentContainer.shadowRoot );
	// 判断评论内容中是否存在广告元素, 如果存在, 则屏蔽当前评论
	const richContentContainer = commentContentContainer.shadowRoot!.querySelectorAll<HTMLElement>( 'bili-rich-text' );
	for ( const richContentElement of richContentContainer ) {
		// console.log( 'richContent', richContentElement );
		const { shadowRoot } = richContentElement;
		if ( !shadowRoot ) continue;
		if ( !shadowRoot.querySelector( '[data-type="goods"]' ) ) {
			continue;
		}
		commentContainer.style.display = 'none';
		videoAdNotify.banCommentAd();
		break;
	}
};

/**
 * 屏蔽推广评论
 */
export const banCommentAd = async () => {
	const commentContainer = await elementWaiter( 'bili-comments', { timeoutPerSecond: void 0 } );
	if ( !commentContainer.shadowRoot ) return;
	const commentContentContainer = await elementWaiter( '#contents', {
		parent: commentContainer.shadowRoot,
		delayPerSecond: 0,
		timeoutPerSecond: void 0,
	} );
	commentContentContainer.querySelectorAll<HTMLElement>( 'bili-comment-thread-renderer' )
		.forEach( removeAdComment );
};
