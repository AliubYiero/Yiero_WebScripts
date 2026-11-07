import { describe, expect, it } from 'vitest';
import { resolveAlbumTagContainer } from '../src/module/videoSignHandler/handles/handleVideoPage';

function createAlbumItem(html: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'video-pod__item simple';
    container.dataset.key = 'BV1p5qrByEtH';
    container.innerHTML = html;
    return container;
}

const MULTI_P_HTML = `
    <div class="multi-p">
        <div class="simple-base-item active head">
            <div class="title"><span class="title-txt">P1</span></div>
            <div class="stats">1万</div>
        </div>
        <div class="page-list simple">
            <div class="simple-base-item normal">
                <div class="title"><span class="title-txt">P2</span></div>
            </div>
        </div>
    </div>
`;

const SINGLE_P_HTML = `
    <div class="single-p">
        <div class="simple-base-item normal">
            <div class="title"><span class="title-txt">单P</span></div>
            <div class="stats">2万</div>
        </div>
    </div>
`;

describe('resolveAlbumTagContainer', () => {
    it('多P 取 head 标题行', () => {
        const container = createAlbumItem(MULTI_P_HTML);

        const tagContainer = resolveAlbumTagContainer(container);

        expect(tagContainer.classList.contains('head')).toBe(true);
        expect(tagContainer.parentElement?.className).toBe('multi-p');
    });

    it('单P 取 normal 标题行', () => {
        const container = createAlbumItem(SINGLE_P_HTML);

        const tagContainer = resolveAlbumTagContainer(container);

        expect(tagContainer.classList.contains('normal')).toBe(true);
        expect(tagContainer.parentElement?.className).toBe(
            'single-p',
        );
    });

    it('两种标题行都没有时回退到合集项本身', () => {
        const container = createAlbumItem(
            '<div class="unknown">没有标题行</div>',
        );

        expect(resolveAlbumTagContainer(container)).toBe(container);
    });
});
