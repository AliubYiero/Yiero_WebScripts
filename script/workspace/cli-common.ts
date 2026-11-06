/**
 * 委托命令共用的输出格式与退出码约定：
 * - `0`：成功，或幂等跳过（没有可提交的变更、标签已存在）
 * - `1`：运行期失败（构建失败、git 操作失败）
 * - `2`：用法 / 查找错误（缺参数、项目找不到、项目名不唯一）
 *
 * 三条命令都从这里取 `fail` / `abort`，避免各自发明一套码。
 */

export const EXIT_USAGE = 2;
export const EXIT_RUNTIME = 1;

/** 用法 / 查找错误。 */
export function fail(message: string): number {
    console.error(`✖ ${message}`);
    return EXIT_USAGE;
}

/** 运行期失败，命令本身没错、是外部动作没成。 */
export function abort(message: string): number {
    console.error(`✖ ${message}`);
    return EXIT_RUNTIME;
}

/** 只打印前若干行，避免一次列几十个文件。 */
export function previewFiles(
    files: readonly string[],
    limit = 20,
): string {
    const shown = files.slice(0, limit).map((file) => `  ${file}`);
    if (files.length > shown.length) {
        shown.push(`  …另有 ${files.length - shown.length} 个文件`);
    }
    return shown.join('\n');
}

/** 把输出按行拆成路径列表。 */
export function splitLines(stdout: string): string[] {
    return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

/** 解析 `git status --porcelain`：重命名取新路径，带引号的路径去掉引号。 */
export function parseStatusLines(stdout: string): string[] {
    return stdout
        .split('\n')
        .map((line) => line.replace(/\r$/, ''))
        .filter((line) => line.length > 3)
        .map((line) => {
            const rest = line.slice(3);
            const arrow = rest.indexOf(' -> ');
            const path =
                arrow === -1
                    ? rest
                    : rest.slice(arrow + ' -> '.length);
            return path.startsWith('"') && path.endsWith('"')
                ? path.slice(1, -1)
                : path;
        });
}
