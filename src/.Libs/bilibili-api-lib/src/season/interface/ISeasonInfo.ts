/**
 * 合集信息响应接口
 */
export interface ISeasonInfo {
    /** 合集基本信息 */
    season: Season;
    /** 课程信息（可能为空） */
    course: unknown;
    /** 签到信息（可能为空） */
    checkin: unknown;
    /** 合集统计数据 */
    seasonStat: unknown;
    /** 小节列表信息 */
    sections: ISections;
    /** 分集信息（可能为空） */
    part_episodes: unknown;
}

/**
 * 合集基本信息
 */
export interface Season {
    /** 合集 ID */
    id: number;
    /** 合集标题 */
    title: string;
    /** 合集描述 */
    desc: string;
    /** 封面图 URL */
    cover: string;
    /** 是否完结：0-未完結，1-已完结 */
    isEnd: number;
    /** 创建者 mid */
    mid: number;
    /** 是否为活动合集 */
    isAct: number;
    /** 是否需要付费 */
    is_pay: number;
    /** 合集状态 */
    state: number;
    /** 分P状态 */
    partState: number;
    /** 签约状态 */
    signState: number;
    /** 审核拒绝原因 */
    rejectReason: string;
    /** 创建时间戳 */
    ctime: number;
    /** 修改时间戳 */
    mtime: number;
    /** 无小节标识 */
    no_section: number;
    /** 禁止标识 */
    forbid: number;
    /** 协议 ID */
    protocol_id: string;
    /** 集数 */
    ep_num: number;
    /** 合集价格 */
    season_price: number;
    /** 是否公开 */
    is_opened: number;
    /** 是否有充电付费 */
    has_charging_pay: number;
    /** 是否有 PUGV 付费 */
    has_pugv_pay: number;
    /** 合集来源 */
    SeasonUpfrom: number;
}

/**
 * 小节列表信息
 */
export interface ISections {
    /** 小节列表 */
    sections: ISectionItem[];
    /** 小节总数 */
    total: number;
}

/**
 * 小节信息项
 */
export interface ISectionItem {
    /** 小节 ID */
    id: number;
    /** 小节类型 */
    type: number;
    /** 所属合集 ID */
    seasonId: number;
    /** 小节标题 */
    title: string;
    /** 排序位置 */
    order: number;
    /** 状态 */
    state: number;
    /** 分P状态 */
    partState: number;
    /** 审核拒绝原因 */
    rejectReason: string;
    /** 创建时间戳 */
    ctime: number;
    /** 修改时间戳 */
    mtime: number;
    /** 视频数量 */
    epCount: number;
    /** 封面图 URL */
    cover: string;
    /** 是否有充电付费 */
    has_charging_pay: number;
    /** 视频列表（可能为空） */
    Episodes: unknown;
    /** 是否显示 */
    show: number;
    /** 是否有 PUGV 付费 */
    has_pugv_pay: number;
}
