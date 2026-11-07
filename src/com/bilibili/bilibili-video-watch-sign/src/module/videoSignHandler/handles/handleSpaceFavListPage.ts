import { elementWaiter } from '@yiero/gmlib';
import { createMutationObserver } from '../../../util/createMutationObserver';
import { baseVideoCardParser } from './handleSpaceIndexPage';
import { markVideoItems } from '../../favIndex/markVideoItems';
import { isOwnFavFolder } from '../../favIndex/isOwnFavFolder';
import { ObserverList } from './base';

/**
 * 收藏夹页面的已看视频处理
 *
 * 自己的收藏夹里全是已收藏视频，直接按已看标记；
 * 别人的收藏夹按收藏夹索引正常判断。
 */
export const handleSpaceFavListPage = async () => {
    const selectorList = {
        container: '.fav-list-main > .items',
        item: '.items__item',
    };

    // 等待元素载入
    let loadedContainer: HTMLElement;
    try {
        loadedContainer = await elementWaiter(
            selectorList.container,
            {
                delayPerSecond: 0,
            },
        );
    } catch {
        return;
    }

    const fid = Number(
        new URL(location.href).searchParams.get('fid'),
    );
    const own = await isOwnFavFolder(fid);

    // 处理已加载元素
    const loadedItemList = Array.from(
        loadedContainer.querySelectorAll<HTMLElement>(
            selectorList.item,
        ),
    )
        .map(baseVideoCardParser)
        .filter((item) => item !== null);

    await markVideoItems(loadedItemList, { forceWatched: own });

    // 监听新增元素
    const observer = createMutationObserver(
        loadedContainer,
        (item) => {
            if (!item.closest(selectorList.item)) {
                return;
            }

            const loadedItem = baseVideoCardParser(item);
            if (!loadedItem) {
                return;
            }
            void markVideoItems([loadedItem], {
                forceWatched: own,
            });
        },
    );
    if (observer) {
        ObserverList.add(observer);
    }
};
