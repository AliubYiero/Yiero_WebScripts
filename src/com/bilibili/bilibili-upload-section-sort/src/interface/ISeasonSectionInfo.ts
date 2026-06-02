/** API 返回的合集章节原始响应 */
export default interface ISeasonSectionInfo {
    section: Section;
    episodes: Episodes[];
}

/** API 返回的 Section 原始字段（所有字段可能缺失） */
export interface Section {
    id?: number;
    type?: number;
    seasonId?: number;
    title?: string;
    order?: number;
    state?: number;
    partState?: number;
    rejectReason?: string;
    ctime?: number;
    mtime?: number;
    epCount?: number;
    cover?: string;
    has_charging_pay?: number;
    Episodes?: any;
    show?: number;
    has_pugv_pay?: number;
}

/** 通过非空校验后的 Section */
export interface ValidatedSection {
    id: number;
    type: number;
    seasonId: number;
    title: string;
}

/** API 返回的 Episode 原始字段 */
export interface Episodes {
    id?: number;
    title?: string;
    aid?: number;
    bvid?: string;
    cid?: number;
    seasonId?: number;
    sectionId?: number;
    order?: number;
    videoTitle?: string;
    archiveTitle?: string;
    archiveState?: number;
    rejectReason?: string;
    state?: number;
    cover?: string;
    is_free?: number;
    aid_owner?: boolean;
    charging_pay?: number;
    member_first?: number;
    pugv_pay?: number;
    limited_free?: boolean;
}
