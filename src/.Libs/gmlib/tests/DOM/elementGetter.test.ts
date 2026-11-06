import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { elementGetter } from '../../src/DOM/elementGetter';

describe('elementGetter', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should resolve immediately when element exists', async () => {
        container.innerHTML = '<div id="existing-element">Test</div>';

        const element = await elementGetter('#existing-element');

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.id).toBe('existing-element');
    });

    it('should wait for element to appear via polling', async () => {
        const promise = elementGetter('#delayed-element');

        setTimeout(() => {
            container.innerHTML = '<div id="delayed-element">Delayed</div>';
        }, 50);

        const element = await promise;

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.id).toBe('delayed-element');
    });

    it('should reject when element not found within timeout', async () => {
        const promise = elementGetter('#non-existent', {
            timeoutPerSecond: 0.1,
            delayPerSecond: 0,
        });

        await expect(promise).rejects.toThrow(
            'Element "#non-existent" not found',
        );
    });

    it('should search within custom parent', async () => {
        const customParent = document.createElement('div');
        customParent.id = 'custom-parent';
        customParent.innerHTML = '<span class="child">Child</span>';
        container.appendChild(customParent);

        const element = await elementGetter('.child', {
            parent: customParent,
        });

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.className).toBe('child');
    });
});
