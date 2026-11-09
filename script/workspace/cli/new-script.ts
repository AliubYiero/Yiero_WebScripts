import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { copyTemplateTo } from '../copy-template';
import { fillPlaceholders } from '../fill-tokens';
import {
    collectNewScriptTarget,
    TARGET_USAGE,
} from '../new-script-input';
import { createPrompter, isInteractive } from '../prompt';
import { resolveTargetMeta } from '../scaffold-options';
import { templateDir } from '../template';
import { repoRoot } from '../workspace';

async function main(): Promise<number> {
    const raw = process.argv[2] ?? '';
    // 管道 / CI 里没有终端可问：缺路径就直接报用法。
    if (raw.trim() === '' && !isInteractive(process.stdin)) {
        console.error(TARGET_USAGE);
        return 2;
    }

    const prompter = createPrompter({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        const outcome = await collectNewScriptTarget(prompter, raw);
        if (!outcome.ok) {
            console.error(outcome.error);
            return 2;
        }

        const { parts, projectName } = outcome.target;
        const directory = join(repoRoot, 'src', ...parts);
        const targetMeta = resolveTargetMeta(parts);

        if (existsSync(directory)) {
            console.error(`目标目录已存在：${directory}`);
            return 1;
        }

        let packageName: string;
        try {
            packageName = copyTemplateTo(
                templateDir,
                directory,
                projectName,
            );
            fillPlaceholders(directory, {
                projectName,
                description: projectName,
                version: '0.1.0',
                namespace:
                    'https://github.com/AliubYiero/Yiero_WebScripts',
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
        console.log(
            `运行方式：${targetMeta.key} = ${targetMeta.value}`,
        );
        console.log('');
        console.log('下一步：');
        console.log(
            `1. 按需修改 banner/UserScript.ts 的 ${targetMeta.key} / author / description`,
        );
        console.log('2. pnpm install');
        console.log(`3. pnpm --filter ${packageName} dev:base`);
        console.log(`4. pnpm --filter ${packageName} build`);
        return 0;
    } finally {
        prompter.close();
    }
}

main()
    .then((code) => {
        process.exitCode = code;
    })
    .catch((error: unknown) => {
        console.error(`✖ ${(error as Error).message}`);
        process.exitCode = 1;
    });
