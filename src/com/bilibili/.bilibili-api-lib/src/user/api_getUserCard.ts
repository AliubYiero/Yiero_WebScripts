import { xhrRequest } from '../xhrRequest.ts';
import type { IUserCard } from './interfaces/IUserCard.ts';

/**
 * 获取用户名片信息
 *
 * 获取用户的详细名片信息，包括用户基本信息、粉丝数、关注数、等级、认证状态、大会员状态等。
 * 可选是否请求用户主页头图。
 *
 * @param mid - 目标用户mid
 * @param photo - 是否请求用户主页头图，默认 false
 * @param login - 是否携带登录信息，默认 false。设为 true 可获取当前登录用户是否关注该用户
 * @returns 用户名片信息
 *
 * @example
 * ```typescript
 * // 获取用户名片信息（不包含头图）
 * const card = await api_getUserCard(2);
 * console.log(card.data.card.name);      // 用户昵称
 * console.log(card.data.card.sign);      // 用户签名
 * console.log(card.data.follower);       // 粉丝数
 * console.log(card.data.card.level_info.current_level);  // 用户等级
 *
 * // 获取用户名片信息（包含头图）
 * const card2 = await api_getUserCard(2, true);
 * console.log(card2.data.card.space?.l_img);  // 主页头图
 *
 * // 获取用户名片信息（携带登录态，获取关注状态）
 * const card3 = await api_getUserCard(2, false, true);
 * console.log(card3.data.following);  // 是否已关注该用户
 * ```
 *
 * @see [用户名片信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/user/info.html#%E7%94%A8%E6%88%B7%E5%90%8D%E7%89%87%E4%BF%A1%E6%81%AF)
 */
export function api_getUserCard(
  mid: number,
  photo: boolean = false,
  login: boolean = false,
) {
  const params: Record<string, string> = {
    mid: mid.toString(),
  };

  if (photo) {
    params.photo = 'true';
  }

  const url = 'https://api.bilibili.com/x/web-interface/card';

  if (login) {
    return xhrRequest.getWithCredentials<IUserCard>(url, { params });
  }

  return xhrRequest.get<IUserCard>(url, { params });
}

export type { IUserCard };
