import { GmStorage } from '@yiero/gmlib';

export class StringListStore {
    private cache: Set<string> | null = null;

    constructor(
        private key: string,
        private defaultValue: Set<string>,
    ) {}

    /**
     * 获取值（使用缓存）
     */
    get(): Set<string> {
        // 如果缓存存在，直接返回缓存
        if (this.cache !== null) {
            return new Set(this.cache);
        }

        const content = GM_getValue(this.key) as string;
        if (!content) {
            this.cache = new Set(this.defaultValue);
            return new Set(this.defaultValue);
        }

        this.cache = new Set(content.split(/,\s/g));
        return new Set(this.cache);
    }

    /**
     * 设置值（更新缓存）
     */
    set(items: Set<string>) {
        const content = Array.from(items).join(', ');
        GM_setValue(this.key, content);
        this.cache = new Set(items); // 更新缓存
    }

    /**
     * 删除值（更新缓存）
     */
    delete(item: string) {
        const list = this.get();
        list.delete(item);
        this.set(list);
    }

    /**
     * 新增值（更新缓存）
     */
    add(item: string) {
        const list = this.get();
        list.add(item);
        this.set(list);
    }

    /**
     * 是否包含值
     */
    has(item: string): boolean {
        const list = this.get();
        return list.has(item);
        // 注意：原代码中这里有错误，has方法不应该调用set
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache = null;
    }

    /**
     * 刷新缓存（强制从存储重新读取）
     */
    refresh() {
        this.cache = null;
        return this.get();
    }
}

/**
 * 白名单用户uid列表存储, 在该列表下的用户不屏蔽广告
 */
export const banModeStore = new GmStorage<'白名单' | '黑名单'>(
    '屏蔽设置.banMode',
    '黑名单',
);
const whitelistUpStore = new StringListStore(
    '屏蔽设置.whitelist',
    new Set<string>(),
);
const blacklistUpStore = new StringListStore(
    '屏蔽设置.blacklist',
    new Set<string>(),
);
export const currentBanListStore =
    banModeStore.get() === '白名单'
        ? whitelistUpStore
        : blacklistUpStore;
