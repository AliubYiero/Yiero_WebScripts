import { IAnimationInfo, ILanguage, IQuality, IFormat } from './main.ts';

/**
 * 从 页面表格元素 中解析动漫数据
 * */
export const parseAnimationData = ( magnetContainer: HTMLTableElement ) => {
	const animationItemList = Array.from( magnetContainer.querySelectorAll<HTMLElement>( 'tbody > tr' ) );
	const animationInfoList: IAnimationInfo[] = animationItemList.map( trNode => {
		const tdList = trNode.querySelectorAll( 'td' );
		// 新网页表格结构: [复选框, 番组名, 大小, 更新时间, 下载, 播放]
		const fileNameNode = tdList[ 1 ];
		const fileSizeNode = tdList[ 2 ];
		const updateTimeNode = tdList[ 3 ];
		if ( !fileNameNode || !fileSizeNode || !updateTimeNode ) return void 0;

		const fileName = fileNameNode.querySelector( 'a.magnet-link-wrap' )?.textContent || '';

		const upperFileName = fileName.toUpperCase();
		const languageMapper: Record<string, ILanguage> = {
			'GB': '简体',
			'BIG5': '繁体',
			'简日内嵌': '简体',
			'繁日内嵌': '繁体',
			'简体': '简体',
			'繁体': '繁体',
			'CHS': '简体',
			'CHT': '繁体',
			'简日双语': '简体',
			'繁日双语': '繁体',
			'简繁日内封': '双语',
		};
		const hasLanguage = Object.entries( languageMapper ).find( ( [key] ) => upperFileName.includes( key ) );
		const language: ILanguage = hasLanguage ? hasLanguage[ 1 ] : 'UNKNOWN';

		const qualityMapper: Record<string, IQuality> = {
			'720P': '720P',
			'1080P': '1080P',
			'1920X1080': '1080P',
		};
		const hasQuality = Object.entries( qualityMapper ).find( ( [key] ) => upperFileName.includes( key ) );
		const quality: IQuality = hasQuality ? hasQuality[ 1 ] : 'UNKNOWN';

		const formatMapper: Record<string, IFormat> = {
			'MKV': 'MKV',
			'MP4': 'MP4',
		};
		const hasFormat = Object.entries( formatMapper ).find( ( [key] ) => upperFileName.includes( key ) );
		const format: IFormat = hasFormat ? hasFormat[ 1 ] : 'UNKNOWN';

		const magnetLinkNode = fileNameNode.querySelector<HTMLElement>( 'a.magnet-link' );
		if ( !magnetLinkNode ) return void 0;
		const magnetLink: string = magnetLinkNode.dataset.clipboardText || '';

		return {
			fileName: fileName,
			magnetLink: magnetLink,
			language: language,
			quality: quality,
			format: format,
			fileSize: fileSizeNode.textContent || '',
			updateTime: updateTimeNode.textContent || '',
		} as IAnimationInfo;
	} ) as IAnimationInfo[];

	const sortedAnimationInfoList = animationInfoList.toSorted( ( a, b ) => {
		const parseUpdateTimeWeight = ( updateTime: string ) => {
			const UPDATE_TIME_WEIGHT = 1_000_000_000_000;
			return Date.parse( updateTime ) / UPDATE_TIME_WEIGHT;
		};
		const parseLanguageWeight = ( language: ILanguage ) => {
			const LANGUAGE_WEIGHT = 1000;
			const languageWeightMapper: Record<ILanguage, number> = {
				'简体': 1,
				'繁体': 2,
				'双语': 3,
				'UNKNOWN': 4,
			};
			return languageWeightMapper[ language ] * LANGUAGE_WEIGHT;
		};
		const parseQualityWeight = ( quality: IQuality ) => {
			const QUALITY_WEIGHT = 10;
			const qualityWeightMapper: Record<IQuality, number> = {
				'1080P': 1,
				'720P': 2,
				'UNKNOWN': 3,
			};
			return qualityWeightMapper[ quality ] * QUALITY_WEIGHT;
		};


		const aWeight = parseLanguageWeight( a.language )
			+ parseQualityWeight( a.quality )
			+ parseUpdateTimeWeight( a.updateTime );
		const bWeight = parseLanguageWeight( b.language )
			+ parseQualityWeight( b.quality )
			+ parseUpdateTimeWeight( b.updateTime );

		return aWeight - bWeight;
	} );

	return sortedAnimationInfoList;
};
