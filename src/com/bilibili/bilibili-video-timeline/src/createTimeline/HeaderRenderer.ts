import type {
    IHeaderConfig,
    IStyleConfig,
} from './ITimelineContainer.ts';
import { Tooltip } from './Tooltip.ts';
import { MoreMenu, type MoreMenuItem } from './MoreMenu.ts';

// ---- SVG 图标 ----

const ICON_LOCK = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="8" cy="11" r="1" fill="currentColor"/>
</svg>`;

const ICON_SKIP_EMPTY = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 4L9 8L3 12V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 4V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const ICON_IGNORE_MUSIC = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 12V5L13 3V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="6" cy="12" rx="3" ry="2.5" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

const ICON_MORE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
  <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
  <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
</svg>`;

// ---- 类型 ----

export interface HeaderInitialState {
    lockHighlight: boolean;
    skipEmpty: boolean;
    ignoreMusic: boolean;
}

export interface ToggleCallbacks {
    onLockTime: (active: boolean) => void;
    onSkipEmpty: (active: boolean) => void;
    onIgnoreMusic: (active: boolean) => void;
}

export interface HTMLToggleButtonElement extends HTMLButtonElement {
    __tooltip?: Tooltip;
}

export interface HTMLMoreMenuButtonElement extends HTMLButtonElement {
    __moreMenu?: MoreMenu;
}

// ---- 工厂 ----

function createToggleButton(
    id: string,
    icon: string,
    defaultStatus: boolean,
    tip: string = '',
    disabled: boolean = false,
    onClick?: (button: HTMLToggleButtonElement, id: string) => void,
): HTMLToggleButtonElement {
    const button = document.createElement(
        'button',
    ) as HTMLToggleButtonElement;
    button.classList.add('toggle-button');
    if (defaultStatus) button.classList.add('active');
    button.dataset.id = id;
    button.dataset.tip = tip;
    button.disabled = disabled;
    tip &&
        !disabled &&
        (button.__tooltip = new Tooltip(button, { content: tip }));
    button.innerHTML = icon;
    if (onClick) {
        button.addEventListener('click', () => onClick(button, id));
    }
    return button;
}

// ---- 渲染 ----

export function renderHeader(
    config: {
        meta: IHeaderConfig;
        style: IStyleConfig;
    },
    state: HeaderInitialState,
    callbacks: ToggleCallbacks,
    container: HTMLElement,
    moreMenuItems?: MoreMenuItem[],
    moreMenuScrollContainer?: HTMLElement,
    skipEmptyTip?: string,
): HTMLElement {
    const header = document.createElement('header');
    header.classList.add('timeline-header');

    const { style, meta } = config;

    if (
        !style.showSubtitleId &&
        !style.showSubtitleButton &&
        !style.showTitle
    ) {
        header.classList.add('hide');
        container.style.setProperty('--header-height', '0px');
        return header;
    }

    // 标题
    const title = document.createElement('h2');
    title.classList.add('timeline-title');
    if (!style.showTitle) title.classList.add('hide');
    title.textContent = meta.title || '字幕时间轴';
    header.appendChild(title);

    // Meta 信息行
    const metaSection = document.createElement('section');
    metaSection.classList.add('timeline-meta');

    // 按钮组
    const buttonGroup = document.createElement('section');
    buttonGroup.classList.add('timeline-button-group');
    if (!style.showSubtitleButton) buttonGroup.classList.add('hide');

    const onToggle = (
        id: string,
        button: HTMLToggleButtonElement,
    ) => {
        if (button.disabled) return;
        const active = button.classList.toggle('active');
        if (id === 'lock-time') callbacks.onLockTime(active);
        if (id === 'skip-empty') callbacks.onSkipEmpty(active);
        if (id === 'ignore-music') callbacks.onIgnoreMusic(active);
    };

    const makeToggle = (
        id: string,
        icon: string,
        active: boolean,
        tip: string,
        disabled: boolean = false,
    ) =>
        createToggleButton(id, icon, active, tip, disabled, (btn) =>
            onToggle(id, btn),
        );

    const ignoreMusicButton = makeToggle(
        'ignore-music',
        ICON_IGNORE_MUSIC,
        state.ignoreMusic,
        '过滤音乐字幕',
        !meta.isAi,
    );
    buttonGroup.appendChild(
        makeToggle(
            'lock-time',
            ICON_LOCK,
            state.lockHighlight,
            '锁定时间轴',
        ),
    );
    buttonGroup.appendChild(
        makeToggle(
            'skip-empty',
            ICON_SKIP_EMPTY,
            state.skipEmpty,
            skipEmptyTip ?? '跳过字幕间隔',
        ),
    );
    buttonGroup.appendChild(ignoreMusicButton);

    const moreButton = createToggleButton('more', ICON_MORE, false);
    buttonGroup.appendChild(moreButton);

    if (moreMenuItems && moreMenuItems.length > 0) {
        new MoreMenu(
            moreButton,
            moreMenuItems,
            moreMenuScrollContainer,
        );
    }

    metaSection.appendChild(buttonGroup);

    // 语言标签
    const langTag = document.createElement('span');
    langTag.classList.add('timeline-meta-tag');
    if (!style.showSubtitleId) langTag.classList.add('hide');
    langTag.dataset.ai = String(meta.isAi);
    langTag.textContent = `${meta.lan || '中文'}`;
    metaSection.appendChild(langTag);

    // AV 号
    const aid = meta.aid;
    const part = meta.part;
    if (aid) {
        const idTag = document.createElement('span');
        idTag.classList.add('timeline-meta-id');
        if (!style.showSubtitleId) idTag.classList.add('hide');
        idTag.textContent = `av${aid}${part ? ':p' + part : ''}`;
        metaSection.appendChild(idTag);
    }

    if (!style.showSubtitleButton && !style.showSubtitleId) {
        metaSection.classList.add('hide');
    }
    header.appendChild(metaSection);

    // 设置 header 高度
    if (
        (style.showTitle &&
            !style.showSubtitleButton &&
            !style.showSubtitleId) ||
        (!style.showTitle &&
            (style.showSubtitleButton || style.showSubtitleId))
    ) {
        container.style.setProperty('--header-height', '47px');
    }

    return header;
}

export function renderCloseButton(onClose: () => void): HTMLElement {
    const container = document.createElement('aside');
    container.classList.add('timeline-close-button-container');

    const closeButton = document.createElement('i');
    closeButton.classList.add('timeline-close-button');
    container.appendChild(closeButton);
    container.addEventListener('click', onClose);

    return container;
}

export function destroyTooltips(container: HTMLElement): void {
    const buttons =
        container.querySelectorAll<HTMLToggleButtonElement>(
            '.toggle-button',
        );
    buttons.forEach((btn) => {
        const tooltip = btn.__tooltip;
        if (tooltip) tooltip.destroy();
    });
}

export function destroyMoreMenus(container: HTMLElement): void {
    const buttons =
        container.querySelectorAll<HTMLMoreMenuButtonElement>(
            '.toggle-button',
        );
    buttons.forEach((btn) => {
        const menu = btn.__moreMenu;
        if (menu) menu.destroy();
    });
}
