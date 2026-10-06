import { elementWaiter, gmMenuCommand } from '@yiero/gmlib';
import { singleUpListStore } from '../../store/playbackRateStore.ts';
import { getUpUidFromUrl } from '../../utils';

/**
 * 读取指定容器内的 UP 主 uid 列表
 * @param containerSelector 容器选择器
 * @param linkSelector 容器内 UP 主链接选择器
 * @param timeoutPerSecond 等待容器的超时时间 (s)
 * @returns uid 列表, 容器不存在时返回 null
 */
const queryUpUidList = async (
    containerSelector: string,
    linkSelector: string,
    timeoutPerSecond: number,
): Promise<number[] | null> => {
    try {
        const container = await elementWaiter(containerSelector, {
            delayPerSecond: 0,
            timeoutPerSecond,
        });
        const linkList = Array.from(
            container.querySelectorAll<HTMLAnchorElement>(
                linkSelector,
            ),
        );
        return linkList
            .map((element) => getUpUidFromUrl(element.href))
            .filter((uid): uid is number => !!uid);
    } catch {
        return null;
    }
};

/**
 * 获取当前视频页的 UP 主 uid 列表
 *
 * 普通视频页取单个 UP 主，番剧 / 影视页取整个制作方列表
 * @returns uid 列表, 页面无 UP 信息时为空数组
 */
const getUpUidList = async (): Promise<number[]> => {
    const uidList =
        (await queryUpUidList(
            '.up-info-container',
            '.up-avatar',
            3,
        )) ??
        (await queryUpUidList(
            '.membersinfo-normal .container',
            '.avatar',
            1,
        ));
    return uidList ?? [];
};

/**
 * 渲染独立倍速菜单
 *
 * 渲染前会清空旧菜单，以便页面路由变化后基于新的 uid 列表重建
 * @param uidList 当前视频页的 UP 主 uid 列表
 */
const renderSingleUpMenu = (uidList: number[]) => {
    gmMenuCommand.reset();

    gmMenuCommand.batch(() => {
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
    });
};

/**
 * 渲染独立UP添加/删除按钮
 * @returns 当前视频页的 UP 主 uid 列表
 */
export const renderSingleUpButton = async () => {
    const uidList = await getUpUidList();
    renderSingleUpMenu(uidList);
    return uidList;
};
