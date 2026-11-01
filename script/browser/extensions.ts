import {
    existsSync,
    readdirSync,
    readFileSync,
    statSync,
} from 'node:fs';
import { join } from 'node:path';

/** 脚本猫在 Chrome 商店的扩展 id。 */
export const SCRIPTCAT_EXTENSION_ID =
    'ndcooeababalnlpkfedmmbbbgkljhpjf';

/** sctl Browser 在 Chrome 商店的扩展 id。 */
export const SCTL_BROWSER_EXTENSION_ID =
    'biafbcaobbmcodfinffakgpdgaiodbgk';

/** 外部接入要求的最低脚本猫版本。 */
export const MIN_SCRIPTCAT_VERSION = '1.5.0';

/** 找到的扩展信息。 */
export interface ExtensionInfo {
    id: string;
    /** 例如 1.4.0 */
    version: string;
    /** 扩展在磁盘上的目录 */
    dir: string;
    /** 该扩展所在的 profile 目录名，例如 Default */
    profile: string;
}

/** 列出 profile 根目录下的各个配置目录（Default 优先）。 */
export function listProfileDirs(profileRoot: string): string[] {
    if (!existsSync(profileRoot)) {
        return [];
    }

    let entries: string[];
    try {
        entries = readdirSync(profileRoot);
    } catch {
        return [];
    }

    const dirs = entries.filter((name) => {
        if (name === 'Default' || /^Profile \d+$/.test(name)) {
            return true;
        }
        return false;
    });

    return dirs.sort((a, b) => {
        if (a === 'Default') {
            return -1;
        }
        if (b === 'Default') {
            return 1;
        }
        return a.localeCompare(b);
    });
}

/** 解析 x.y.z 形式的版本号，失败返回 null。 */
export function parseVersion(
    version: string,
): [number, number, number] | null {
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
    if (!match) {
        return null;
    }
    return [
        Number.parseInt(match[1], 10),
        Number.parseInt(match[2], 10),
        Number.parseInt(match[3], 10),
    ];
}

/** actual >= minimum。任一版本无法解析时返回 false。 */
export function isAtLeastVersion(
    actual: string,
    minimum: string,
): boolean {
    const left = parseVersion(actual);
    const right = parseVersion(minimum);
    if (left === null || right === null) {
        return false;
    }

    for (let i = 0; i < 3; i += 1) {
        if (left[i] !== right[i]) {
            return left[i] > right[i];
        }
    }
    return true;
}

/**
 * 在单个 profile 目录里找扩展。优先读取
 * Extensions/<id>/<版本>_0/manifest.json；同名多版本取最高版本。
 */
export function findExtensionInProfile(
    profileRoot: string,
    profileName: string,
    id: string,
): ExtensionInfo | null {
    const base = join(profileRoot, profileName, 'Extensions', id);
    if (!existsSync(base)) {
        return null;
    }

    let entries: string[];
    try {
        entries = readdirSync(base);
    } catch {
        return null;
    }

    const found: ExtensionInfo[] = [];
    for (const name of entries) {
        const dir = join(base, name);
        let isDir = false;
        try {
            isDir = statSync(dir).isDirectory();
        } catch {
            isDir = false;
        }
        if (!isDir) {
            continue;
        }

        const manifest = join(dir, 'manifest.json');
        const version = existsSync(manifest)
            ? readManifestVersion(manifest)
            : null;
        const resolved = version ?? normalizeDirVersion(name);
        if (resolved === null) {
            continue;
        }

        found.push({
            id,
            version: resolved,
            dir,
            profile: profileName,
        });
    }

    if (found.length === 0) {
        return null;
    }

    return pickHighest(found);
}

/** 在所有 profile 目录里找扩展，取最高版本。 */
export function findExtension(
    profileRoot: string,
    id: string,
): ExtensionInfo | null {
    const results: ExtensionInfo[] = [];
    for (const profileName of listProfileDirs(profileRoot)) {
        const found = findExtensionInProfile(
            profileRoot,
            profileName,
            id,
        );
        if (found !== null) {
            results.push(found);
        }
    }

    if (results.length === 0) {
        return null;
    }

    return pickHighest(results);
}

/** 在多份结果里取版本最高的一个。 */
function pickHighest(items: ExtensionInfo[]): ExtensionInfo {
    const sorted = [...items].sort((a, b) => {
        const left = parseVersion(a.version);
        const right = parseVersion(b.version);
        if (left === null || right === null) {
            return 0;
        }
        for (let i = 0; i < 3; i += 1) {
            if (left[i] !== right[i]) {
                return right[i] - left[i];
            }
        }
        return 0;
    });
    return sorted[0];
}

function readManifestVersion(manifestPath: string): string | null {
    try {
        const raw = readFileSync(manifestPath, 'utf8');
        const parsed = JSON.parse(raw) as { version?: unknown };
        return typeof parsed.version === 'string'
            ? parsed.version
            : null;
    } catch {
        return null;
    }
}

/** 目录名形如 1.4.0_0，取出 1.4.0。 */
function normalizeDirVersion(name: string): string | null {
    const match = /^(\d+\.\d+\.\d+)(?:_\d+)?$/.exec(name);
    return match ? match[1] : null;
}
