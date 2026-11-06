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
    /** 链接库：没有脚本版本，不参与归档 */
    library: boolean;
    /** 该条目声明的 workspace: 依赖包名 */
    dependencies: string[];
}

export interface PlanOptions {
    /** 全量构建：忽略归档状态，含例外项目 */
    all?: boolean;
}

function toEntry(pkg: PackageInfo, action: BuildAction): PlanEntry {
    return {
        project: pkg.relDir,
        package: pkg.name,
        version: pkg.isLibrary ? null : pkg.scriptVersion,
        archived: pkg.isLibrary ? null : pkg.archived,
        action,
        exception: pkg.isLibrary ? false : pkg.isException,
        typecheck: pkg.isLibrary ? false : pkg.hasTypecheck,
        library: pkg.isLibrary,
        dependencies: [...pkg.workspaceDependencies],
    };
}

/**
 * 从需要构建的条目出发，沿 workspace: 依赖递归收集
 * 必须构建的库。环由 required 拦住，不会死循环。
 */
function collectRequiredLibraries(
    roots: readonly PlanEntry[],
    libraryByName: ReadonlyMap<string, PlanEntry>,
): Set<string> {
    const required = new Set<string>();
    const queue = roots.flatMap((entry) => entry.dependencies);

    while (queue.length > 0) {
        const name = queue.shift();
        if (name === undefined || required.has(name)) {
            continue;
        }
        const library = libraryByName.get(name);
        if (library === undefined) {
            continue;
        }
        required.add(name);
        queue.push(...library.dependencies);
    }

    return required;
}

/**
 * 库之间的稳定拓扑排序：依赖在前，同级保持发现顺序。
 * 有环时把剩下的库按发现顺序依次放行，不报错。
 */
function orderLibraries(libraries: PackageInfo[]): PackageInfo[] {
    const indexByName = new Map(
        libraries.map((pkg, index) => [pkg.name, index]),
    );
    const remaining = new Set(libraries.map((_, index) => index));
    const ordered: PackageInfo[] = [];

    while (remaining.size > 0) {
        let picked = -1;
        for (const index of remaining) {
            const dependencies =
                libraries[index].workspaceDependencies;
            const blocked = dependencies.some((name) => {
                const depIndex = indexByName.get(name);
                return (
                    depIndex !== undefined && remaining.has(depIndex)
                );
            });
            if (!blocked) {
                picked = index;
                break;
            }
        }

        if (picked === -1) {
            // 环：整批按发现顺序退让，避免死循环。
            for (const index of remaining) {
                ordered.push(libraries[index]);
            }
            break;
        }

        ordered.push(libraries[picked]);
        remaining.delete(picked);
    }

    return ordered;
}

/**
 * 构建计划：默认只构建「当前脚本版本尚未归档」的项目。
 * 例外项目（没有 backup 目录的项目）默认跳过，需要 --all 才构建。
 * 链接库只在有需要构建的脚本（传递）依赖它时构建，
 * 库之间按依赖先后排序，并全部排在脚本之前。
 */
export function createBuildPlan(
    packages: PackageInfo[],
    options: PlanOptions = {},
): PlanEntry[] {
    const scripts = packages.filter((pkg) => !pkg.isLibrary);
    const libraries = packages.filter((pkg) => pkg.isLibrary);

    const scriptEntries = scripts.map((pkg) => {
        const pending = !pkg.isException && pkg.archived === false;
        return toEntry(
            pkg,
            options.all || pending ? 'build' : 'skip',
        );
    });

    const libraryEntries = orderLibraries(libraries).map((pkg) =>
        toEntry(pkg, 'skip'),
    );
    const libraryByName = new Map(
        libraryEntries.map((entry) => [entry.package, entry]),
    );
    const required = collectRequiredLibraries(
        scriptEntries.filter((entry) => entry.action === 'build'),
        libraryByName,
    );

    const librariesWithAction = libraryEntries.map((entry) =>
        required.has(entry.package)
            ? { ...entry, action: 'build' as const }
            : entry,
    );

    return [...librariesWithAction, ...scriptEntries];
}

/**
 * 从计划里裁出目标项目：按 relDir 或包名匹配，返回目标
 * 与它传递依赖的库条目，保持计划顺序。
 *
 * 目标是库时把它强制为 build（用户明确要求重建），
 * 它的库依赖也一起构建，避免拿旧产物。
 * 环由 selected 拦住。
 */
export function selectPlanEntries(
    plan: readonly PlanEntry[],
    spec: string,
): PlanEntry[] {
    const normalized = spec
        .replaceAll('\\', '/')
        .replace(/\/+$/, '')
        .replace(/^\.\//, '');
    const targets = plan.filter(
        (entry) =>
            entry.project === normalized ||
            entry.package === normalized,
    );
    if (targets.length === 0) {
        return [];
    }

    const libraryByName = new Map<string, PlanEntry>();
    for (const entry of plan) {
        if (entry.library) {
            libraryByName.set(entry.package, entry);
        }
    }

    const selected = new Set<string>();
    const queue = [...targets];
    while (queue.length > 0) {
        const entry = queue.shift();
        if (entry === undefined || selected.has(entry.project)) {
            continue;
        }
        selected.add(entry.project);
        for (const name of entry.dependencies) {
            const library = libraryByName.get(name);
            if (library !== undefined) {
                queue.push(library);
            }
        }
    }

    const targetProjects = new Set(
        targets.map((entry) => entry.project),
    );
    const filtered = plan.filter((entry) =>
        selected.has(entry.project),
    );
    // 被显式选中的库是新的构建目标，它的库依赖也要跟着
    // 重建，避免拿旧产物。
    const roots = filtered.filter(
        (entry) =>
            entry.action === 'build' ||
            (entry.library && targetProjects.has(entry.project)),
    );
    const required = collectRequiredLibraries(
        roots,
        new Map(
            filtered
                .filter((entry) => entry.library)
                .map((entry) => [entry.package, entry]),
        ),
    );

    return filtered.map((entry) => {
        if (!entry.library) {
            return entry;
        }
        const forced =
            targetProjects.has(entry.project) ||
            required.has(entry.package);
        return forced && entry.action !== 'build'
            ? { ...entry, action: 'build' as const }
            : entry;
    });
}
