import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { simulateKeyboard } from '../../src/DOM/simulateKeyboard';

describe('simulateKeyboard', () => {
    let container: HTMLDivElement;
    let input: HTMLInputElement;

    beforeEach(() => {
        container = document.createElement('div');
        input = document.createElement('input');
        input.type = 'text';
        container.appendChild(input);
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('basic keyboard functionality', () => {
        it('should dispatch keydown and keyup events', () => {
            const keydownSpy = rs.fn();
            const keyupSpy = rs.fn();

            input.addEventListener('keydown', keydownSpy);
            input.addEventListener('keyup', keyupSpy);

            simulateKeyboard(input, { key: 'a' });

            expect(keydownSpy).toHaveBeenCalledTimes(1);
            expect(keyupSpy).toHaveBeenCalledTimes(1);
        });

        it('should focus target element before dispatching events', () => {
            simulateKeyboard(input, { key: 'Enter' });
            expect(document.activeElement).toBe(input);
        });

        it('should use document.activeElement when no target provided', () => {
            input.focus();

            const keydownSpy = rs.fn();
            input.addEventListener('keydown', keydownSpy);

            simulateKeyboard({ key: 'a' });

            expect(keydownSpy).toHaveBeenCalledTimes(1);
        });

        it('should use document.body when no element is focused', () => {
            (document.activeElement as HTMLElement)?.blur();

            const keydownSpy = rs.fn();
            document.body.addEventListener('keydown', keydownSpy);

            simulateKeyboard({ key: 'Escape' });

            expect(keydownSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('event properties', () => {
        it('should set key property correctly', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'Enter' });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.key).toBe('Enter');
        });

        it('should set code property correctly', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'a', code: 'KeyA' });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.code).toBe('KeyA');
        });

        it('should set bubbles and cancelable to true by default', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'a' });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.bubbles).toBe(true);
            expect(capturedEvent?.cancelable).toBe(true);
        });

        it('should allow disabling bubbles', () => {
            let parentKeyCount = 0;
            let inputKeyCount = 0;

            container.addEventListener('keydown', () => {
                parentKeyCount++;
            });

            input.addEventListener('keydown', () => {
                inputKeyCount++;
            });

            simulateKeyboard(input, { key: 'a', bubbles: false });

            expect(inputKeyCount).toBe(1);
            expect(parentKeyCount).toBe(0);
        });

        it('should set repeat property', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'a', repeat: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.repeat).toBe(true);
        });
    });

    describe('modifier keys', () => {
        it('should set shiftKey correctly', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'a', shiftKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.shiftKey).toBe(true);
        });

        it('should set ctrlKey correctly', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'c', ctrlKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.ctrlKey).toBe(true);
        });

        it('should set altKey correctly', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'Tab', altKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.altKey).toBe(true);
        });

        it('should set metaKey correctly', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 's', metaKey: true });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.metaKey).toBe(true);
        });

        it('should handle multiple modifier keys', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, {
                key: 'c',
                ctrlKey: true,
                shiftKey: true,
            });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.ctrlKey).toBe(true);
            expect(capturedEvent?.shiftKey).toBe(true);
            expect(capturedEvent?.altKey).toBe(false);
        });
    });

    describe('special keys', () => {
        it('should handle Enter key', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
            });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.key).toBe('Enter');
        });

        it('should handle Escape key', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
            });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.key).toBe('Escape');
        });

        it('should handle Tab key', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, { key: 'Tab', code: 'Tab', keyCode: 9 });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.key).toBe('Tab');
        });

        it('should handle Arrow keys', () => {
            let capturedEvent: KeyboardEvent | null = null;

            input.addEventListener('keydown', (e) => {
                capturedEvent = e;
            });

            simulateKeyboard(input, {
                key: 'ArrowDown',
                code: 'ArrowDown',
                keyCode: 40,
            });

            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.key).toBe('ArrowDown');
        });
    });

    describe('keypress event', () => {
        it('should dispatch keypress for printable characters', () => {
            const keypressSpy = rs.fn();

            input.addEventListener('keypress', keypressSpy);

            simulateKeyboard(input, { key: 'a' });

            expect(keypressSpy).toHaveBeenCalledTimes(1);
        });

        it('should not dispatch keypress for non-printable keys', () => {
            const keypressSpy = rs.fn();

            input.addEventListener('keypress', keypressSpy);

            simulateKeyboard(input, { key: 'Enter' });

            expect(keypressSpy).toHaveBeenCalledTimes(0);
        });

        it('should not dispatch keypress when modifier keys are pressed', () => {
            const keypressSpy = rs.fn();

            input.addEventListener('keypress', keypressSpy);

            simulateKeyboard(input, { key: 'c', ctrlKey: true });

            expect(keypressSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('event sequence', () => {
        it('should dispatch events in correct order for printable characters', () => {
            const eventOrder: string[] = [];

            input.addEventListener('keydown', () => eventOrder.push('keydown'));
            input.addEventListener('keypress', () =>
                eventOrder.push('keypress'),
            );
            input.addEventListener('keyup', () => eventOrder.push('keyup'));

            simulateKeyboard(input, { key: 'a' });

            expect(eventOrder).toEqual(['keydown', 'keypress', 'keyup']);
        });

        it('should dispatch events in correct order for special keys', () => {
            const eventOrder: string[] = [];

            input.addEventListener('keydown', () => eventOrder.push('keydown'));
            input.addEventListener('keypress', () =>
                eventOrder.push('keypress'),
            );
            input.addEventListener('keyup', () => eventOrder.push('keyup'));

            simulateKeyboard(input, { key: 'Enter' });

            expect(eventOrder).toEqual(['keydown', 'keyup']);
        });
    });

    describe('function overloads', () => {
        it('should work with target and options', () => {
            const keydownSpy = rs.fn();
            input.addEventListener('keydown', keydownSpy);

            simulateKeyboard(input, { key: 'a' });

            expect(keydownSpy).toHaveBeenCalledTimes(1);
        });

        it('should work with only options (no target)', () => {
            input.focus();

            const keydownSpy = rs.fn();
            input.addEventListener('keydown', keydownSpy);

            simulateKeyboard({ key: 'b' });

            expect(keydownSpy).toHaveBeenCalledTimes(1);
        });
    });
});
