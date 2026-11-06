import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import {
    mergeRestore,
    restoreDirectory,
    snapshotDirectory,
} from './backup-snapshot';
import { type PackageInfo, repoRoot } from './workspace';

const pnpmCommand =
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

export interface BuildOutcome {
    ok: boolean;
}

/**
 * 构建单个项目，并保证 `backup/` 归档「要么整体成功、
 * 要么原样退回」。与 `pnpm build` 的单项目步骤等价。
 */
export function buildPackage(pkg: PackageInfo): BuildOutcome {
    const snapshot = pkg.backupDir
        ? snapshotDirectory(pkg.backupDir)
        : null;
    if (pkg.backupDir) {
        rmSync(pkg.backupDir, { recursive: true, force: true });
    }

    let ok = true;
    try {
        execFileSync(pnpmCommand, ['--filter', pkg.name, 'build'], {
            cwd: repoRoot,
            stdio: 'inherit',
            shell: true,
        });
    } catch {
        ok = false;
    }

    if (snapshot !== null) {
        if (ok) {
            mergeRestore(snapshot);
        } else {
            restoreDirectory(snapshot);
        }
    }

    return { ok };
}

/**
 * 提交 / 打标签前是否要重建：
 * 例外项目没有归档目录，永远重建；其余项目只在当前
 * 脚本版本尚未归档时重建（已归档则静默跳过）。
 */
export function needsArchiveBuild(pkg: PackageInfo): boolean {
    if (pkg.isLibrary) {
        return false;
    }
    return pkg.isException || pkg.archived === false;
}
