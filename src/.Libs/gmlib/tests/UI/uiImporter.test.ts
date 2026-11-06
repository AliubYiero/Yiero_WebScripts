import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { uiImporter } from '../../src/UI/uiImporter';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

describe('uiImporter', () => {
    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should parse HTML and append to document', () => {
        const htmlContent = '<div id="test-div">Hello World</div>';
        const result = uiImporter(htmlContent);

        expect(result.appendNodeList.length).toBe(1);
        expect(result.appendNodeList[0].nodeName).toBe('DIV');
        expect(document.body.querySelector('#test-div')).not.toBeNull();
        expect(document.body.querySelector('#test-div')?.textContent).toBe(
            'Hello World',
        );
    });

    it('should parse CSS and append to document', () => {
        const htmlContent = '<div id="test-div">Hello</div>';
        const cssContent = '#test-div { color: red; }';
        const result = uiImporter(htmlContent, cssContent);

        expect(result.styleNode).toBeDefined();
        expect(result.styleNode?.tagName).toBe('STYLE');
        expect(gmApiMock.GM_addStyle).toHaveBeenCalledWith(cssContent);
    });

    it('should filter script tags by default', () => {
        const htmlContent =
            '<div id="test-div">Hello</div><script>alert("test")</script>';
        const result = uiImporter(htmlContent);

        expect(result.appendNodeList.length).toBe(1);
        expect(result.appendNodeList[0].nodeName).toBe('DIV');
        expect(document.body.querySelector('script')).toBeNull();
    });

    it('should keep script tags when filter disabled', () => {
        const htmlContent =
            '<div id="test-div">Hello</div><script>alert("test")</script>';
        const result = uiImporter(htmlContent, undefined, {
            isFilterScriptNode: false,
        });

        expect(result.appendNodeList.length).toBe(2);
        expect(document.body.querySelector('script')).not.toBeNull();
    });

    it('should not append to document when disabled', () => {
        const htmlContent = '<div id="test-div">Hello World</div>';
        const result = uiImporter(htmlContent, undefined, {
            isAppendHtmlToDocument: false,
        });

        expect(result.appendNodeList.length).toBe(1);
        expect(document.body.querySelector('#test-div')).toBeNull();
    });

    it('should not append CSS when disabled', () => {
        const htmlContent = '<div id="test-div">Hello</div>';
        const cssContent = '#test-div { color: red; }';
        const result = uiImporter(htmlContent, cssContent, {
            isAppendCssToDocument: false,
        });

        expect(result.styleNode).toBeUndefined();
        expect(gmApiMock.GM_addStyle).not.toHaveBeenCalled();
    });

    it('should append to custom container', () => {
        const customContainer = document.createElement('div');
        customContainer.id = 'custom-container';
        document.body.appendChild(customContainer);

        const htmlContent = '<div id="test-div">Hello World</div>';
        const result = uiImporter(htmlContent, undefined, {
            appendHtmlContainer: customContainer,
        });

        expect(result.appendNodeList.length).toBe(1);
        expect(customContainer.querySelector('#test-div')).not.toBeNull();
        expect(
            document.body.querySelector('#custom-container > #test-div'),
        ).not.toBeNull();
    });
});
