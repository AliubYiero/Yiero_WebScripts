export interface IPlayerInfoResponse {
    code: number;
    message: string;
    ttl: number;
    data: IPlayerInfoResponseData;
}
export interface IPlayerInfoResponseDataIp_info {
    ip: string;
    zone_ip: string;
    zone_id: number;
    country: string;
    province: string;
    city: string;
}
export interface IPlayerInfoResponseDataLevel_info {
    current_level: number;
    current_min: number;
    current_exp: number;
    next_exp: number;
    level_up: number;
}
export interface IPlayerInfoResponseDataVipLabel {
    path: string;
    text: string;
    label_theme: string;
    text_color: string;
    bg_style: number;
    bg_color: string;
    border_color: string;
    use_img_label: boolean;
    img_label_uri_hans: string;
    img_label_uri_hant: string;
    img_label_uri_hans_static: string;
    img_label_uri_hant_static: string;
}
export interface IPlayerInfoResponseDataVipAvatar_iconIcon_resource {}
export interface IPlayerInfoResponseDataVipAvatar_icon {
    icon_resource: IPlayerInfoResponseDataVipAvatar_iconIcon_resource;
}
export interface IPlayerInfoResponseDataVip {
    type: number;
    status: number;
    due_date: number;
    vip_pay_type: number;
    theme_type: number;
    label: IPlayerInfoResponseDataVipLabel;
    avatar_subscript: number;
    nickname_color: string;
    role: number;
    avatar_subscript_url: string;
    tv_vip_status: number;
    tv_vip_pay_type: number;
    tv_due_date: number;
    avatar_icon: IPlayerInfoResponseDataVipAvatar_icon;
}
export interface IPlayerInfoResponseDataSubtitleSubtitles {
    id: number;
    lan: string;
    lan_doc: string;
    is_lock: boolean;
    subtitle_url: string;
    subtitle_url_v2: string;
    type: number;
    id_str: string;
    ai_type: number;
    ai_status: number;
}
export interface IPlayerInfoResponseDataSubtitle {
    allow_submit: boolean;
    lan: string;
    lan_doc: string;
    subtitles: IPlayerInfoResponseDataSubtitleSubtitles[];
}
export interface IPlayerInfoResponseDataOptions {
    is_360: boolean;
    without_vip: boolean;
}
export interface IPlayerInfoResponseDataOnline_switch {
    enable_gray_dash_playback: string;
    new_broadcast: string;
    realtime_dm: string;
    subtitle_submit_switch: string;
}
export interface IPlayerInfoResponseDataFawkes {
    config_version: number;
    ff_version: number;
}
export interface IPlayerInfoResponseDataShow_switch {
    long_progress: boolean;
}
export interface IPlayerInfoResponseDataElec_high_level {
    privilege_type: number;
    title: string;
    sub_title: string;
    show_button: boolean;
    button_text: string;
    jump_url: string;
    intro: string;
    new: boolean;
}
export interface IPlayerInfoResponseData {
    aid: number;
    bvid: string;
    allow_bp: boolean;
    no_share: boolean;
    cid: number;
    max_limit: number;
    page_no: number;
    has_next: boolean;
    ip_info: IPlayerInfoResponseDataIp_info;
    login_mid: number;
    login_mid_hash: string;
    is_owner: boolean;
    name: string;
    permission: string;
    level_info: IPlayerInfoResponseDataLevel_info;
    vip: IPlayerInfoResponseDataVip;
    answer_status: number;
    block_time: number;
    role: string;
    last_play_time: number;
    last_play_cid: number;
    now_time: number;
    online_count: number;
    need_login_subtitle: boolean;
    subtitle: IPlayerInfoResponseDataSubtitle;
    view_points: any[];
    preview_toast: string;
    options: IPlayerInfoResponseDataOptions;
    guide_attention: any[];
    jump_card: any[];
    operation_card: any[];
    online_switch: IPlayerInfoResponseDataOnline_switch;
    fawkes: IPlayerInfoResponseDataFawkes;
    show_switch: IPlayerInfoResponseDataShow_switch;
    toast_block: boolean;
    is_upower_exclusive: boolean;
    is_upower_play: boolean;
    is_ugc_pay_preview: boolean;
    elec_high_level: IPlayerInfoResponseDataElec_high_level;
    disable_show_up_info: boolean;
}
