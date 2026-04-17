/**
 * GMStorage.ts
 * created by 2024/3/13
 * @file GM储存类
 * @author  Yiero
 * */

/**
 * GM储存类
 * @extends Storage
 * */
export class GMStorage extends Storage {
    /**
     * 拒绝用户实例化 GMStorage,
     * 只能使用静态方法
     * */
    // eslint-disable-next-line no-useless-constructors
    private constructor() {
        super();
    }

    /**
     * Storage 对象中存储的数据项数量。
     * @override Storage.length
     * */
    static get size(): number {
        return GM_listValues().length;
    }

    /**
     * 该方法接受一个键名作为参数，返回键名对应的值。
     * @override Storage.getItem()
     * */
    static getItem(key: string, defaultValue?: any): any | null {
        return GM_getValue(key, defaultValue);
    }

    /**
     * 该方法接受一个键名作为参数，判断键名对应的值是否存在
     * */
    static hasItem(key: string): boolean {
        return Boolean(GM_getValue(key, false));
    }

    /**
     * 该方法接受一个键名和值作为参数，将会把键值对添加到存储中，如果键名存在，则更新其对应的值。
     * @override Storage.setItem()
     * */
    static setItem(key: string, value: string): void {
        GM_setValue(key, value);
    }

    /**
     * 该方法接受一个键名作为参数，并把该键名从存储中删除。
     * @override Storage.removeItem()
     * */
    static removeItem(key: string): void {
        GM_deleteValue(key);
    }

    /**
     * 调用该方法会清空存储中的所有键名。
     * @override Storage.clear()
     * */
    static clear(): void {
        const keyList = GM_listValues();
        for (const key of keyList) {
            GM_deleteValue(key);
        }
    }

    /**
     * 该方法接受一个数值 n 作为参数，并返回存储中的第 n 个键名。
     * @override Storage.key()
     * */
    static key(index: number): string | null {
        return GM_listValues()[index];
    }
}
