import { elementWaiter } from '@yiero/gmlib';
import { createMutationObserver } from '../../../util/createMutationObserver';
import { handleAddSign } from '../../videoSignProcessingQueue/handleAddSign';
import { baseVideoCardParser } from './handleSpaceIndexPage';

export const handleSpaceFavListPage = async () => {
    const selectorList = {
        container: '.fav-list-main > .items',
        item: '.items__item',
    };

    // 等待元素载入
    const loadedContainer = await elementWaiter(
        selectorList.container,
        {
            delayPerSecond: 0,
        },
    );
    // 处理已加载元素
    const loadedItemList = Array.from(
        loadedContainer.querySelectorAll<HTMLElement>(
            selectorList.item,
        ),
    ).map(baseVideoCardParser);
    for (const loadedItem of loadedItemList) {
        if (!loadedItem) {
            continue;
        }
        handleAddSign(loadedItem, 'watched', loadedItem.position);
    }

    // 监听新增元素
    createMutationObserver(loadedContainer, (item) => {
        if (!item.closest(selectorList.item)) {
            return;
        }

        const loadedItem = baseVideoCardParser(item);
        if (!loadedItem) {
            return;
        }
        handleAddSign(loadedItem, 'watched', loadedItem.position);
    });
};
