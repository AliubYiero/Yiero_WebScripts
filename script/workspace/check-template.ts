import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { parseScriptEntries } from './banner-meta';
import {
    exclusiveScriptKeys,
    forbiddenEntries,
    recommendedScriptKeys,
    requiredFiles,
    requiredScriptKeys,
    standardDependencies,
    standardDevDependencies,
    standardScripts,
} from './template';

export interface CheckResult {
    errors: string[];
    warnings: string[];
}

export interface CheckOptions {
    /** 模板本身允许保留 {{placeholder}} 占位符；生成物不允许。 */
    allowPlaceholders?: boolean;
    /** 生成物校验：license / author 等建议键为空、运行方式三键全空时也算错误。 */
    strictMeta?: boolean;
}

export { parseScriptEntries };

const ignoredDirs = new Set([
    'node_modules',
    'dist',
    'backup',
    '.git',
]);

function collectSources(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!ignoredDirs.has(entry.name)) {
                files.push(...collectSources(join(dir, entry.name)));
            }
            continue;
        }
        if (/\.(ts|js)$/.test(entry.name)) {
            files.push(join(dir, entry.name));
        }
    }
    return files;
}

/**
 * 模板与生成物都必须是合法 UTF-8，且 TypeScript 源码能被解析。
 * biome 的目录模式对非法 UTF-8 只报 internalError，退出码却是 0，这里补一道门。
 */
function checkSources(dir: string, errors: string[]): void {
    if (!existsSync(dir)) {
        return;
    }

    for (const file of collectSources(dir)) {
        const rel = relative(dir, file).replaceAll('\\', '/');
        let source: string;
        try {
            source = new TextDecoder('utf-8', { fatal: true }).decode(
                readFileSync(file),
            );
        } catch {
            errors.push(`源码不是合法 UTF-8：${rel}`);
            continue;
        }

        if (!file.endsWith('.ts')) {
            continue;
        }

        const sourceFile = ts.createSourceFile(
            file,
            source,
            ts.ScriptTarget.ESNext,
            true,
        ) as ts.SourceFile & {
            /** TypeScript 未在公开类型里声明，但运行时存在。 */
            parseDiagnostics?: ts.Diagnostic[];
        };
        const firstError = (sourceFile.parseDiagnostics ?? [])[0];
        if (firstError === undefined) {
            continue;
        }

        const { line, character } =
            sourceFile.getLineAndCharacterOfPosition(
                firstError.start ?? 0,
            );
        const message = ts.flattenDiagnosticMessageText(
            firstError.messageText,
            ' ',
        );
        errors.push(
            `源码有语法错误：${rel}:${line + 1}:${character + 1} ${message}`,
        );
    }
}

export function checkTemplate(
    dir: string,
    options: CheckOptions = {},
): CheckResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    checkSources(dir, errors);

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
            dependencies?: Record<string, string>;
            scripts?: Record<string, string>;
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

        const dependencies = manifest.dependencies ?? {};
        for (const [name, version] of Object.entries(
            standardDependencies,
        )) {
            const actual = dependencies[name];
            if (actual === undefined) {
                errors.push(`模板缺少运行期依赖：${name}@${version}`);
            } else if (actual !== version) {
                errors.push(
                    `模板运行期依赖漂移：${name} 期望 ${version}，实际 ${actual}`,
                );
            }
        }

        const scripts = manifest.scripts ?? {};
        for (const [name, command] of Object.entries(
            standardScripts,
        )) {
            const actual = scripts[name];
            if (actual === undefined) {
                errors.push(`模板缺少委托命令：${name}`);
            } else if (actual !== command) {
                errors.push(
                    `模板委托命令被改动：${name} 期望 ${command}，实际 ${actual}`,
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

        // 运行方式三选一：match / background / crontab
        const presentExclusiveKeys = exclusiveScriptKeys.filter(
            (key) => (values.get(key) ?? '').trim() !== '',
        );
        if (presentExclusiveKeys.length === 0) {
            const message = `脚本元数据 ${exclusiveScriptKeys.join(
                ' / ',
            )} 至少需要一个非空值`;
            if (options.strictMeta) {
                errors.push(message);
            } else {
                warnings.push(message);
            }
        } else if (presentExclusiveKeys.length > 1) {
            errors.push(
                `脚本元数据 ${presentExclusiveKeys.join(
                    ' / ',
                )} 互斥，只能保留一个`,
            );
        } else if (!options.allowPlaceholders) {
            const [key] = presentExclusiveKeys;
            const value = (values.get(key) ?? '').trim();
            if (/\{\{.+?\}\}/.test(value)) {
                errors.push(`脚本元数据 ${key} 仍是占位符：${value}`);
            }
        }
    }

    return { errors, warnings };
}
