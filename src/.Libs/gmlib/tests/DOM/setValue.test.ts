import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { setValue } from '../../src/DOM/setValue';

describe('setValue', () => {
    let container: HTMLDivElement;
    let input: HTMLInputElement;
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
        container = document.createElement('div');
        input = document.createElement('input');
        input.type = 'text';
        textarea = document.createElement('textarea');
        container.appendChild(input);
        container.appendChild(textarea);
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('basic functionality', () => {
        it('should set value on input element', () => {
            setValue(input, 'test value');

            expect(input.value).toBe('test value');
        });

        it('should set value on textarea element', () => {
            setValue(textarea, 'multi-line\ntext');

            expect(textarea.value).toBe('multi-line\ntext');
        });

        it('should overwrite existing value', () => {
            input.value = 'old value';

            setValue(input, 'new value');

            expect(input.value).toBe('new value');
        });

        it('should handle empty string', () => {
            input.value = 'existing value';

            setValue(input, '');

            expect(input.value).toBe('');
        });
    });

    describe('events', () => {
        it('should dispatch input event', () => {
            const inputSpy = rs.fn();
            input.addEventListener('input', inputSpy);

            setValue(input, 'test');

            expect(inputSpy).toHaveBeenCalledTimes(1);
        });

        it('should dispatch change event', () => {
            const changeSpy = rs.fn();
            input.addEventListener('change', changeSpy);

            setValue(input, 'test');

            expect(changeSpy).toHaveBeenCalledTimes(1);
        });

        it('should dispatch events with bubbles: true', () => {
            const inputSpy = rs.fn();
            const changeSpy = rs.fn();

            container.addEventListener('input', inputSpy);
            container.addEventListener('change', changeSpy);

            setValue(input, 'test');

            expect(inputSpy).toHaveBeenCalledTimes(1);
            expect(changeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('triggerFocusBlur option', () => {
        it('should not trigger focus/blur by default', () => {
            const focusSpy = rs.fn();
            const blurSpy = rs.fn();

            input.addEventListener('focus', focusSpy);
            input.addEventListener('blur', blurSpy);

            setValue(input, 'test');

            expect(focusSpy).not.toHaveBeenCalled();
            expect(blurSpy).not.toHaveBeenCalled();
        });

        it('should trigger focus/blur when triggerFocusBlur is true', () => {
            const focusSpy = rs.fn();
            const blurSpy = rs.fn();

            input.addEventListener('focus', focusSpy);
            input.addEventListener('blur', blurSpy);

            setValue(input, 'test', { triggerFocusBlur: true });

            expect(focusSpy).toHaveBeenCalledTimes(1);
            expect(blurSpy).toHaveBeenCalledTimes(1);
        });

        it('should trigger events in correct order', () => {
            const events: string[] = [];

            input.addEventListener('focus', () => events.push('focus'));
            input.addEventListener('input', () => events.push('input'));
            input.addEventListener('change', () => events.push('change'));
            input.addEventListener('blur', () => events.push('blur'));

            setValue(input, 'test', { triggerFocusBlur: true });

            expect(events).toEqual(['focus', 'input', 'change', 'blur']);
        });
    });

    describe('disabled state', () => {
        it('should not set value on disabled input', () => {
            input.disabled = true;

            setValue(input, 'test');

            expect(input.value).toBe('');
        });

        it('should not dispatch events on disabled input', () => {
            input.disabled = true;
            const inputSpy = rs.fn();
            input.addEventListener('input', inputSpy);

            setValue(input, 'test');

            expect(inputSpy).not.toHaveBeenCalled();
        });

        it('should not set value on disabled textarea', () => {
            textarea.disabled = true;

            setValue(textarea, 'test');

            expect(textarea.value).toBe('');
        });
    });

    describe('readOnly state', () => {
        it('should not set value on readOnly input', () => {
            input.readOnly = true;

            setValue(input, 'test');

            expect(input.value).toBe('');
        });

        it('should not dispatch events on readOnly input', () => {
            input.readOnly = true;
            const changeSpy = rs.fn();
            input.addEventListener('change', changeSpy);

            setValue(input, 'test');

            expect(changeSpy).not.toHaveBeenCalled();
        });
    });

    describe('type validation', () => {
        it('should do nothing for non-input elements', () => {
            const div = document.createElement('div');
            const changeSpy = rs.fn();
            div.addEventListener('change', changeSpy);

            // TypeScript would prevent this, but testing runtime behavior
            setValue(div as unknown as HTMLInputElement, 'test');

            expect(changeSpy).not.toHaveBeenCalled();
        });

        it('should work with different input types', () => {
            const emailInput = document.createElement('input');
            emailInput.type = 'email';
            container.appendChild(emailInput);

            setValue(emailInput, 'test@example.com');

            expect(emailInput.value).toBe('test@example.com');
        });
    });

    describe('native setter fallback', () => {
        it('should use native setter when available', () => {
            // This test verifies the function doesn't throw
            // The actual native setter behavior is tested implicitly
            expect(() => {
                setValue(input, 'test');
            }).not.toThrow();

            expect(input.value).toBe('test');
        });
    });
});
