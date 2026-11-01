import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface BackupSnapshot {
    source: string;
    copy: string;
}

/** 把备份归档目录整体复制到临时目录。 */
export function snapshotDirectory(source: string): BackupSnapshot {
    const parent = mkdtempSync(join(tmpdir(), 'webscripts-backup-'));
    const copy = join(parent, 'backup');
    cpSync(source, copy, { recursive: true });
    return { source, copy };
}

/** 用快照覆盖回原目录：先删除构建期间产生的任何改动，再整体还原。 */
export function restoreDirectory(snapshot: BackupSnapshot): void {
    rmSync(snapshot.source, { recursive: true, force: true });
    cpSync(snapshot.copy, snapshot.source, { recursive: true });
    rmSync(snapshot.copy, { recursive: true, force: true });
    rmSync(join(snapshot.copy, '..'), {
        recursive: true,
        force: true,
    });
}
