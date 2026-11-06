/**
 * script.json 里的 domain 与 src 目录的映射：
 * - 普通域形如 `bilibili.com`（`<二级域>.<顶级域>`），目录是 `src/com/bilibili/<项目>`
 * - 特殊域 `global` / `crontab`，目录是 `src/.Global/<项目>`、`src/.Crontab/<项目>`
 * 生成 README 的链接时，路径相对仓库根；docs/README.md 需要再补一层 `../`。
 */

/** 特殊域（script.json 顶层键）与 src 下特殊目录的映射。 */
export const SPECIAL_ENTRY_DIRECTORIES: Record<string, string> = {
    global: '.Global',
    crontab: '.Crontab',
};

/** 获取脚本项目相对仓库根的源码目录，如 `src/com/bilibili/demo`。 */
export function getScriptSourcePath(
    domain: string,
    projectName: string,
): string {
    const specialEntry = SPECIAL_ENTRY_DIRECTORIES[domain];
    if (specialEntry !== undefined) {
        return `src/${specialEntry}/${projectName}`;
    }

    const parts = domain.split('.');
    if (parts.length !== 2) {
        throw new Error(
            `无法从 ${domain} 推导源码目录：应为 <二级域>.<顶级域> 或特殊域`,
        );
    }
    return `src/${parts[1]}/${parts[0]}/${projectName}`;
}

/** 获取脚本项目 README 相对仓库根的路径，如 `src/com/bilibili/demo/README.md`。 */
export function getScriptReadmePath(
    domain: string,
    projectName: string,
): string {
    return `${getScriptSourcePath(domain, projectName)}/README.md`;
}
