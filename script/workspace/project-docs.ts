import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { templateDir } from './template';
import { token } from './tokens';
import { repoRoot } from './workspace';

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
