export interface ISeasonInfo {
  season: Season;
  course: unknown;
  checkin: unknown;
  seasonStat: unknown;
  sections: ISections;
  part_episodes: unknown;
}

export interface Season {
  id: number;
  title: string;
  desc: string;
  cover: string;
  isEnd: number;
  mid: number;
  isAct: number;
  is_pay: number;
  state: number;
  partState: number;
  signState: number;
  rejectReason: string;
  ctime: number;
  mtime: number;
  no_section: number;
  forbid: number;
  protocol_id: string;
  ep_num: number;
  season_price: number;
  is_opened: number;
  has_charging_pay: number;
  has_pugv_pay: number;
  SeasonUpfrom: number;
}

export interface ISections {
  sections: ISectionItem[];
  total: number;
}

export interface ISectionItem {
  id: number;
  type: number;
  seasonId: number;
  title: string;
  order: number;
  state: number;
  partState: number;
  rejectReason: string;
  ctime: number;
  mtime: number;
  epCount: number;
  cover: string;
  has_charging_pay: number;
  Episodes: unknown;
  show: number;
  has_pugv_pay: number;
}
