/**
 * 页面版本号
 *
 * 每次路由切换（`updatePage`）自增一次。异步标记流程在
 * `await` 前后比对版本号，路由已变就丢弃旧页面的结果。
 */
let version = 0;

/**
 * 读取当前页面版本号。
 */
export const getPageVersion = (): number => version;

/**
 * 自增页面版本号并返回新值。
 */
export const bumpPageVersion = (): number => {
    version += 1;
    return version;
};
