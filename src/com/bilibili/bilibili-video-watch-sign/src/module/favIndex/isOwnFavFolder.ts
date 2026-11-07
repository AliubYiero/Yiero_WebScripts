import { ensureFavIndex } from './favIndex';

/**
 * 判断给定收藏夹 id 是否属于当前登录用户
 *
 * 网页 URL 的 `fid` 参数实际是收藏夹的 media_id（即 `IFavFolder.id`），
 * 所以优先比较 `id`，同时保留 `fid` 作为兜底。
 */
export const isOwnFavFolder = async (
    fid: number,
): Promise<boolean> => {
    if (!Number.isFinite(fid)) return false;

    const favIndex = await ensureFavIndex();
    if (!favIndex) return false;

    return favIndex.folders.some(
        (folder) => folder.fid === fid || folder.id === fid,
    );
};
