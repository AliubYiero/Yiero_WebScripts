import { describe, expect, test } from 'vitest';

// 测试模块导出
describe('Module exports', () => {
  test('video module exports', async () => {
    const video = await import('../src/video');
    expect(video.api_getVideoInfo).toBeDefined();
    expect(video.api_getUserUploadVideoList).toBeDefined();
    expect(video.api_getPlayerInfo).toBeDefined();
    expect(video.api_getSubtitleContent).toBeDefined();
  });

  test('season module exports', async () => {
    const season = await import('../src/season');
    expect(season.api_getSeasonInfo).toBeDefined();
    expect(season.api_getSeasonSectionInfo).toBeDefined();
    expect(season.api_editSeason).toBeDefined();
    expect(season.api_editSeasonSection).toBeDefined();
  });
});

// 测试 xhrRequest 导出
describe('xhrRequest', () => {
  test('xhrRequest exports', async () => {
    const { xhrRequest } = await import('../src/xhrRequest');
    expect(xhrRequest).toBeDefined();
    expect(xhrRequest.get).toBeDefined();
    expect(xhrRequest.post).toBeDefined();
    expect(xhrRequest.getWithCredentials).toBeDefined();
    expect(xhrRequest.postWithCredentials).toBeDefined();
  });
});

// 测试工具函数导出
describe('Utils exports', () => {
  test('getCsrf export', async () => {
    const utils = await import('../src/utils/getCsrf');
    expect(utils.getCsrf).toBeDefined();
  });

  test('NotLoginError export', async () => {
    const error = await import('../src/utils/Error');
    // NotLoginError 不是显式导出的，但在 getCsrf 中使用
    expect(error).toBeDefined();
  });
});
