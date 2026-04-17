import { elementWaiter, gmMenuCommand } from '@yiero/gmlib';
import { handleGetCurrentPageInfo } from './handles/handleGetCurrentPageInfo.ts';
import { songInfoStore } from './store/songInfoStore.ts';

const main = async () => {
    gmMenuCommand
        .create('爬取本页信息', handleGetCurrentPageInfo)
        .create('获取所有歌曲信息, 复制到剪切板', () => {
            const songInfoList = Object.values(songInfoStore.get());
            console.log('[songInfoList]', songInfoList);
            GM_setClipboard(JSON.stringify(songInfoList, null, '\t'));
        })
        .render();
    handleGetCurrentPageInfo();

    elementWaiter('#divContent').then((element) => {
        element.addEventListener('click', handleGetCurrentPageInfo);
    });
};
main().catch(console.error);
