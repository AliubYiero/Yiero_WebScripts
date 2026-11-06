import {
    createBuildPlan,
    type PlanEntry,
    selectPlanEntries,
} from '../build-plan';
import { buildPackage } from '../build-project';
import { fail } from '../cli-common';
import { lookupProject } from '../project-context';
import { discoverPackages, type PackageInfo } from '../workspace';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all') || args.includes('--force');
const projectIndex = args.indexOf('--project');
const projectSpec = projectIndex >= 0 ? args[projectIndex + 1] : null;

const packages = discoverPackages();
const plan = createBuildPlan(packages, { all });

/** 目标条目 + 它传递依赖的链接库，保持计划顺序。 */
function planForProject(spec: string): ProjectPlan {
    const found = lookupProject(spec, packages);
    if (found.pkg === null) {
        process.exit(fail(found.error ?? `找不到项目：${spec}`));
    }
    return {
        pkg: found.pkg,
        entries: selectPlanEntries(plan, found.pkg.relDir),
    };
}

interface ProjectPlan {
    pkg: PackageInfo;
    entries: PlanEntry[];
}

if (projectIndex >= 0 && projectSpec === undefined) {
    process.exit(fail('--project 需要一个项目名'));
}

const target =
    projectSpec === null || projectSpec === undefined
        ? null
        : planForProject(projectSpec);
const targetPlan = target?.entries ?? plan;

if (dryRun) {
    console.log(JSON.stringify(targetPlan, null, 4));
    process.exit(0);
}

let targetEntry: PlanEntry | undefined;
if (target !== null) {
    targetEntry = target.entries.find(
        (entry) => entry.project === target.pkg.relDir,
    );
}

if (target !== null && targetEntry === undefined) {
    process.exit(fail(`构建计划里没有项目：${projectSpec}`));
}

// 先判定目标条目的状态再动手：被跳过的目标不能因为库依赖
// 恰好要构建就顺带把库建了、再以 0 退出。
if (
    target !== null &&
    targetEntry !== undefined &&
    targetEntry.action !== 'build'
) {
    if (targetEntry.exception) {
        process.exit(
            fail(
                `该项目是例外项目，只有 --all / build:all 会构建它：${target.pkg.relDir}`,
            ),
        );
    }
    process.exit(
        fail(
            `该项目当前版本已归档，无需构建：${target.pkg.relDir}（如需强制重建，加 --force）`,
        ),
    );
}

const pending = targetPlan.filter(
    (entry) => entry.action === 'build',
);

if (pending.length === 0) {
    console.log('没有需要构建的项目：所有脚本的当前版本都已归档。');
    process.exit(0);
}

const byProject = new Map<string, PackageInfo>(
    packages.map((pkg) => [pkg.relDir, pkg]),
);
const failures: string[] = [];

/** 库与例外项目用不同的前缀区分，脚本不带前缀。 */
function entryPrefix(entry: PlanEntry): string {
    if (entry.library) {
        return '[链接库] ';
    }
    return entry.exception ? '[例外项目] ' : '';
}

for (const entry of pending) {
    const pkg = byProject.get(entry.project);
    console.log(
        `=== ${entryPrefix(entry)}${entry.project} (${entry.package})`,
    );
    // 链接库的类型检查由库门禁负责，不提示脚本侧的 tsc 步骤。
    if (!entry.library && !entry.typecheck) {
        console.log(
            '    注意：该项目没有 tsc 类型检查步骤，构建产物未经类型检查。',
        );
    }

    if (pkg === undefined) {
        failures.push(entry.project);
        console.error(`构建失败：${entry.project}（找不到包信息）`);
        continue;
    }
    if (!buildPackage(pkg).ok) {
        failures.push(entry.project);
        console.error(`构建失败：${entry.project}`);
    }
}

if (failures.length > 0) {
    console.error(`有项目构建失败：${failures.join(', ')}`);
    process.exit(1);
}

console.log(`完成：构建了 ${pending.length} 个项目。`);
