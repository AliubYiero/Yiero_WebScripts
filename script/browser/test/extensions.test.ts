import { deepEqual, equal, ok } from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
    MIN_SCRIPTCAT_VERSION,
    SCRIPTCAT_EXTENSION_ID,
    SCTL_BROWSER_EXTENSION_ID,
    findExtension,
    findExtensionInProfile,
    isAtLeastVersion,
    listProfileDirs,
    parseVersion,
} from '../extensions';

/** 造一个含指定扩展版本的 profile 目录。 */
function makeProfile(
    root: string,
    profileName: string,
    extensionId: string,
    versions: string[],
): void {
    for (const version of versions) {
        const dir = join(
            root,
            profileName,
            'Extensions',
            extensionId,
            `${version}_0`,
        );
        mkdirSync(dir, { recursive: true });
        writeFileSync(
            join(dir, 'manifest.json'),
            JSON.stringify({ version }),
            'utf8',
        );
    }
}

test('parseVersion 解析 x.y.z，失败返回 null', () => {
    deepEqual(parseVersion('1.5.0'), [1, 5, 0]);
    deepEqual(parseVersion(' 2.10.3 '), [2, 10, 3]);
    deepEqual(parseVersion('abc'), null);
});

test('isAtLeastVersion 比较三位版本号', () => {
    equal(isAtLeastVersion('1.5.0', '1.5.0'), true);
    equal(isAtLeastVersion('1.6.0', '1.5.0'), true);
    equal(isAtLeastVersion('1.4.9', '1.5.0'), false);
    equal(isAtLeastVersion('2.0.0', '1.5.0'), true);
    equal(isAtLeastVersion('bad', '1.5.0'), false);
});

test('listProfileDirs 只认 Default 与 Profile N，Default 在最前', () => {
    const root = mkdtempSync(join(tmpdir(), 'ext-profiles-'));
    try {
        for (const name of [
            'Profile 2',
            'Default',
            'Profile 3',
            'Cache',
        ]) {
            mkdirSync(join(root, name), { recursive: true });
        }
        deepEqual(listProfileDirs(root), [
            'Default',
            'Profile 2',
            'Profile 3',
        ]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('listProfileDirs 目录不存在时返回空数组', () => {
    deepEqual(listProfileDirs(join(tmpdir(), 'nope-profile')), []);
});

test('findExtensionInProfile 读 manifest 里的版本', () => {
    const root = mkdtempSync(join(tmpdir(), 'ext-one-'));
    try {
        makeProfile(root, 'Default', SCRIPTCAT_EXTENSION_ID, [
            '1.4.0',
        ]);
        const info = findExtensionInProfile(
            root,
            'Default',
            SCRIPTCAT_EXTENSION_ID,
        );
        equal(info?.version, '1.4.0');
        equal(info?.profile, 'Default');
        ok(info?.dir.includes(`${'1.4.0'}_0`));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('findExtensionInProfile 多个版本取最高', () => {
    const root = mkdtempSync(join(tmpdir(), 'ext-multi-'));
    try {
        makeProfile(root, 'Default', SCRIPTCAT_EXTENSION_ID, [
            '1.4.0',
            '1.5.0',
        ]);
        const info = findExtensionInProfile(
            root,
            'Default',
            SCRIPTCAT_EXTENSION_ID,
        );
        equal(info?.version, '1.5.0');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('findExtensionInProfile 没装时返回 null', () => {
    const root = mkdtempSync(join(tmpdir(), 'ext-none-'));
    try {
        mkdirSync(join(root, 'Default'), { recursive: true });
        equal(
            findExtensionInProfile(
                root,
                'Default',
                SCRIPTCAT_EXTENSION_ID,
            ),
            null,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('findExtension 扫所有 profile，取版本最高的那个', () => {
    const root = mkdtempSync(join(tmpdir(), 'ext-all-'));
    try {
        makeProfile(root, 'Default', SCTL_BROWSER_EXTENSION_ID, [
            '1.0.0',
        ]);
        makeProfile(root, 'Profile 2', SCTL_BROWSER_EXTENSION_ID, [
            '2.1.0',
        ]);
        const info = findExtension(root, SCTL_BROWSER_EXTENSION_ID);
        equal(info?.version, '2.1.0');
        equal(info?.profile, 'Profile 2');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('脚本猫最低版本是 1.5.0，1.4 不满足', () => {
    equal(MIN_SCRIPTCAT_VERSION, '1.5.0');
    equal(isAtLeastVersion('1.4.0', MIN_SCRIPTCAT_VERSION), false);
    equal(isAtLeastVersion('1.5.0', MIN_SCRIPTCAT_VERSION), true);
});
