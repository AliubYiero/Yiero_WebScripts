import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

export const repoRoot = resolve(__dirname, '..', '..');

const SPECIAL_DOMAINS = ['.Global', '.Crontab'];

export interface PackageInfo {
    /** 绝对目录 */
    dir: string;
    /** 相对仓库根的目录（src/...） */
    relDir: string;
    /** package.json 里的包名 */
    name: string;
    /** package.json 里的版本 */
    version: string;
    /** banner 里的脚本版本；库为 null */
    scriptVersion: string | null;
    /** 当前脚本版本是否已归档 */
    archived: boolean;
    /** 备份归档目录；没有则为 null */
    backupDir: string | null;
    /** 链接库（没有 banner） */
    isLibrary: boolean;
    /** 例外项目：有脚本但没有备份归档目录 */
    isException: boolean;
}

function listDirectories(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    return readdirSync(dir)
        .filter((entry) => statSync(join(dir, entry)).isDirectory())
        .sort();
}

export function readScriptVersion(scriptDir: string): string | null {
    for (const file of [
        'banner/UserScript.ts',
        'banner/UserScript.js',
    ]) {
        const path = join(scriptDir, file);
        if (!existsSync(path)) {
            continue;
        }
        const text = readFileSync(path, 'utf8');
        const match =
            /\[\s*['"]version['"]\s*,\s*['"]([^'"]*)['"]\s*\]/.exec(
                text,
            );
        return match ? match[1] : null;
    }
    return null;
}

export function readArchivedVersions(scriptDir: string): string[] {
    const path = join(scriptDir, 'backup', 'versions.json');
    if (!existsSync(path)) {
        return [];
    }
    try {
        return Object.keys(
            JSON.parse(readFileSync(path, 'utf8')) as Record<
                string,
                string
            >,
        );
    } catch {
        return [];
    }
}

export function discoverPackages(
    root: string = repoRoot,
): PackageInfo[] {
    const srcDir = join(root, 'src');
    const result: PackageInfo[] = [];

    const candidates: { dir: string; parts: string[] }[] = [];
    for (const top of listDirectories(srcDir)) {
        if (top.startsWith('.') && !SPECIAL_DOMAINS.includes(top)) {
            continue;
        }
        if (SPECIAL_DOMAINS.includes(top)) {
            for (const project of listDirectories(
                join(srcDir, top),
            )) {
                candidates.push({
                    dir: join(srcDir, top, project),
                    parts: [top, project],
                });
            }
            continue;
        }
        for (const second of listDirectories(join(srcDir, top))) {
            for (const third of listDirectories(
                join(srcDir, top, second),
            )) {
                candidates.push({
                    dir: join(srcDir, top, second, third),
                    parts: [top, second, third],
                });
            }
        }
    }

    for (const { dir, parts } of candidates) {
        const manifest = join(dir, 'package.json');
        if (!existsSync(manifest)) {
            continue;
        }
        const manifestJson = (() => {
            try {
                return JSON.parse(
                    readFileSync(manifest, 'utf8').replace(
                        /^\uFEFF/,
                        '',
                    ),
                ) as {
                    name: string;
                    version: string;
                };
            } catch {
                throw new Error(`package.json 解析失败：${manifest}`);
            }
        })();
        const scriptVersion = readScriptVersion(dir);
        const backupDir = join(dir, 'backup');
        const hasBackup = existsSync(backupDir);
        result.push({
            dir,
            relDir: ['src', ...parts].join('/'),
            name: manifestJson.name,
            version: manifestJson.version,
            scriptVersion,
            archived:
                scriptVersion !== null &&
                readArchivedVersions(dir).includes(scriptVersion),
            backupDir: hasBackup ? backupDir : null,
            isLibrary: scriptVersion === null,
            isException: scriptVersion !== null && !hasBackup,
        });
    }

    return result.sort((a, b) => a.relDir.localeCompare(b.relDir));
}
