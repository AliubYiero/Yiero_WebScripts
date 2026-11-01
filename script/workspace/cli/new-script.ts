import { join } from 'node:path';
import { copyTemplateTo } from '../copy-template';
import { fillPlaceholders } from '../fill-tokens';
import { templateDir } from '../template';
import { parseTarget } from '../target-path';
import { repoRoot } from '../workspace';

const parts = parseTarget(process.argv[2] ?? '');

if (parts === null) {
    console.error(
        '用法：pnpm new:script 域/子域/项目名（特殊目录用 .Global/项目名）',
    );
    process.exit(2);
}

const projectName = parts[parts.length - 1];
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
});

console.log('已生成：' + directory);
console.log('包名：' + packageName);
