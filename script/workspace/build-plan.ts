import type { PackageInfo } from './workspace';

export type BuildAction = 'build' | 'skip';

export interface PlanEntry {
    project: string;
    package: string;
    version: string | null;
    archived: boolean | null;
    action: BuildAction;
    exception: boolean;
    /** 该项目构建时是否会做类型检查 */
    typecheck: boolean;
}

export interface PlanOptions {
    /** 全量构建：忽略归档状态，含例外项目 */
    all?: boolean;
}

/**
 * 构建计划：默认只构建「当前脚本版本尚未归档」的项目。
 * 例外项目（没有 backup 目录的项目）默认跳过，需要 --all 才构建。
 * 链接库没有脚本版本，只要还有项目要构建就必须先构建它。
 */
export function createBuildPlan(
    packages: PackageInfo[],
    options: PlanOptions = {},
): PlanEntry[] {
    const plan: PlanEntry[] = [];

    for (const pkg of packages) {
        if (pkg.isLibrary) {
            continue;
        }
        const pending = !pkg.isException && pkg.archived === false;
        plan.push({
            project: pkg.relDir,
            package: pkg.name,
            version: pkg.scriptVersion,
            archived: pkg.archived,
            action: options.all || pending ? 'build' : 'skip',
            exception: pkg.isException,
            typecheck: pkg.hasTypecheck,
        });
    }

    const libraries = packages.filter((pkg) => pkg.isLibrary);
    const needsBuild = plan.some((entry) => entry.action === 'build');
    const libraryEntries: PlanEntry[] = libraries.map((pkg) => ({
        project: pkg.relDir,
        package: pkg.name,
        version: null,
        archived: null,
        action: needsBuild ? 'build' : 'skip',
        exception: false,
        typecheck: false,
    }));

    return [...libraryEntries, ...plan];
}
