export interface IEpInfoResponse {
	code: number;
	message: string;
	result: IEpInfoResponseResult;
}

export interface IEpInfoResponseResultActivity {
	head_bg_url: string;
	id: number;
	title: string;
}

export interface IEpInfoResponseResultAreas {
	id: number;
	name: string;
}

export interface IEpInfoResponseResultEpisodesBadge_info {
	bg_color: string;
	bg_color_night: string;
	text: string;
}

export interface IEpInfoResponseResultEpisodesDimension {
	height: number;
	rotate: number;
	width: number;
}

export interface IEpInfoResponseResultEpisodesRights {
	allow_demand: number;
	allow_dm: number;
	allow_download: number;
	area_limit: number;
}

export interface IEpInfoResponseResultEpisodesSkipEd {
	end: number;
	start: number;
}

export interface IEpInfoResponseResultEpisodesSkipOp {
	end: number;
	start: number;
}

export interface IEpInfoResponseResultEpisodesSkip {
	ed: IEpInfoResponseResultEpisodesSkipEd;
	op: IEpInfoResponseResultEpisodesSkipOp;
}

export interface IEpInfoResponseResultEpisodes {
	aid: number;
	badge: string;
	badge_info: IEpInfoResponseResultEpisodesBadge_info;
	badge_type: number;
	bvid: string;
	cid: number;
	cover: string;
	dimension: IEpInfoResponseResultEpisodesDimension;
	duration: number;
	enable_vt: boolean;
	ep_id: number;
	from: string;
	id: number;
	is_view_hide: boolean;
	link: string;
	long_title: string;
	pub_time: number;
	pv: number;
	release_date: string;
	rights: IEpInfoResponseResultEpisodesRights;
	section_type: number;
	share_copy: string;
	share_url: string;
	short_link: string;
	showDrmLoginDialog: boolean;
	show_title: string;
	skip: IEpInfoResponseResultEpisodesSkip;
	status: number;
	subtitle: string;
	title: string;
	vid: string;
}

export interface IEpInfoResponseResultFreya {
	bubble_show_cnt: number;
	icon_show: number;
}

export interface IEpInfoResponseResultIcon_font {
	name: string;
	text: string;
}

export interface IEpInfoResponseResultNew_ep {
	desc: string;
	id: number;
	is_new: number;
	title: string;
}

export interface IEpInfoResponseResultPaymentPay_type {
	allow_discount: number;
	allow_pack: number;
	allow_ticket: number;
	allow_time_limit: number;
	allow_vip_discount: number;
	forbid_bb: number;
}

export interface IEpInfoResponseResultPayment {
	discount: number;
	pay_type: IEpInfoResponseResultPaymentPay_type;
	price: string;
	promotion: string;
	tip: string;
	view_start_time: number;
	vip_discount: number;
	vip_first_promotion: string;
	vip_price: string;
	vip_promotion: string;
}

export interface IEpInfoResponseResultPlay_strategy {
	strategies: string[];
}

export interface IEpInfoResponseResultPositive {
	id: number;
	title: string;
}

export interface IEpInfoResponseResultPublish {
	is_finish: number;
	is_started: number;
	pub_time: string;
	pub_time_show: string;
	unknow_pub_date: number;
	weekday: number;
}

export interface IEpInfoResponseResultRating {
	count: number;
	score: number;
}

export interface IEpInfoResponseResultRights {
	allow_bp: number;
	allow_bp_rank: number;
	allow_download: number;
	allow_review: number;
	area_limit: number;
	ban_area_show: number;
	can_watch: number;
	copyright: string;
	forbid_pre: number;
	freya_white: number;
	is_cover_show: number;
	is_preview: number;
	only_vip_download: number;
	resource: string;
	watch_platform: number;
}

export interface IEpInfoResponseResultSeasonsBadge_info {
	bg_color: string;
	bg_color_night: string;
	text: string;
}

export interface IEpInfoResponseResultSeasonsIcon_font {
	name: string;
	text: string;
}

export interface IEpInfoResponseResultSeasonsNew_ep {
	cover: string;
	id: number;
	index_show: string;
}

export interface IEpInfoResponseResultSeasonsStat {
	favorites: number;
	series_follow: number;
	views: number;
	vt: number;
}

export interface IEpInfoResponseResultSeasons {
	badge: string;
	badge_info: IEpInfoResponseResultSeasonsBadge_info;
	badge_type: number;
	cover: string;
	enable_vt: boolean;
	horizontal_cover_1610: string;
	horizontal_cover_169: string;
	icon_font: IEpInfoResponseResultSeasonsIcon_font;
	media_id: number;
	new_ep: IEpInfoResponseResultSeasonsNew_ep;
	season_id: number;
	season_title: string;
	season_type: number;
	stat: IEpInfoResponseResultSeasonsStat;
}

export interface IEpInfoResponseResultSectionEpisodesBadge_info {
	bg_color: string;
	bg_color_night: string;
	text: string;
}

export interface IEpInfoResponseResultSectionEpisodesDimension {
	height: number;
	rotate: number;
	width: number;
}

export interface IEpInfoResponseResultSectionEpisodesIcon_font {
	name: string;
	text: string;
}

export interface IEpInfoResponseResultSectionEpisodesRights {
	allow_demand: number;
	allow_dm: number;
	allow_download: number;
	area_limit: number;
}

export interface IEpInfoResponseResultSectionEpisodesSkipEd {
	end: number;
	start: number;
}

export interface IEpInfoResponseResultSectionEpisodesSkipOp {
	end: number;
	start: number;
}

