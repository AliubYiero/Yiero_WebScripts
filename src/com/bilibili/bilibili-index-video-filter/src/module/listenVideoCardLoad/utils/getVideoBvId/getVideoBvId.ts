/**
 * 获取视频的bv号
 * */
export const getVideoBvId = ( videoCardDom: HTMLElement ): `BV1${ string }` | '' => {
	const linkDom = videoCardDom.querySelector( 'a[href^="https://www.bilibili.com/video/"]' ) as HTMLLinkElement;
	
	if ( !linkDom ) {
		return '';
	}
	
	return new URL( linkDom.href ).pathname.split( '/' )[ 2 ] as `BV1${ string }`
		|| '';
};
