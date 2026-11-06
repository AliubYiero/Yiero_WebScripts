import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { simulateClick } from '../../src/DOM/simulateClick';

describe('simulateClick', () => {
    let container: HTMLDivElement;
    let button: HTMLButtonElement;

    beforeEach(() => {
        container = document.createElement('div');
        button = document.createElement('button');
        button.id = 'test-button';
        container.appendChild(button);
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('basic click functionality', () => {
        it('should dispatch mousedown, click, and mouseup events', () => {
            const mousedownSpy = rs.fn();
            const clickSpy = rs.fn();
            const mouseupSpy = rs.fn();

            button.addEventListener('mousedown', mousedownSpy);
            button.addEventListener('click', clickSpy);
            button.addEventListener('mouseup', mouseupSpy);

            simulateClick(button);

            expect(mousedownSpy).toHaveBeenCalledTimes(1);
            expect(clickSpy).toHaveBeenCalledTimes(1);
            expect(mouseupSpy).toHaveBeenCalledTimes(1);
        });

        it('should focus focusable element before clicking', () => {
            simulateClick(button);
            expect(document.activeElement).toBe(button);
        });

        it('should work with non-focusable elements', () => {
            const div = document.createElement('div');
            container.appendChild(div);

            const clickSpy = rs.fn();
            div.addEventListener('click', clickSpy);

            simulateClick(div);

            expect(clickSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('button types', () => {
        it('should simulate left button click by default', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button);

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.button).toBe(0);
        });

        it('should simulate right button click', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { button: 'right' });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.button).toBe(2);
        });

        it('should simulate middle button click', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { button: 'middle' });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.button).toBe(1);
        });
    });

    describe('event properties', () => {
        it('should set correct coordinates', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { clientX: 100, clientY: 200 });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.clientX).toBe(100);
            expect(capturedEvent?.clientY).toBe(200);
        });

        it('should set bubbles and cancelable to true by default', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button);

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.bubbles).toBe(true);
            expect(capturedEvent?.cancelable).toBe(true);
        });

        it('should allow disabling bubbles', () => {
            let parentClickCount = 0;
            let buttonClickCount = 0;

            container.addEventListener('click', () => {
                parentClickCount++;
            });

            button.addEventListener('click', () => {
                buttonClickCount++;
            });

            simulateClick(button, { bubbles: false });

            expect(buttonClickCount).toBe(1);
            expect(parentClickCount).toBe(0);
        });

        it('should set detail property', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { detail: 2 });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.detail).toBe(2);
        });
    });

    describe('modifier keys', () => {
        it('should set shiftKey correctly', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { shiftKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.shiftKey).toBe(true);
        });

        it('should set ctrlKey correctly', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { ctrlKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.ctrlKey).toBe(true);
        });

        it('should set altKey correctly', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { altKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.altKey).toBe(true);
        });

        it('should set metaKey correctly', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, { metaKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.metaKey).toBe(true);
        });

        it('should handle multiple modifier keys', () => {
            let capturedEvent: MouseEvent | null = null;

            button.addEventListener('click', (e) => {
                capturedEvent = e as MouseEvent;
            });

            simulateClick(button, {
                ctrlKey: true,
                shiftKey: true,
                altKey: false,
            });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.ctrlKey).toBe(true);
            expect(capturedEvent?.shiftKey).toBe(true);
            expect(capturedEvent?.altKey).toBe(false);
        });
    });

    describe('event sequence', () => {
        it('should dispatch events in correct order', () => {
            const eventOrder: string[] = [];

            button.addEventListener('mousedown', () =>
                eventOrder.push('mousedown'),
            );
            button.addEventListener('click', () => eventOrder.push('click'));
            button.addEventListener('mouseup', () =>
                eventOrder.push('mouseup'),
            );

            simulateClick(button);

            expect(eventOrder).toEqual(['mousedown', 'click', 'mouseup']);
        });
    });
});
