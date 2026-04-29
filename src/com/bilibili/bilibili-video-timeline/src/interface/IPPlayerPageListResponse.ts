export interface IPPlayerPageListResponse {
    code: number;
    message: string;
    ttl: number;
    data: IPPlayerPageListData[];
}

export interface IPPlayerPageListDataDimension {
    width: number;
    height: number;
    rotate: number;
}

export interface IPPlayerPageListData {
    cid: number;
    page: number;
    from: string;
    part: string;
    duration: number;
    vid: string;
    weblink: string;
    dimension: IPPlayerPageListDataDimension;
    first_frame: string;
}
