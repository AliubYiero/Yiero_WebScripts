import { equal, ok } from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createBuildPlan } from '../build-plan';
import { discoverPackages } from '../workspace';

function makeProject(
    root: string,
    rel: string,
    scriptVersion: string,
    archived: string | null,
): void {
    const dir = join(root, rel);
    mkdirSync(join(dir, 'banner'), { recursive: true });
    writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({
            name: '@webscripts/demo',
            version: '0.0.0',
        }),
        'utf8',
    );
    const banner = [
        "[ 'name', 'Demo' ],",
        "[ 'version', '" + scriptVersion + "' ],",
        '',
    ].join('\n');
    writeFileSync(join(dir, 'banner/UserScript.ts'), banner, 'utf8');
    if (archived !== null) {
        mkdirSync(join(dir, 'backup'), { recursive: true });
        writeFileSync(
            join(dir, 'backup/versions.json'),
            JSON.stringify({ [archived]: archived + '.js' }),
            'utf8',
        );
    }
}

test('已归档的版本默认跳过，未归档的进入构建', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeProject(root, 'src/com/demo/alpha', '1.0.0', '1.0.0');
        makeProject(root, 'src/com/demo/beta', '2.0.0', '1.0.0');
        const plan = createBuildPlan(discoverPackages(root));

        equal(plan.length, 2);
        equal(plan[0].project, 'src/com/demo/alpha');
        equal(plan[0].action, 'skip');
        equal(plan[1].project, 'src/com/demo/beta');
        equal(plan[1].action, 'build');

        const forced = createBuildPlan(discoverPackages(root), {
            all: true,
        });
        ok(forced.every((entry) => entry.action === 'build'));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('有脚本但没有备份目录的项目被标记为例外', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeProject(root, 'src/com/demo/gamma', '3.0.0', null);
        const plan = createBuildPlan(discoverPackages(root));

        equal(plan.length, 1);
        equal(plan[0].exception, true);
        equal(plan[0].archived, false);
        equal(plan[0].action, 'build');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('链接库只在有项目需要构建时进入计划', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        const libDir = join(root, 'src/com/demo/.lib');
        mkdirSync(libDir, { recursive: true });
        writeFileSync(
            join(libDir, 'package.json'),
            JSON.stringify({
                name: '@webscripts/lib',
                version: '0.0.0',
            }),
            'utf8',
        );
        makeProject(root, 'src/com/demo/alpha', '1.0.0', '1.0.0');

        const skipPlan = createBuildPlan(discoverPackages(root));
        equal(skipPlan[0].project, 'src/com/demo/.lib');
        equal(skipPlan[0].action, 'skip');

        makeProject(root, 'src/com/demo/beta', '2.0.0', '1.0.0');
        const buildPlan = createBuildPlan(discoverPackages(root));
        equal(buildPlan[0].project, 'src/com/demo/.lib');
        equal(buildPlan[0].action, 'build');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
