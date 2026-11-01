import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ScriptEntry {
    key: string;
    value: string | null;
}

const entryPattern =
    /\[\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"])?\s*\]/g;

/** 解析 banner 里的 [key, value] 元数据条目，单双引号都接受。 */
export function parseScriptEntries(text: string): ScriptEntry[] {
    const entries: ScriptEntry[] = [];
    entryPattern.lastIndex = 0;
    for (
        let match = entryPattern.exec(text);
        match !== null;
        match = entryPattern.exec(text)
    ) {
        entries.push({ key: match[1], value: match[2] ?? null });
    }
    return entries;
}

/** banner 文件路径候选：TS 优先，JS 项目退回 .js。 */
const bannerFiles = ['banner/UserScript.ts', 'banner/UserScript.js'];

/** 读取 banner 里的脚本版本号；没有 banner 的库返回 null。 */
export function readScriptVersion(dir: string): string | null {
    for (const file of bannerFiles) {
        const path = join(dir, file);
        if (!existsSync(path)) {
            continue;
        }
        const entries = parseScriptEntries(
            readFileSync(path, 'utf8'),
        );
        const version = entries.find(
            (entry) => entry.key === 'version',
        );
        return version?.value ?? null;
    }
    return null;
}
