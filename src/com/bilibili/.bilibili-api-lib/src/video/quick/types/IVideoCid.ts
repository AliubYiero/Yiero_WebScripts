/**
 * 视频 CID 信息
 *
 * 包含视频的基本标识信息和指定分 P 的 cid。
 */
export interface IVideoCid {
  /** av 号 */
  avId: number;
  /** BV 号 */
  bvId: string;
  /** 分P数 */
  part: number;
  /** cid */
  cid: number;
}
