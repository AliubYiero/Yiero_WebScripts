/**
 * 直播间信息接口
 *
 * 包含直播间的完整信息，包括主播信息、直播状态、房间设置等。
 *
 * @see [获取直播间信息](https://api.live.bilibili.com/room/v1/Room/get_info)
 */
export interface IRoomInfo {
    /** 主播 mid */
    uid: number;
    /** 直播间长号 */
    room_id: number;
    /** 直播间短号，为 0 表示无短号 */
    short_id: number;
    /** 关注数量 */
    attention: number;
    /** 观看人数 */
    online: number;
    /** 是否竖屏 */
    is_portrait: boolean;
    /** 直播间描述 */
    description: string;
    /**
     * 直播状态
     * - 0: 未开播
     * - 1: 直播中
     * - 2: 轮播中
     */
    live_status: number;
    /** 分区 id */
    area_id: number;
    /** 父分区 id */
    parent_area_id: number;
    /** 父分区名称 */
    parent_area_name: string;
    /** 旧版分区 id */
    old_area_id: number;
    /** 背景图片链接 */
    background: string;
    /** 直播间标题 */
    title: string;
    /** 直播间封面 */
    user_cover: string;
    /** 关键帧截图，用于网页端悬浮展示 */
    keyframe: string;
    /** 未知字段 */
    is_strict_room: boolean;
    /** 直播开始时间，格式：YYYY-MM-DD HH:mm:ss */
    live_time: string;
    /** 标签，以逗号分隔 */
    tags: string;
    /** 未知字段 */
    is_anchor: number;
    /** 禁言状态 */
    room_silent_type: string;
    /** 禁言等级 */
    room_silent_level: number;
    /** 禁言时间，单位秒 */
    room_silent_second: number;
    /** 分区名称 */
    area_name: string;
    /** 未知字段 */
    pendants: string;
    /** 未知字段 */
    area_pendants: string;
    /** 热词列表 */
    hot_words: string[];
    /** 热词状态 */
    hot_words_status: number;
    /** 未知字段 */
    verify: string;
    /** 头像框和大 V 认证信息 */
    new_pendants: NewPendants;
    /** 未知字段 */
    up_session: string;
    /** PK 状态 */
    pk_status: number;
    /** PK ID */
    pk_id: number;
    /** 未知字段 */
    battle_id: number;
    /** 允许切换分区的时间戳 */
    allow_change_area_time: number;
    /** 允许上传封面的时间戳 */
    allow_upload_cover_time: number;
    /** 工作室信息 */
    studio_info: StudioInfo;
}

/**
 * 头像框和大 V 认证信息
 */
export interface NewPendants {
    /** 头像框信息 */
    frame: Frame;
    /** 手机版头像框信息（可能为 null） */
    mobile_frame: Frame | null;
    /** 大 V 认证信息 */
    badge: Badge;
    /** 手机版大 V 认证信息（可能为 null） */
    mobile_badge: Badge | null;
}

/**
 * 头像框信息
 */
export interface Frame {
    /** 头像框名称 */
    name: string;
    /** 头像框值 */
    value: string;
    /** 显示位置 */
    position: number;
    /** 头像框描述 */
    desc: string;
    /** 所属分区 */
    area: number;
    /** 旧版分区 ID */
    area_old: number;
    /** 背景颜色 */
    bg_color: string;
    /** 背景图片 URL */
    bg_pic: string;
    /** 是否使用旧分区号 */
    use_old_area: boolean;
}

/**
 * 大 V 认证信息
 */
export interface Badge {
    /**
     * 认证类型
     * - v_person: 个人认证（黄色）
     * - v_company: 企业认证（蓝色）
     */
    name: string;
    /** 显示位置 */
    position: number;
    /** 认证值 */
    value: string;
    /** 认证描述 */
    desc: string;
}

/**
 * 工作室信息
 */
export interface StudioInfo {
    /** 工作室状态 */
    status: number;
    /** 主理人列表 */
    master_list: unknown[];
}
