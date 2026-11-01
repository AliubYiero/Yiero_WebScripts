import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { checkTemplate } from '../check-template';
import { copyTemplateTo } from '../copy-template';
import { fillPlaceholders } from '../fill-tokens';
import { parseTarget } from '../target-path';
import { templateDir } from '../template';
import { repoRoot } from '../workspace';

const target = parseTarget(process.argv[2] ?? '');

if (target === null) {
    console.error(
        '用法：pnpm new:script 域/子域/项目名（特殊目录用 .Global/项目名）',
    );
    process.exit(2);
}

const { parts, projectName } = target;
const directory = join(repoRoot, 'src', ...parts);
const packageName = copyTemplateTo(
    templateDir,
    directory,
    projectName,
);

fillPlaceholders(directory, {
    projectName,
    description: projectName,
    version: '0.1.0',
    namespace: 'https://github.com/AliubYiero/Yiero_WebScripts',
    author: 'Yiero',
    match: 'https://example.com/*',
});

const check = checkTemplate(directory, { strictMeta: true });
if (check.errors.length > 0) {
    console.error('生成后校验失败：');
    for (const error of check.errors) {
        console.error(`- ${error}`);
    }
    rmSync(directory, { recursive: true, force: true });
    console.error(`已清理生成的目录：${directory}`);
    process.exit(1);
}

console.log(`已生成：${directory}`);
console.log(`包名：${packageName}`);
console.log('');
console.log('下一步：');
console.log('1. 按需修改 banner/UserScript.ts 的 match / author / description');
console.log('2. pnpm install');
console.log(`3. pnpm --filter ${packageName} dev:base`);
console.log(`4. pnpm --filter ${packageName} build`);
