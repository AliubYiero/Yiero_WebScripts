import { beforeEach, describe, expect, it } from '@rstest/core';
import { gmMenuCommand } from '../../src/UserInteraction/gmMenuCommand';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

describe('gmMenuCommand', () => {
    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
        gmMenuCommand.list = [];
    });

    describe('create', () => {
        it('should create menu command', () => {
            const onClick = () => {};

            gmMenuCommand.create('Test Menu', onClick, true);

            expect(gmMenuCommand.list.length).toBe(1);
            expect(gmMenuCommand.list[0].title).toBe('Test Menu');
            expect(gmMenuCommand.list[0].isActive).toBe(true);
        });

        it('should throw when creating duplicate menu', () => {
            gmMenuCommand.create('Test Menu', () => {}, true);

            expect(() => {
                gmMenuCommand.create('Test Menu', () => {}, true);
            }).toThrow('菜单按钮已存在');
        });
    });

    describe('remove', () => {
        it('should remove menu command', () => {
            gmMenuCommand.create('Test Menu', () => {}, true);

            gmMenuCommand.remove('Test Menu');

            expect(gmMenuCommand.list.length).toBe(0);
        });
    });

    describe('get', () => {
        it('should return menu command by title', () => {
            const onClick = () => {};
            gmMenuCommand.create('Test Menu', onClick, true);

            const command = gmMenuCommand.get('Test Menu');

            expect(command.title).toBe('Test Menu');
            expect(command.onClick).toBe(onClick);
        });

        it('should throw when menu not found', () => {
            expect(() => {
                gmMenuCommand.get('Non-existent Menu');
            }).toThrow('菜单按钮不存在');
        });
    });

    describe('modify', () => {
        it('should modify menu command onClick', () => {
            gmMenuCommand.create('Test Menu', () => {}, true);
            const newOnClick = () => console.log('new click');

            gmMenuCommand.modify('Test Menu', { onClick: newOnClick });

            const command = gmMenuCommand.get('Test Menu');
            expect(command.onClick).toBe(newOnClick);
        });
    });

    describe('createToggle', () => {
        it('should create toggle menu commands', () => {
            gmMenuCommand.createToggle({
                active: {
                    title: 'Enable',
                    onClick: () => {},
                },
                inactive: {
                    title: 'Disable',
                    onClick: () => {},
                },
            });

            expect(gmMenuCommand.list.length).toBe(2);
            expect(gmMenuCommand.list[0].title).toBe('Enable');
            expect(gmMenuCommand.list[0].isActive).toBe(true);
            expect(gmMenuCommand.list[1].title).toBe('Disable');
            expect(gmMenuCommand.list[1].isActive).toBe(false);
        });

        it('should create toggle with inactive default state', () => {
            gmMenuCommand.createToggle(
                {
                    active: {
                        title: 'Enable',
                        onClick: () => {},
                    },
                    inactive: {
                        title: 'Disable',
                        onClick: () => {},
                    },
                },
                'inactive',
            );

            expect(gmMenuCommand.list.length).toBe(2);
            expect(gmMenuCommand.list[0].title).toBe('Enable');
            expect(gmMenuCommand.list[0].isActive).toBe(false);
            expect(gmMenuCommand.list[1].title).toBe('Disable');
            expect(gmMenuCommand.list[1].isActive).toBe(true);
        });
    });

    describe('reset', () => {
        it('should clear all menu commands', () => {
            gmMenuCommand.create('Menu 1', () => {}, true);
            gmMenuCommand.create('Menu 2', () => {}, true);

            expect(gmMenuCommand.list.length).toBe(2);

            gmMenuCommand.reset();

            expect(gmMenuCommand.list.length).toBe(0);
        });
    });

    describe('batch', () => {
        it('should batch create menus and render once', () => {
            gmMenuCommand.batch(() => {
                gmMenuCommand.create('Menu 1', () => {});
                gmMenuCommand.create('Menu 2', () => {});
                gmMenuCommand.create('Menu 3', () => {});
            });

            expect(gmMenuCommand.list.length).toBe(3);
            // batch 结束后统一 render 一次
            expect(gmApiMock.GM_registerMenuCommand).toHaveBeenCalledTimes(3);
        });

        it('should support chain after batch', () => {
            const result = gmMenuCommand.batch(() => {
                gmMenuCommand.create('Menu 1', () => {});
            });

            expect(result).toBe(gmMenuCommand);
        });
    });

    describe('toggleActive', () => {
        it('should toggle menu active state', () => {
            gmMenuCommand.create('Test Menu', () => {}, true);
            expect(gmMenuCommand.list[0].isActive).toBe(true);

            gmMenuCommand.toggleActive('Test Menu');

            expect(gmMenuCommand.list[0].isActive).toBe(false);

            gmMenuCommand.toggleActive('Test Menu');

            expect(gmMenuCommand.list[0].isActive).toBe(true);
        });
    });

    describe('render', () => {
        it('should register active menus', () => {
            // create 方法会自动调用 render，所以这里只验证最终状态
            gmMenuCommand.create('Active Menu', () => {}, true);
            gmMenuCommand.create('Inactive Menu', () => {}, false);

            // create 自动 render 了 2 次，手动调用第 3 次
            // register: 1 + 1 + 1 = 3
            expect(gmApiMock.GM_registerMenuCommand).toHaveBeenCalledTimes(2);
            expect(gmApiMock.GM_unregisterMenuCommand).toHaveBeenCalledTimes(3);
        });
    });
});
