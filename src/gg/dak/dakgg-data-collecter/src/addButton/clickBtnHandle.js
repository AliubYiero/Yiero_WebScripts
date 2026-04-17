import { getGameInfo } from '../getGameInfo/getGameInfo.js';
import { MatchDataStorage } from '../Storage/MatchDataStorage.js';
import { downloadTextFile } from '../download/downloadTextFile.js';
import { MatchDataMapperStorage } from '../Storage/MatchDataMapperStorage.js';

/**
 * 将数据字符串化
 */
const stringifyDate = (template, gameInfo) => {
    [gameInfo, ...gameInfo.teammate].forEach((info, index) => {
        for (const key in info) {
            // 重定向输入的特殊字符
            // %<key>%: 主视角
            // %t1_<key>%: 玩家一
            // %t2_<key>%: 玩家二
            const redirectKey =
                index === 0 ? key : `t${index}_${key}`;

            let replaceData = info[key];
            // 出装数据, 将数组转为字符串
            if (key === 'item') {
                replaceData = replaceData.length
                    ? replaceData.join(' | ')
                    : 'Missing';
            }

            // 队友数据(原始数据)
            if (key === 'teammate') {
                continue;
            }

            // 潜能数据
            if (['traitCore', 'traitSub'].includes(key)) {
                replaceData = `${replaceData[0]} |=> ${replaceData.slice(1).join(' -> ')}`;
            }

            template = template.replace(
                new RegExp(`%${redirectKey}%`, 'g'),
                replaceData,
            );
        }
    });

    return template;
};

/**
 * 点击按钮回调, 根据传入的函数参数, 进行复制/下载
 *
 * @param {'copy' | 'download'} event
 * @param gameInfoContainer
 * @param e
 */
export const clickBtnHandle = (event, gameInfoContainer, e) => {
    e.preventDefault();

    const gameInfo = getGameInfo(gameInfoContainer);
    const stringifyGameInfo = JSON.stringify(gameInfo, void 0, '\t');
    const originMatchData = MatchDataStorage.get(gameInfo.gameId);

    console.log('originMatchData', originMatchData);
    console.log(
        'MatchDataMapperStorage',
        MatchDataMapperStorage.matchDataMapper,
    );
    console.log('gameInfo', gameInfo);

    let template = GM_getValue(
        `${gameInfo.gameMode}.template`,
        GM_getValue(`一般.template`, ''),
    ).trim();
    let filename = GM_getValue(
        `${gameInfo.gameMode}.filename`,
        GM_getValue(`一般.filename`, ''),
    ).trim();
    // 字符串化数据
    template = stringifyDate(template, gameInfo);
    filename = stringifyDate(filename, gameInfo);
    if (!filename.endsWith('txt')) {
        filename += '.txt';
    }

    !template && (template = stringifyGameInfo);
    console.log('template: \n', template);
    if (event === 'copy') {
        GM_setClipboard(template);
        return;
    }

    // 如果传入的回调函数不是"复制", 复制游戏id到粘贴板中
    downloadTextFile(template, filename);
    GM_setClipboard(gameInfo.gameId);
};
