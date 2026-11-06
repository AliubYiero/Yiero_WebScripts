export interface ParsedArgs {
    /** 不带值的开关，如 --dry-run */
    flags: Set<string>;
    /** 带值的选项，如 --project <路径> */
    values: Map<string, string>;
    /** 其余参数（提交信息、项目名等） */
    positionals: string[];
}

/**
 * 解析命令行参数。`--` 之后全部按位置参数处理，
 * 因此提交信息里出现的 `-` 开头片段不会被当成选项。
 */
export function parseArgs(
    argv: readonly string[],
    valueFlags: readonly string[] = [],
): ParsedArgs {
    const flags = new Set<string>();
    const values = new Map<string, string>();
    const positionals: string[] = [];
    const withValue = new Set(valueFlags);

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--') {
            positionals.push(...argv.slice(index + 1));
            break;
        }
        if (withValue.has(arg)) {
            const value = argv[index + 1];
            // 下一个就是开关时视为缺值，避免把 `--dry-run`
            // 当成 `--project` 的取值。
            if (value !== undefined && !value.startsWith('--')) {
                values.set(arg, value);
                index += 1;
            }
            continue;
        }
        if (arg.startsWith('--')) {
            flags.add(arg);
            continue;
        }
        positionals.push(arg);
    }

    return { flags, values, positionals };
}
