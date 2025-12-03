/**
 * 从URL路径检索视频ID
 */
export const getVideoId = ( url: string ): string | null => {
	try {
		// 获取视频 id
		const videoId = new URL( url ).pathname.split( '/' ).findLast( item =>
			item.startsWith( 'BV1' )
			|| item.startsWith( 'ep' )
			|| item.startsWith( 'av' ),
		);
		if ( !videoId ) return null;
		return videoId;
	}
	catch ( e ) {
		return null;
	}
};