export interface IEpInfoResponseResultSectionEpisodesSkip {
	ed: IEpInfoResponseResultSectionEpisodesSkipEd;
	op: IEpInfoResponseResultSectionEpisodesSkipOp;
}

export interface IEpInfoResponseResultSectionEpisodesStat {
	coin: number;
	danmakus: number;
	likes: number;
	play: number;
	reply: number;
	vt: number;
}

export interface IEpInfoResponseResultSectionEpisodesStat_for_unityDanmaku {
	icon: string;
	pure_text: string;
	text: string;
	value: number;
}

export interface IEpInfoResponseResultSectionEpisodesStat_for_unityVt {
	icon: string;
	pure_text: string;
	text: string;
	value: number;
}

export interface IEpInfoResponseResultSectionEpisodesStat_for_unity {
	coin: number;
	danmaku: IEpInfoResponseResultSectionEpisodesStat_for_unityDanmaku;
	likes: number;
	reply: number;
	vt: IEpInfoResponseResultSectionEpisodesStat_for_unityVt;
}

export interface IEpInfoResponseResultSectionEpisodes {
	aid: number;
	badge: string;
	badge_info: IEpInfoResponseResultSectionEpisodesBadge_info;
	badge_type: number;
	bvid: string;
	cid: number;
	cover: string;
	dimension: IEpInfoResponseResultSectionEpisodesDimension;
	duration: number;
	enable_vt: boolean;
	ep_id: number;
	from: string;
	icon_font: IEpInfoResponseResultSectionEpisodesIcon_font;
	id: number;
	is_view_hide: boolean;
	link: string;
	long_title: string;
	pub_time: number;
	pv: number;
	release_date: string;
	rights: IEpInfoResponseResultSectionEpisodesRights;
	section_type: number;
	share_copy: string;
	share_url: string;
	short_link: string;
	showDrmLoginDialog: boolean;
	show_title: string;
	skip: IEpInfoResponseResultSectionEpisodesSkip;
	stat: IEpInfoResponseResultSectionEpisodesStat;
	stat_for_unity: IEpInfoResponseResultSectionEpisodesStat_for_unity;
	status: number;
	subtitle: string;
	title: string;
	vid: string;
}

export interface IEpInfoResponseResultSection {
	attr: number;
	episode_id: number;
	episode_ids: any[];
	episodes: IEpInfoResponseResultSectionEpisodes[];
	id: number;
	title: string;
	type: number;
	type2: number;
}

export interface IEpInfoResponseResultSeries {
	display_type: number;
	series_id: number;
	series_title: string;
}

export interface IEpInfoResponseResultShow {
	wide_screen: number;
}

export interface IEpInfoResponseResultStat {
	coins: number;
	danmakus: number;
	favorite: number;
	favorites: number;
	follow_text: string;
	likes: number;
	reply: number;
	share: number;
	views: number;
	vt: number;
}

export interface IEpInfoResponseResultUp_infoPendant {
	image: string;
	name: string;
	pid: number;
}

export interface IEpInfoResponseResultUp_infoVip_label {
	bg_color: string;
	bg_style: number;
	border_color: string;
	text: string;
	text_color: string;
}

export interface IEpInfoResponseResultUp_info {
	avatar: string;
	avatar_subscript_url: string;
	follower: number;
	is_follow: number;
	mid: number;
	nickname_color: string;
	pendant: IEpInfoResponseResultUp_infoPendant;
	theme_type: number;
	uname: string;
	verify_type: number;
	vip_label: IEpInfoResponseResultUp_infoVip_label;
	vip_status: number;
	vip_type: number;
}

export interface IEpInfoResponseResultUser_status {
	area_limit: number;
	ban_area_show: number;
	follow: number;
	follow_status: number;
	login: number;
	pay: number;
	pay_pack_paid: number;
	sponsor: number;
}

export interface IEpInfoResponseResult {
	activity: IEpInfoResponseResultActivity;
	actors: string;
	alias: string;
	areas: IEpInfoResponseResultAreas[];
	bkg_cover: string;
	cover: string;
	delivery_fragment_video: boolean;
	enable_vt: boolean;
	episodes: IEpInfoResponseResultEpisodes[];
	evaluate: string;
	freya: IEpInfoResponseResultFreya;
	hide_ep_vv_vt_dm: number;
	icon_font: IEpInfoResponseResultIcon_font;
	jp_title: string;
	link: string;
	media_id: number;
	mode: number;
	new_ep: IEpInfoResponseResultNew_ep;
	payment: IEpInfoResponseResultPayment;
	play_strategy: IEpInfoResponseResultPlay_strategy;
	positive: IEpInfoResponseResultPositive;
	publish: IEpInfoResponseResultPublish;
	rating: IEpInfoResponseResultRating;
	record: string;
	rights: IEpInfoResponseResultRights;
	season_id: number;
	season_title: string;
	seasons: IEpInfoResponseResultSeasons[];
	section: IEpInfoResponseResultSection[];
	series: IEpInfoResponseResultSeries;
	share_copy: string;
	share_sub_title: string;
	share_url: string;
	show: IEpInfoResponseResultShow;
	show_season_type: number;
	square_cover: string;
	staff: string;
	stat: IEpInfoResponseResultStat;
	status: number;
	styles: string[];
	subtitle: string;
	title: string;
	total: number;
	type: number;
	up_info: IEpInfoResponseResultUp_info;
	user_status: IEpInfoResponseResultUser_status;
}
