import { describe, expect, it, vi } from 'vitest';
import { createBlockToggle } from '../src/module/blockToggle.ts';

describe('createBlockToggle', () => {
    it('初始为开启', () => {
        const toggle = createBlockToggle(() => {});

        expect(toggle.isActive()).toBe(true);
    });

    it('由开转关时清空回调恰好调用一次', () => {
        const onDisable = vi.fn();
        const toggle = createBlockToggle(onDisable);
        toggle.disable();

        expect(toggle.isActive()).toBe(false);
        expect(onDisable).toHaveBeenCalledTimes(1);
    });

    it('重复关闭不重复清理', () => {
        const onDisable = vi.fn();
        const toggle = createBlockToggle(onDisable);
        toggle.disable();
        toggle.disable();
        toggle.disable();

        expect(toggle.isActive()).toBe(false);
        expect(onDisable).toHaveBeenCalledTimes(1);
    });

    it('开启动作不调用清空回调', () => {
        const onDisable = vi.fn();
        const toggle = createBlockToggle(onDisable);
        toggle.enable();

        expect(toggle.isActive()).toBe(true);
        expect(onDisable).not.toHaveBeenCalled();
    });

    it('多次开关后状态与清理次数正确', () => {
        const onDisable = vi.fn();
        const toggle = createBlockToggle(onDisable);

        toggle.disable();
        toggle.enable();
        expect(toggle.isActive()).toBe(true);
        expect(onDisable).toHaveBeenCalledTimes(1);

        toggle.disable();
        expect(toggle.isActive()).toBe(false);
        expect(onDisable).toHaveBeenCalledTimes(2);

        toggle.enable();
        expect(toggle.isActive()).toBe(true);
        expect(onDisable).toHaveBeenCalledTimes(2);
    });
});
