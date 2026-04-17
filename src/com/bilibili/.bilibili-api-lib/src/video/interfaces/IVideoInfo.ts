/**
 * 视频详细信息接口
 *
 * 包含视频的完整元数据，包括基本信息、UP 主信息、统计数据、分 P 列表等。
 */
export interface IVideoInfo {
    /** 视频 BV 号 */
    bvid: string;
    /** 视频 AV 号 */
    aid: number;
    /** 分 P 数量 */
    videos: number;
    /** 分区 ID（旧版） */
    tid: number;
    /** 分区 ID（新版） */
    tid_v2: number;
    /** 分区名称（旧版） */
    tname: string;
    /** 分区名称（新版） */
    tname_v2: string;
    /** 版权类型：1-原创，2-转载 */
    copyright: number;
    /** 视频封面 URL */
    pic: string;
    /** 视频标题 */
    title: string;
    /** 发布时间戳 */
    pubdate: number;
    /** 投稿时间戳 */
    ctime: number;
    /** 视频描述 */
    desc: string;
    /** 描述版本 2（可能为空） */
    desc_v2: null;
    /** 视频状态 */
    state: number;
    /** 视频时长（秒） */
    duration: number;
    /** 权限信息 */
    rights: { [key: string]: number };
    /** UP 主信息 */
    owner: Owner;
    /** 统计数据（播放量、点赞等） */
    stat: Stat;
    /** 争议信息 */
    argue_info: ArgueInfo;
    /** 动态内容 */
    dynamic: string;
    /** 第一分 P 的 CID */
    cid: number;
    /** 视频分辨率信息 */
    dimension: Dimension;
    /** 首映信息（可能为空） */
    premiere: null;
    /** 青少年模式 */
    teenage_mode: number;
    /** 是否为付费季 */
    is_chargeable_season: boolean;
    /** 是否为 Story 模式视频 */
    is_story: boolean;
    /** 是否为充电专属视频 */
    is_upower_exclusive: boolean;
    /** 是否为充电播放 */
    is_upower_play: boolean;
    /** 是否为充电预览 */
    is_upower_preview: boolean;
    /** VT 功能启用状态 */
    enable_vt: number;
    /** VT 显示文本 */
    vt_display: string;
    /** 是否为带问答的充电专属视频 */
    is_upower_exclusive_with_qa: boolean;
    /** 是否禁用缓存 */
    no_cache: boolean;
    /** 分 P 列表 */
    pages: Page[];
    /** 字幕信息 */
    subtitle: Subtitle;
    /** 是否显示合集 */
    is_season_display: boolean;
    /** 用户装扮信息 */
    user_garb: UserGarb;
    /** 荣誉回复信息 */
    honor_reply: HonorReply;
    /** 点赞图标 */
    like_icon: string;
    /** 是否需要跳转 BV 号 */
    need_jump_bv: boolean;
    /** 是否禁用显示 UP 主信息 */
    disable_show_up_info: boolean;
    /** Story 播放模式 */
    is_story_play: number;
    /** 是否为本人查看 */
    is_view_self: boolean;
}

/**
 * 争议信息
 */
export interface ArgueInfo {
    /** 争议提示消息 */
    argue_msg: string;
    /** 争议类型 */
    argue_type: number;
    /** 争议链接 */
    argue_link: string;
}

/**
 * 视频分辨率信息
 */
export interface Dimension {
    /** 视频宽度 */
    width: number;
    /** 视频高度 */
    height: number;
    /** 旋转角度 */
    rotate: number;
}

/** 荣誉回复信息（可能为空） */
export type HonorReply = {};

/**
 * UP 主信息
 */
export interface Owner {
    /** UP 主 mid */
    mid: number;
    /** UP 主昵称 */
    name: string;
    /** UP 主头像 URL */
    face: string;
}

/**
 * 分 P 信息
 */
export interface Page {
    /** 分 P CID */
    cid: number;
    /** 分 P 序号 */
    page: number;
    /** 视频来源 */
    from: string;
    /** 分 P 标题 */
    part: string;
    /** 分 P 时长（秒） */
    duration: number;
    /**  vid */
    vid: string;
    /** 外部链接 */
    weblink: string;
    /** 分 P 分辨率 */
    dimension: Dimension;
    /** 首帧截图 URL */
    first_frame: string;
    /** 上传时间戳 */
    ctime: number;
}

/**
 * 视频统计数据
 */
export interface Stat {
    /** 视频 AV 号 */
    aid: number;
    /** 播放量 */
    view: number;
    /** 弹幕数 */
    danmaku: number;
    /** 评论数 */
    reply: number;
    /** 收藏数 */
    favorite: number;
    /** 投币数 */
    coin: number;
    /** 分享数 */
    share: number;
    /** 当前排名 */
    now_rank: number;
    /** 历史最高排名 */
    his_rank: number;
    /** 点赞数 */
    like: number;
    /** 点踩数 */
    dislike: number;
    /** 评分评价 */
    evaluation: string;
    /** VT 数据 */
    vt: number;
}

/**
 * 字幕信息
 */
export interface Subtitle {
    /** 是否允许提交字幕 */
    allow_submit: boolean;
    /** 字幕列表 */
    list: List[];
}

/**
 * 单条字幕信息
 */
export interface List {
    /** 字幕 ID */
    id: number;
    /** 语言代码 */
    lan: string;
    /** 语言显示名称 */
    lan_doc: string;
    /** 是否锁定 */
    is_lock: boolean;
    /** 字幕文件 URL（可使用 api_getSubtitleContent 获取内容） */
    subtitle_url: string;
    /** 字幕类型 */
    type: number;
    /** 字幕 ID 字符串 */
    id_str: string;
    /** AI 字幕类型 */
    ai_type: number;
    /** AI 字幕状态 */
    ai_status: number;
    /** 字幕高度（可能为空） */
    subtitle_height: null;
    /** 字幕作者信息 */
    author: Author;
}

/**
 * 字幕作者信息
 */
export interface Author {
    /** 作者 mid */
    mid: number;
    /** 作者昵称 */
    name: string;
    /** 作者性别 */
    sex: string;
    /** 作者头像 URL */
    face: string;
    /** 作者签名 */
    sign: string;
    /** 作者等级 */
    rank: number;
    /** 作者生日 */
    birthday: number;
    /** 是否为假账号 */
    is_fake_account: number;
    /** 是否已删除 */
    is_deleted: number;
    /** 是否在注册审核中 */
    in_reg_audit: number;
    /** 是否为硬核会员 */
    is_senior_member: number;
    /** 名称渲染（可能为空） */
    name_render: null;
    /** 作者 handle */
    handle: string;
}

/**
 * 用户装扮信息
 */
export interface UserGarb {
    /** 动态头图 URL */
    url_image_ani_cut: string;
}
