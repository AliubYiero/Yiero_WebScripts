import { resolve } from 'node:path';
import { parseArgs } from '../args';
import { abort, fail } from '../cli-common';
import {
    createLibGatePlan,
    type LibGateMode,
    runLibGateTask,
} from '../lib-gate';
import { discoverPackages, repoRoot } from '../workspace';

const USAGE = '用法：check-libs <typecheck|test> [--root <目录>]';

const MODE_LABELS: Record<LibGateMode, string> = {
    typecheck: '类型检查',
    test: '测试',
};

function isMode(value: string | undefined): value is LibGateMode {
    return value === 'typecheck' || value === 'test';
}

const parsed = parseArgs(process.argv.slice(2), ['--root'], []);

if (parsed.errors.length > 0) {
    process.exit(fail(parsed.errors[0]));
}

const [mode, ...extra] = parsed.positionals;
if (!isMode(mode)) {
    process.exit(fail(USAGE));
}
if (extra.length > 0) {
    process.exit(fail(`多余的参数：${extra.join(' ')}`));
}

const rootValue = parsed.values.get('--root');
const packages = discoverPackages(
    rootValue === undefined ? repoRoot : resolve(rootValue),
);

if (!packages.some((pkg) => pkg.isLibrary)) {
    console.log('没有链接库（src/.Libs），跳过库门禁。');
    process.exit(0);
}

const label = MODE_LABELS[mode];
const plan = createLibGatePlan(packages, mode);

for (const skip of plan.skipped) {
    console.log(`- 跳过 ${skip.project}：${skip.reason}`);
}
for (const error of plan.errors) {
    console.error(`✖ ${error}`);
}

const failed: string[] = [];
for (const task of plan.tasks) {
    console.log(`=== ${label} ${task.project}（${task.package}）`);
    if (!runLibGateTask(task)) {
        console.error(`✖ ${label}失败：${task.project}`);
        failed.push(task.project);
    }
}

const failureCount = plan.errors.length + failed.length;
if (failureCount > 0) {
    process.exit(
        abort(`库门禁未通过：${failureCount} 个库（${label}）`),
    );
}

if (plan.tasks.length === 0) {
    console.log(`没有需要${label}的链接库。`);
    process.exit(0);
}

console.log(`库门禁通过：${label}了 ${plan.tasks.length} 个链接库。`);
