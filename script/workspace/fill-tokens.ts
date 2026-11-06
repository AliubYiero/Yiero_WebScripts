import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkTemplate } from './check-template';
import type { TargetScriptMeta } from './scaffold-options';
import { token } from './tokens';

export interface FillOptions {
    projectName: string;
    description: string;
    version: string;
    namespace: string;
    author: string;
    license: string;
    /** 运行方式：@match 或 @crontab，二选一 */
    runMode: TargetScriptMeta;
}

const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 模板里 @match 的占位行，定时脚本需要整行换成 @crontab。 */
const matchPlaceholderPattern = new RegExp(
    `\\[\\s*['"]match['"]\\s*,\\s*['"]${escapeRegExp(
        token('match'),
    )}['"]\\s*\\],?`,
);

/** 把生成目录里的占位符替换成真实值，并做一次静态校验。 */
export function fillPlaceholders(
    directory: string,
    options: FillOptions,
): void {
    const bannerPath = join(directory, 'banner/UserScript.ts');
    let bannerText = readFileSync(bannerPath, 'utf8');

    if (options.runMode.key === 'crontab') {
        if (!matchPlaceholderPattern.test(bannerText)) {
            throw new Error(
                'fillPlaceholders：模板里找不到 match 占位行，无法改成 crontab',
            );
        }
        // 定时脚本不能带 @match，整行换成 @crontab
        bannerText = bannerText.replace(
            matchPlaceholderPattern,
            `['crontab', '${token('crontab')}'],`,
        );
    }

    const replacements: [string, string][] = [
        ['name', options.projectName],
        ['description', options.description],
        ['version', options.version],
        ['namespace', options.namespace],
        ['author', options.author],
        ['license', options.license],
        [options.runMode.key, options.runMode.value],
    ];

    for (const [key, value] of replacements) {
        bannerText = bannerText.split(token(key)).join(value);
    }
    writeFileSync(bannerPath, bannerText, 'utf8');

    const result = checkTemplate(directory, {
        allowPlaceholders: false,
        strictMeta: true,
    });
    if (result.errors.length > 0) {
        throw new Error(
            `生成后校验失败：${result.errors.join('；')}`,
        );
    }
}
