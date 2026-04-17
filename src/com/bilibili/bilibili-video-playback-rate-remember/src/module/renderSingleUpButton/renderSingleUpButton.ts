import { elementWaiter, gmMenuCommand } from '@yiero/gmlib';
import { singleUpListStore } from '../../store/playbackRateStore.ts';
import { getUpUidFromUrl } from '../../utils';

/**
 * 渲染添加独立名单
 */
export const renderSingleUpButton = async () => {
    // 获取本页的 UP 列表
    let container: HTMLElement | null = null;
    const uidList: number[] = [];
    try {
        container = await elementWaiter('.up-info-container', {
            delayPerSecond: 0,
            timeoutPerSecond: 3,
        });
        const upLinkContainer =
            container.querySelector<HTMLAnchorElement>('.up-avatar');
        if (!upLinkContainer) {
            return uidList;
        }
        const uid = getUpUidFromUrl(upLinkContainer.href);
        uid && uidList.push(uid);
    } catch (e) {
        container = await elementWaiter(
            '.membersinfo-normal .container',
            {
                delayPerSecond: 0,
                timeoutPerSecond: 1,
            },
        );
        const upLinkContainerList = Array.from(
            container.querySelectorAll<HTMLAnchorElement>('.avatar'),
        );
        const list = upLinkContainerList.reduce<number[]>(
            (list, element) => {
                const uid = getUpUidFromUrl(element.href);
                if (uid) {
                    list.push(uid);
                }
                return list;
            },
            [],
        );
        uidList.push(...list);
    }

    // 独立名单
    uidList.forEach((uid) => {
        const openTitle = `设置独立倍速 (uid: ${uid})`;
        const closeTitle = `关闭独立倍速 (uid: ${uid})`;

        gmMenuCommand.createToggle({
            active: {
                title: openTitle,
                onClick: () => {
                    singleUpListStore.push(uid);
                },
            },
            inactive: {
                title: closeTitle,
                onClick: () => {
                    const index = singleUpListStore.indexOf(uid);
                    if (index !== -1) {
                        singleUpListStore.removeAt(index);
                    }
                },
            },
        });

        if (singleUpListStore.includes(uid)) {
            gmMenuCommand
                .toggleActive(openTitle)
                .toggleActive(closeTitle);
        }
    });

    gmMenuCommand.render();
    return uidList;
};
