import { getVideoAvId } from '../module/getVideoAvId/getVideoAvId.ts';
import { gmRequest } from '@yiero/gmlib';

export interface IFavouredResponse {
	code: number;
	message: string;
	ttl: number;
	data: IFavouredResponseData;
}

export interface IFavouredResponseData {
	count: number;
	favoured: boolean;  // true: 已收藏 false: 未收藏
}

export const api_isFavorVideo = async (
	videoId: string,
): Promise<boolean> => {
	const aid = await getVideoAvId( videoId );
	const res = await gmRequest<IFavouredResponse>(
		'https://api.bilibili.com/x/v2/fav/video/favoured',
		'GET',
		{
			aid: String( aid ),
		},
	);
	if ( res.code !== 0 ) {
		throw new Error( res.message );
	}
	// console.log( videoId, aid, res.data );
	return res.data.favoured;
};
