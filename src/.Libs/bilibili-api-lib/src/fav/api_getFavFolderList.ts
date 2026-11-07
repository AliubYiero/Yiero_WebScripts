import type { XhrResponse } from '../xhrRequest.ts';
import { xhrRequest } from '../xhrRequest.ts';
import type {
    IFavFolder,
    IFavFolderListData,
} from './interfaces/IFavFolder.ts';

/**
 * 获取指定用户的收藏夹列表
 *
 * 获取用户创建的全部收藏夹，包含每个收藏夹的 `media_id`、`fid` 与
 * `media_count`，可用于建立本地收藏夹索引。
 *
 * 该接口需要登录态，因此一律使用 `getWithCredentials`；未登录时
 * B 站会返回 `-101 账号未登录`，本函数不检查 `code`，由调用方处理。
 *
 * 传入 `rid` 时，B 站会额外返回每个收藏夹的 `fav_state`（目标视频
 * 是否在该收藏夹），此时请求会补上 `type=2`。
 *
 * @param upMid - 收藏夹所有者的 mid
 * @param rid - 可选，目标视频的 aid；传入时按 B 站前端行为补 `type=2`
 * @returns 收藏夹列表，包含 `count` 与 `list`
 *
 * @example
 * ```typescript
 * // 只取收藏夹列表
 * const folders = await api_getFavFolderList(2);
 * console.log(folders.data.count);              // 收藏夹数量
 * console.log(folders.data.list[0]?.id);        // 收藏夹 media_id
 * console.log(folders.data.list[0]?.fid);       // 收藏夹短 id
 * console.log(folders.data.list[0]?.media_count); // 收藏夹内容数量
 *
 * // 查询某个视频在哪些收藏夹里
 * const folderList = await api_getFavFolderList(2, 114514);
 * console.log(folderList.data.list[0]?.fav_state); // 是否在该收藏夹
 * ```
 *
 * @see [收藏夹列表](https://socialsisteryi.github.io/bilibili-API-collect/docs/fav/info.html#%E8%8E%B7%E5%8F%96%E6%94%B6%E8%97%8F%E5%A4%B9%E5%88%97%E8%A1%A8)
 */
export function api_getFavFolderList(
    upMid: number,
    rid?: number,
): Promise<XhrResponse<IFavFolderListData>> {
    const params: Record<string, string> = {
        up_mid: String(upMid),
    };

    if (rid !== undefined) {
        params.rid = String(rid);
        params.type = '2';
    }

    return xhrRequest.getWithCredentials<IFavFolderListData>(
        'https://api.bilibili.com/x/v3/fav/folder/created/list-all',
        { params },
    );
}

export type { IFavFolder, IFavFolderListData };
