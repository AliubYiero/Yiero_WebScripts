import { hookXhr } from './hook/hookXhr.js';
import { MatchDataStorage } from './Storage/MatchDataStorage.js';
import { freshListenerPushState } from './freshPageCallback/freshListenerPushState.js';
import { bindEventToPage } from './bindEventToPage/bindEventToPage.js';
import { MatchDataMapperStorage } from './Storage/MatchDataMapperStorage.js';
import { isKoreanTimeZone } from './isKoreanTimeZone/isKoreanTimeZone.js';

(async function () {
    while (isKoreanTimeZone()) {
        console.log(Date.now());
    }

    // 劫持数据映射
    hookXhr(
        'https://er.dakgg.io/api/v1/data/',
        (responseText, hookUrl) => {
            const pathnameList = new URL(hookUrl).pathname.split('/');
            const dataId = pathnameList[pathnameList.length - 1];
            MatchDataMapperStorage.set(
                dataId,
                JSON.parse(responseText),
            );
        },
    );

    // 绑定页面事件
    await bindEventToPage();

    // 劫持比赛数据
    hookXhr(
        'https://er.dakgg.io/api/v1/players/',
        (responseText, hookUrl) => {
            const matchIdMatch = hookUrl.match(/\d+$/);
            if (!matchIdMatch) {
                return;
            }
            const matchId = Number(matchIdMatch[0]);
            MatchDataStorage.set(matchId, JSON.parse(responseText));
        },
    );

    // 监听页面软刷新事件, 重新绑定页面事件
    freshListenerPushState(async () => {
        await bindEventToPage();
    });
})();
