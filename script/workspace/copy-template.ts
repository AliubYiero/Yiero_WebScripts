import {
    cpSync,
    existsSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { forbiddenEntries } from './template';

/**
 * 把模板复制到目标目录，并把包名与 README 标题改成项目实际值。
 * 返回新项目的包名。
 */
export function copyTemplateTo(
    templateDir: string,
    directory: string,
    projectName: string,
): string {
    if (existsSync(directory)) {
        throw new Error(`目标目录已存在：${directory}`);
    }

    cpSync(templateDir, directory, {
        recursive: true,
        filter: (source) =>
            !forbiddenEntries.includes(basename(source)),
    });

    const packageName = `@webscripts/${projectName}`;
    const manifestPath = join(directory, 'package.json');
    const manifestText = readFileSync(manifestPath, 'utf8')
        .replace(
            '"name": "tampermonkey-scripts"',
            `"name": "${packageName}"`,
        )
        .replace('"version": "0.1.0"', '"version": "0.0.0"');
    writeFileSync(manifestPath, manifestText, 'utf8');

    const readmePath = join(directory, 'README.md');
    const readmeText = readFileSync(readmePath, 'utf8')
        .split('[脚本名称]')
        .join(projectName);
    writeFileSync(readmePath, readmeText, 'utf8');

    return packageName;
}
