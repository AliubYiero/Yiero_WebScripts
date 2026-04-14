import { getCsrf } from '../utils/getCsrf.ts';
import { xhrRequest } from '../xhrRequest.ts';
import type { IEditSeasonSectionBody } from './interface/IEditSeasonSection.ts';

/**
 * 编辑合集小节
 *
 * @see [编辑合集小节](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/season.html#%E7%BC%96%E8%BE%91%E5%90%88%E9%9B%86%E5%B0%8F%E8%8A%82)
 */
export async function api_editSeasonSection(
  section: IEditSeasonSectionBody['section'],
  sorts: IEditSeasonSectionBody['sorts'],
) {
  const csrf = await getCsrf();

  // 补充缺失参数
  section.title ||= '正片';

  return xhrRequest.postWithCredentials<undefined>(
    'https://member.bilibili.com/x2/creative/web/season/section/edit',
    {
      params: {
        csrf: csrf,
      },
      body: {
        section,
        sorts,
      },
    },
  );
}
