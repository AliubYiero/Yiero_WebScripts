import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseScriptEntries } from './banner-meta';
import {
    forbiddenEntries,
    recommendedScriptKeys,
    requiredFiles,
    requiredScriptKeys,
    standardDevDependencies,
} from './template';

export interface CheckResult {
    errors: string[];
    warnings: string[];
}

export interface CheckOptions {
    /** 模板本身允许保留 {{placeholder}} 占位符；生成物不允许。 */
    allowPlaceholders?: boolean;
    /** 生成物校验：match / author 等建议键为空时也算错误。 */
    strictMeta?: boolean;
}

export { parseScriptEntries };

export function checkTemplate(
    dir: string,
    options: CheckOptions = {},
): CheckResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of requiredFiles) {
        if (!existsSync(join(dir, file))) {
            errors.push(`缺少必备文件：${file}`);
        }
    }

    for (const entry of forbiddenEntries) {
        if (existsSync(join(dir, entry))) {
            errors.push(`模板内不应包含：${entry}`);
        }
    }

    const manifestPath = join(dir, 'package.json');
    if (existsSync(manifestPath)) {
        const manifest = JSON.parse(
            readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''),
        ) as {
            devDependencies?: Record<string, string>;
        };
        const devDependencies = manifest.devDependencies ?? {};
        for (const [name, version] of Object.entries(
            standardDevDependencies,
        )) {
            const actual = devDependencies[name];
            if (actual === undefined) {
                errors.push(`模板缺少标准依赖：${name}@${version}`);
            } else if (actual !== version) {
                errors.push(
                    `模板依赖族漂移：${name} 期望 ${version}，实际 ${actual}`,
                );
            }
        }
    }

    const bannerPath = join(dir, 'banner/UserScript.ts');
    if (existsSync(bannerPath)) {
        const entries = parseScriptEntries(
            readFileSync(bannerPath, 'utf8'),
        );
        const values = new Map<string, string | null>();
        for (const entry of entries) {
            if (
                !values.has(entry.key) ||
                values.get(entry.key) === null
            ) {
                values.set(entry.key, entry.value);
            }
        }
        for (const key of requiredScriptKeys) {
            if (!values.has(key)) {
                errors.push(`脚本元数据缺少键：${key}`);
                continue;
            }
            const value = values.get(key) ?? '';
            if (value.trim() === '') {
                errors.push(`脚本元数据 ${key} 为空`);
            } else if (
                !options.allowPlaceholders &&
                /\{\{.+?\}\}/.test(value)
            ) {
                errors.push(`脚本元数据 ${key} 仍是占位符：${value}`);
            }
        }
        for (const key of recommendedScriptKeys) {
            const value = values.get(key);
            if (value === undefined) {
                warnings.push(`脚本元数据缺少建议键：${key}`);
            } else if ((value ?? '').trim() === '') {
                const message = `脚本元数据 ${key} 为空`;
                if (options.strictMeta) {
                    errors.push(message);
                } else {
                    warnings.push(message);
                }
            } else if (
                !options.allowPlaceholders &&
                /\{\{.+?\}\}/.test(value ?? '')
            ) {
                errors.push(`脚本元数据 ${key} 仍是占位符：${value}`);
            }
        }
    }

    return { errors, warnings };
}
