/**
 * 从链接中获取 bvid
 */
export const getBvId = ( url: string ) => {
	const bvId = ( url.match( /(?<=\/)BV1[^/]+/ ) || [] )[ 0 ];
	return bvId;
};
