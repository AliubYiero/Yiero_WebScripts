import { listRemoteTags, pushTags, revOf } from './git-tags';

export interface PushTagsResult {
    ok: boolean;
    /** 失败原因，成功时为 undefined。 */
    message?: string;
}

/**
 * 推送若干标签并逐条比对远程指针：`git push` 返回成功，
 * 不代表每条 ref 都真的到位（被保护分支或钩子拦下时尤其如此）。
 */
export function pushTagsAndVerify(
    tags: readonly string[],
): PushTagsResult {
    if (tags.length === 0) {
        return { ok: true };
    }

    const pushed = pushTags([...tags]);
    if (!pushed.ok) {
        return {
            ok: false,
            message: `推送标签失败：${pushed.stderr}`,
        };
    }

    const remote = listRemoteTags();
    const mismatched = tags.filter((tag) => {
        try {
            return remote.get(tag) !== revOf(tag);
        } catch {
            return true;
        }
    });
    if (mismatched.length > 0) {
        return {
            ok: false,
            message:
                '推送后校验失败，远程指针与本地不一致：\n  ' +
                mismatched.join('\n  '),
        };
    }

    return { ok: true };
}
