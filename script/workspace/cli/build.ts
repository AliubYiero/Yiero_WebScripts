import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import {
    mergeRestore,
    restoreDirectory,
    snapshotDirectory,
} from '../backup-snapshot';
import { createBuildPlan } from '../build-plan';
import { discoverPackages, repoRoot } from '../workspace';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all') || args.includes('--force');
const projectIndex = args.indexOf('--project');
const projectFilter =
    projectIndex >= 0 ? args[projectIndex + 1] : null;
const pnpmCommand =
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const packages = discoverPackages();
const plan = createBuildPlan(packages, { all });

if (dryRun) {
    console.log(JSON.stringify(plan, null, 4));
    process.exit(0);
}

const pending = plan.filter(
    (entry) =>
        entry.action === 'build' &&
        (projectFilter === null || entry.project === projectFilter),
);

if (
    projectFilter !== null &&
    !plan.some((entry) => entry.project === projectFilter)
) {
    console.error(`构建计划里没有项目：${projectFilter}`);
    process.exit(2);
}

if (pending.length === 0) {
    console.log('没有需要构建的项目：所有脚本的当前版本都已归档。');
    process.exit(0);
}

const byProject = new Map(packages.map((pkg) => [pkg.relDir, pkg]));
const failures: string[] = [];

for (const entry of pending) {
    const pkg = byProject.get(entry.project);
    const label = entry.exception ? '[例外项目] ' : '';
    console.log(`=== ${label}${entry.project} (${entry.package})`);
    if (!entry.typecheck) {
        console.log(
            '    注意：该项目没有 tsc 类型检查步骤，构建产物未经类型检查。',
        );
    }

    const snapshot = pkg?.backupDir
        ? snapshotDirectory(pkg.backupDir)
        : null;
    if (pkg?.backupDir) {
        rmSync(pkg.backupDir, { recursive: true, force: true });
    }

    let built = true;
    try {
        execFileSync(
            pnpmCommand,
            ['--filter', entry.package, 'build'],
            {
                cwd: repoRoot,
                stdio: 'inherit',
                shell: true,
            },
        );
    } catch {
        built = false;
        failures.push(entry.project);
        console.error(`构建失败：${entry.project}`);
    }

    if (snapshot) {
        if (built) {
            mergeRestore(snapshot);
        } else {
            restoreDirectory(snapshot);
        }
    }
}

if (failures.length > 0) {
    console.error(`有项目构建失败：${failures.join(', ')}`);
    process.exit(1);
}

console.log(`完成：构建了 ${pending.length} 个项目。`);
