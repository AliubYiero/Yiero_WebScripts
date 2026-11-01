import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkTemplate } from './check-template';
import { token } from './tokens';

export interface FillOptions {
    projectName: string;
    description: string;
    version: string;
    namespace: string;
    author: string;
    match: string;
}

/** 把生成目录里的占位符替换成真实值，并做一次静态校验。 */
export function fillPlaceholders(
    directory: string,
    options: FillOptions,
): void {
    const bannerPath = join(directory, 'banner/UserScript.ts');
    const replacements: [string, string][] = [
        ['name', options.projectName],
        ['description', options.description],
        ['version', options.version],
        ['namespace', options.namespace],
        ['author', options.author],
        ['match', options.match],
    ];

    let bannerText = readFileSync(bannerPath, 'utf8');
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
