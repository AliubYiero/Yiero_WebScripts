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
const projectArg = projectIndex >= 0 ? args[projectIndex + 1] : null;
const projectFilter =
    projectArg === undefined || projectArg === null
        ? null
        : projectArg.replaceAll('\\', '/').replace(/\/+$/, '');
const pnpmCommand =
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const packages = discoverPackages();
const plan = createBuildPlan(packages, { all });
const targetPlan =
    projectFilter === null
        ? plan
        : plan.filter((entry) => entry.project === projectFilter);

if (dryRun) {
    console.log(JSON.stringify(targetPlan, null, 4));
    process.exit(0);
}

if (projectFilter !== null && targetPlan.length === 0) {
    console.error(`构建计划里没有项目：${projectFilter}`);
    process.exit(2);
}

const pending = targetPlan.filter(
    (entry) => entry.action === 'build',
);

if (pending.length === 0) {
    if (projectFilter !== null) {
        console.error(
            `该项目当前版本已归档，无需构建：${projectFilter}（如需强制重建，加 --force）`,
        );
        process.exit(2);
    }

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
