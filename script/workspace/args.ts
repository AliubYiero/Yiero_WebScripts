export interface ParsedArgs {
    /** 不带值的开关，如 --dry-run */
    flags: Set<string>;
    /** 带值的选项，如 --project <路径> */
    values: Map<string, string>;
    /** 其余参数（提交信息、项目名等） */
    positionals: string[];
    /** 参数层面的问题（缺值、未知选项），由命令决定怎么报。 */
    errors: string[];
}

/**
 * 解析命令行参数。`--` 之后全部按位置参数处理，
 * 因此提交信息里出现的 `-` 开头片段不会被当成选项。
 *
 * 传入 `booleanFlags` 时会校验未知选项，避免拼错的开关被静默忽略。
 */
export function parseArgs(
    argv: readonly string[],
    valueFlags: readonly string[] = [],
    booleanFlags?: readonly string[],
): ParsedArgs {
    const flags = new Set<string>();
    const values = new Map<string, string>();
    const positionals: string[] = [];
    const errors: string[] = [];
    const withValue = new Set(valueFlags);
    const knownFlags =
        booleanFlags === undefined ? null : new Set(booleanFlags);

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--') {
            positionals.push(...argv.slice(index + 1));
            break;
        }
        if (withValue.has(arg)) {
            const value = argv[index + 1];
            // 缺值时记成错误，而不是把下一个开关吞成取值。
            if (value === undefined || value.startsWith('--')) {
                errors.push(`选项 ${arg} 缺少取值`);
                continue;
            }
            values.set(arg, value);
            index += 1;
            continue;
        }
        if (arg.startsWith('--')) {
            if (knownFlags !== null && !knownFlags.has(arg)) {
                errors.push(`未知选项：${arg}`);
            }
            flags.add(arg);
            continue;
        }
        positionals.push(arg);
    }

    return { flags, values, positionals, errors };
}
