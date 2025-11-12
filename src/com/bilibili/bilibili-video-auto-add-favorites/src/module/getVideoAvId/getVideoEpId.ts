import { elementWaiter } from '@yiero/gmlib';

/**
 * 获取视频的 EPId
 */
export const getVideoEpId = async () => {
	let urlPathNameList = new URL( window.location.href ).pathname.split( '/' );
	let videoId = urlPathNameList.find( urlPathName =>
		urlPathName.startsWith( 'ep' )
		|| urlPathName.startsWith( 'ss' ),
	);
	
	if ( !videoId ) return undefined;
	
	if ( videoId.startsWith( 'ss' ) ) {
		const linkNode = await elementWaiter<HTMLLinkElement>(
			'link[rel="canonical"]', { parent: document },
		);
		if ( !linkNode ) return undefined;
		urlPathNameList = new URL( linkNode.href ).pathname.split( '/' );
		videoId = urlPathNameList.find( urlPathName => urlPathName.startsWith( 'ep' ) );
		if ( !videoId ) return undefined;
	}
	
	videoId = videoId.slice( 2 );
	
	return videoId;
};
