import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { copyTemplateTo } from '../copy-template';
import { fillPlaceholders } from '../fill-tokens';
import { resolveTargetMeta } from '../scaffold-options';
import {
    parseLibraryDomainTarget,
    parseTarget,
} from '../target-path';
import { templateDir } from '../template';
import { repoRoot } from '../workspace';

const libraryTarget = parseLibraryDomainTarget(process.argv[2] ?? '');

if (libraryTarget !== null) {
    console.error(
        `库域不能放脚本项目：${libraryTarget}（库请直接放到 src/.Libs/<库名>/）`,
    );
    process.exit(2);
}

const target = parseTarget(process.argv[2] ?? '');

if (target === null) {
    console.error(
        '用法：pnpm new:script 顶级域/二级域/项目名（特殊目录用 .Global/项目名 或 .Crontab/项目名）',
    );
    process.exit(2);
}

const { parts, projectName } = target;
const directory = join(repoRoot, 'src', ...parts);
const targetMeta = resolveTargetMeta(parts);

if (existsSync(directory)) {
    console.error(`目标目录已存在：${directory}`);
    process.exit(1);
}

let packageName: string;
try {
    packageName = copyTemplateTo(templateDir, directory, projectName);
    fillPlaceholders(directory, {
        projectName,
        description: projectName,
        version: '0.1.0',
        namespace: 'https://github.com/AliubYiero/Yiero_WebScripts',
        author: 'Yiero',
        license: 'GPL-3',
        runMode: targetMeta,
    });
} catch (error) {
    // 生成途中失败时清掉半成品目录，避免留下残缺项目
    rmSync(directory, { recursive: true, force: true });
    console.error(`生成失败，已清理生成的目录：${directory}`);
    throw error;
}

console.log(`已生成：${directory}`);
console.log(`包名：${packageName}`);
console.log(`运行方式：${targetMeta.key} = ${targetMeta.value}`);
console.log('');
console.log('下一步：');
console.log(
    `1. 按需修改 banner/UserScript.ts 的 ${targetMeta.key} / author / description`,
);
console.log('2. pnpm install');
console.log(`3. pnpm --filter ${packageName} dev:base`);
console.log(`4. pnpm --filter ${packageName} build`);
