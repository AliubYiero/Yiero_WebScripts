import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkTemplate } from './check-template';
import { token } from './tokens';

export interface FillOptions {
    projectName: string;
    description: string;
    version: string;
    namespace: string;
}

/** 把生成目录里的占位符替换成真实值，并做一次静态校验。 */
export function fillPlaceholders(
    directory: string,
    options: FillOptions,
): void {
    const bannerPath = join(directory, 'banner/UserScript.ts');
    const bannerText = readFileSync(bannerPath, 'utf8')
        .split(token('name'))
        .join(options.projectName)
        .split(token('description'))
        .join(options.description)
        .split(token('version'))
        .join(options.version)
        .split(token('namespace'))
        .join(options.namespace);
    writeFileSync(bannerPath, bannerText, 'utf8');

    const result = checkTemplate(directory, {
        allowPlaceholders: false,
    });
    if (result.errors.length > 0) {
        throw new Error(
            `生成后校验失败：${result.errors.join('；')}`,
        );
    }
}
