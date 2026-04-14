export interface statItem {
  view: number;
}

export interface archiveItem {
  bvid: string;
  stat: statItem;
  enable_vt: number;
  ugc_pay: number;
  playback_position: number;
  upMid: number;
  pic: string;
  title: string;
  duration: number;
  vt_display: string;
  ctime: number;
  state: number;
  interactive_video: boolean;
  aid: number;
  pubdate: number;
  desc: string;
}

export interface pageItem {
  total: number;
  size: number;
  num: number;
}

export interface IUserUploadVideo {
  archives: Array<archiveItem>;
  page: pageItem;
}
