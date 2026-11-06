import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { elementWaiter } from '../../src/DOM/elementWaiter';

describe('elementWaiter', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should resolve immediately when element exists', async () => {
        // 元素已经在 DOM 中
        container.innerHTML = '<div id="existing-element">Test</div>';

        const element = await elementWaiter('#existing-element');

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.id).toBe('existing-element');
    });

    it('should wait for element to appear', async () => {
        // 元素还未存在
        const promise = elementWaiter('#delayed-element');

        // 延迟添加元素
        setTimeout(() => {
            container.innerHTML = '<div id="delayed-element">Delayed</div>';
        }, 50);

        const element = await promise;

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.id).toBe('delayed-element');
    });

    it('should reject when element not found within timeout', async () => {
        // 使用短超时时间和无延迟
        const promise = elementWaiter('#non-existent', {
            timeoutPerSecond: 0.1,
            delayPerSecond: 0,
        });

        await expect(promise).rejects.toThrow(
            'Element "#non-existent" not found within 0.1 seconds',
        );
    });

    it('should search within custom parent', async () => {
        // 创建自定义父容器
        const customParent = document.createElement('div');
        customParent.id = 'custom-parent';
        customParent.innerHTML = '<span class="child">Child</span>';
        container.appendChild(customParent);

        // 使用自定义父容器搜索
        const element = await elementWaiter('.child', {
            parent: customParent,
        });

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.className).toBe('child');
    });
});
