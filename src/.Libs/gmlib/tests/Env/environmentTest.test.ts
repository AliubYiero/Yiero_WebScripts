import { beforeEach, describe, expect, it } from '@rstest/core';
import { environmentTest } from '../../src/Env/environmentTest';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

describe('environmentTest', () => {
    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
    });

    it('should return ScriptCat environment', () => {
        gmApiMock.GM_info.scriptHandler = 'ScriptCat';

        const result = environmentTest();

        expect(result).toBe('ScriptCat');
    });

    it('should return Tampermonkey environment', () => {
        gmApiMock.GM_info.scriptHandler = 'Tampermonkey';

        const result = environmentTest();

        expect(result).toBe('Tampermonkey');
    });
});
