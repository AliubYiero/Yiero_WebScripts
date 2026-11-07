import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { templateDir } from './template';
import { token } from './tokens';
import { discoverPackages, repoRoot } from './workspace';

/** 项目级 agent 指针文档，模板与生成物同名。 */
export const projectDocFile = 'CLAUDE.md';

/** 项目目录到仓库根的相对路径（正斜杠），深度由目录结构决定。 */
export function computeRepoRootPath(
    projectDir: string,
    rootDir: string,
): string {
    return relative(projectDir, rootDir).replaceAll('\\', '/');
}

/** 把文档里的仓库根指针占位符替换成相对路径。 */
export function substituteRepoRootPath(
    text: string,
    projectDir: string,
    rootDir: string = repoRoot,
): string {
    return text
        .split(token('repoRootPath'))
        .join(computeRepoRootPath(projectDir, rootDir));
}

/** 按模板渲染项目级文档；模板路径可注入，测试不依赖真实模板文件。 */
export function renderProjectDoc(
    projectDir: string,
    rootDir: string = repoRoot,
    templatePath: string = join(templateDir, projectDocFile),
): string {
    return substituteRepoRootPath(
        readFileSync(templatePath, 'utf8'),
        projectDir,
        rootDir,
    );
}

export interface SyncProjectDocsOptions {
    /** 仓库根；默认真实仓库根。测试传临时根。 */
    rootDir?: string;
    /** 模板路径；默认 `<rootDir>/templates/ts-template/CLAUDE.md`。 */
    templatePath?: string;
    /** true 只比对不写（`--check`）；默认 false。 */
    check?: boolean;
}

export interface SyncProjectDocsResult {
    /** 写模式实际写入的项目 relDir；check 模式恒为空。 */
    written: string[];
    /** 期望内容与磁盘不一致（含文件缺失）的项目 relDir。 */
    drifted: string[];
}

/**
 * 回填所有非库包的项目级指文档。
 *
 * 写模式与 `--check` 共用同一份计算：先算出漂移清单，写模式再
 * 只对漂移项落盘，因此重复执行不会制造无意义的 diff。
 */
export function syncProjectDocs(
    options: SyncProjectDocsOptions = {},
): SyncProjectDocsResult {
    const rootDir = options.rootDir ?? repoRoot;
    const templatePath =
        options.templatePath ??
        join(rootDir, 'templates', 'ts-template', projectDocFile);
    const check = options.check ?? false;

    const written: string[] = [];
    const drifted: string[] = [];

    for (const pkg of discoverPackages(rootDir)) {
        if (pkg.isLibrary) {
            continue;
        }

        const expected = renderProjectDoc(
            pkg.dir,
            rootDir,
            templatePath,
        );
        const docPath = join(pkg.dir, projectDocFile);
        const actual = existsSync(docPath)
            ? readFileSync(docPath, 'utf8')
            : null;
        if (actual === expected) {
            continue;
        }

        drifted.push(pkg.relDir);
        if (!check) {
            writeFileSync(docPath, expected, 'utf8');
            written.push(pkg.relDir);
        }
    }

    return { written, drifted };
}
