import {
    existsSync,
    readdirSync,
    readFileSync,
    statSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { readScriptVersion } from './banner-meta';

export { readScriptVersion };

export const repoRoot = resolve(__dirname, '..', '..');

/** 两个特殊目录：跨站脚本与定时脚本。 */
export const SPECIAL_DOMAINS = ['.Global', '.Crontab'];

/**
 * 库域：跨域复用的链接库放在 `src/.Libs/<库名>`，两层布局。
 * 与特殊目录同级，但**不**并入 `SPECIAL_DOMAINS`——
 * 特殊目录清单同时驱动脚手架的目标解析，库域不可被选中。
 */
export const LIBRARY_DOMAIN = '.Libs';

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
    /** package.json 的 build 脚本；没有则为 null */
    buildScript: string | null;
    /** build 脚本里是否包含 tsc 类型检查 */
    hasTypecheck: boolean;
    /** package.json 的 test 脚本；没有则为 null */
    testScript: string | null;
    /** dependencies 与 devDependencies 里的 workspace: 依赖包名，按声明顺序去重 */
    workspaceDependencies: string[];
}

interface PackageManifest {
    name: string;
    version: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

/** `workspace:` 协议的依赖包名：依赖与开发依赖都算，按声明顺序去重。 */
function readWorkspaceDependencies(
    manifest: PackageManifest,
): string[] {
    const names: string[] = [];
    for (const field of [
        'dependencies',
        'devDependencies',
    ] as const) {
        const deps = manifest[field] ?? {};
        for (const [name, spec] of Object.entries(deps)) {
            if (
                spec.startsWith('workspace:') &&
                !names.includes(name)
            ) {
                names.push(name);
            }
        }
    }
    return names;
}

function listDirectories(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    return readdirSync(dir)
        .filter((entry) => statSync(join(dir, entry)).isDirectory())
        .sort();
}

export function readArchivedVersions(scriptDir: string): string[] {
    const backupDir = join(scriptDir, 'backup');
    if (!existsSync(backupDir)) {
        return [];
    }

    const versions = new Set<string>();
    const manifest = join(backupDir, 'versions.json');
    if (existsSync(manifest)) {
        try {
            const parsed = JSON.parse(
                readFileSync(manifest, 'utf8'),
            ) as Record<string, string>;
            for (const version of Object.keys(parsed)) {
                versions.add(version);
            }
        } catch {
            // versions.json 损坏时退回按文件名扫描
        }
    }

    // 老项目没有 versions.json，归档只体现在文件名上。
    for (const entry of readdirSync(backupDir)) {
        const matched =
            /_(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.backup\.js$/.exec(
                entry,
            );
        if (matched) {
            versions.add(matched[1]);
        }
    }

    return [...versions];
}

export function discoverPackages(
    root: string = repoRoot,
): PackageInfo[] {
    const srcDir = join(root, 'src');
    const result: PackageInfo[] = [];

    const candidates: {
        dir: string;
        parts: string[];
        inLibraryDomain: boolean;
    }[] = [];
    for (const top of listDirectories(srcDir)) {
        if (top === LIBRARY_DOMAIN) {
            for (const project of listDirectories(
                join(srcDir, top),
            )) {
                candidates.push({
                    dir: join(srcDir, top, project),
                    parts: [top, project],
                    inLibraryDomain: true,
                });
            }
            continue;
        }
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
                    inLibraryDomain: false,
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
                    inLibraryDomain: false,
                });
            }
        }
    }

    for (const { dir, parts, inLibraryDomain } of candidates) {
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
                ) as PackageManifest;
            } catch {
                throw new Error(`package.json 解析失败：${manifest}`);
            }
        })();
        // 库域内一律没有脚本版本，即使目录里误放了 banner。
        const scriptVersion = inLibraryDomain
            ? null
            : readScriptVersion(dir);
        const backupDir = join(dir, 'backup');
        const hasBackup = existsSync(backupDir);
        const buildScript = manifestJson.scripts?.build ?? null;
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
            isLibrary: inLibraryDomain || scriptVersion === null,
            isException: scriptVersion !== null && !hasBackup,
            buildScript,
            hasTypecheck:
                buildScript !== null &&
                /(^|\s|&)tsc(\s|$)/.test(buildScript),
            testScript: manifestJson.scripts?.test ?? null,
            workspaceDependencies:
                readWorkspaceDependencies(manifestJson),
        });
    }

    return result.sort((a, b) => a.relDir.localeCompare(b.relDir));
}
