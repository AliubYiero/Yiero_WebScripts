import { api_askAi } from '../../api/api_askAi.ts';
import { aiConfig } from '../../store/aiConfigStore.ts';
import { videoAdNotify } from '../../util/notify.ts';
import {
	api_getSubtitleContent,
	GetVideoSubtitlesListResult,
	IDanmakuInfo,
} from '@yiero/bilibili-api-lib';

type ISubtitleLineList = Awaited<ReturnType<typeof api_getSubtitleContent>>['body'];

/**
 * 格式化字幕对象, 将其转为 Markdown 表格
 */
const formatSubtitle = (
	subtitleLineList: ISubtitleLineList,
	danmakuLineList: IDanmakuInfo,
	mainTitle: string,
	subTitle: string,
) => {
	const header = `- 主标题: ${ mainTitle }

- 副标题: ${ subTitle }

---
`;
	const tableContentList = [];
	if ( subtitleLineList.length ) {
		tableContentList.push(`- 字幕内容:\n\n| 开始时间(s) | 结束时间(s) | 文本 |\n| --- | --- | --- |`)
		tableContentList.push(subtitleLineList.map( subtitleLine => `| ${ subtitleLine.from } | ${ subtitleLine.to } | ${ subtitleLine.content } |` ).join( '\n' ))
	}
	
	const reg = /^(.)\1*$/;
	danmakuLineList = danmakuLineList.filter(danmakuLine => !reg.test(danmakuLine.text))
	if ( danmakuLineList.length ) {
		tableContentList.push(`- 弹幕内容:\n\n| 发送时间(s) | 文本 |\n| --- | --- | --- |`)
		tableContentList.push(danmakuLineList.map( danmakuLine => `| ${ danmakuLine.startTime } | ${ danmakuLine.text } |` ).join( '\n' ))
	}
	
	return `${ header }
${ tableContentList.join('\n\n') }`;
};

export type IAdInfo = {
	hasAd: false;
} | {
	hasAd: true;
	adTimes: AdTime[]
}

export interface AdTime {
	start: number,
	end: number
}

/**
 * 获取广告的时间
 */
export const getAdTime = async (
	subtitleLineList: ISubtitleLineList,
	danmakuLineList: IDanmakuInfo,
	videoInfo: GetVideoSubtitlesListResult,
): Promise<IAdInfo> => {
	const defaultReturn = {
		hasAd: false,
	} as const;
	
	const subtitleTable = formatSubtitle(
		subtitleLineList,
		danmakuLineList,
		videoInfo.title, videoInfo.partTitle );
	if ( !aiConfig.apiKey ) {
		videoAdNotify.apiKeyLost();
		return defaultReturn;
	}
	videoAdNotify.aiUserAsk( subtitleTable );
	
	const aiAnswer = await api_askAi( {
		message: subtitleTable,
		...aiConfig,
	} );
	const answer = aiAnswer.choices[ 0 ].message.content;
	if ( answer.includes( '<video-ad-not-exist/>' ) ) {
		return defaultReturn;
	}
	
	videoAdNotify.aiAnswer( answer );
	const adTimes = Array.from(
		answer.matchAll( /<ad-start>([\d.]+)<\/ad-start>\s*<ad-end>([\d.]+)<\/ad-end>/g ),
	).map( match => ( {
		start: parseFloat( match[ 1 ] ),
		end: parseFloat( match[ 2 ] ),
	} ) );
	
	if ( !( adTimes.length ) ) {
		return defaultReturn;
	}
	return {
		hasAd: true,
		adTimes: adTimes,
	};
};
