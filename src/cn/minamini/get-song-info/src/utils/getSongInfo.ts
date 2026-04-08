/**
 * 歌曲信息
 */
export interface SongInfo {
	song: string;
	singer: string;
}

/**
 * 获取表格单列的数据
 *
 * 该函数用于从一个HTMLElement中提取歌曲信息，包括歌曲名称和歌手名称。
 *
 * @param element HTMLElement 需要提取信息的HTMLElement
 * @returns { song: string, singer: string } 提取到的歌曲信息
 */
export const getSongInfo = ( element: HTMLElement ): SongInfo => {
	// 查找歌曲名称和歌手名称所在的表格单元格
	const songElement = element.querySelector<HTMLElement>( 'td:nth-child(2)' ); // 歌曲名称所在单元格
	const singerElement = element.querySelector<HTMLElement>( 'td:nth-child(3)' ); // 歌手名称所在单元格
	
	// 如果没有找到歌曲名称或歌手名称所在的单元格，返回空信息
	if ( !songElement || !singerElement ) {
		return {
			song: '',
			singer: '',
		};
	}
	
	// 初始化歌曲名称
	let song = '';
	
	// 查找歌曲名称所在的文本节点
	const songChildElement = Array.from( songElement.childNodes )
		.find( item => item.nodeType === Node.TEXT_NODE // 文本节点
			&& item.textContent // 节点内容不为空
			&& item.textContent.trim(), // 节点内容不为空白
		);
	
	// 如果找到歌曲名称所在的文本节点，提取歌曲名称
	if ( songChildElement ) {
		song = ( songChildElement.textContent || '' ).trim();
	}
	
	// 提取歌手名称并替换斜线为"&"
	const singer = ( singerElement.textContent || '' ).trim().replace( '/', ' & ' );
	
	// 返回歌曲信息
	return {
		song, singer,
	};
};
