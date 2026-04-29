export interface IPlayInfo {
    code: number;
    message: string;
    ttl: number;
    data: IPlayInfoData;
    session: string;
}
export interface IPlayInfoDataDashVideoSegmentBase {
    Initialization: string;
    indexRange: string;
}
export interface IPlayInfoDataDashVideoSegment_base {
    initialization: string;
    index_range: string;
}
export interface IPlayInfoDataDashVideo {
    id: number;
    baseUrl: string;
    base_url: string;
    backupUrl: string[];
    backup_url: string[];
    bandwidth: number;
    mimeType: string;
    mime_type: string;
    codecs: string;
    width: number;
    height: number;
    frameRate: string;
    frame_rate: string;
    sar: string;
    startWithSap: number;
    start_with_sap: number;
    SegmentBase: IPlayInfoDataDashVideoSegmentBase;
    segment_base: IPlayInfoDataDashVideoSegment_base;
    codecid: number;
}
export interface IPlayInfoDataDashAudioSegmentBase {
    Initialization: string;
    indexRange: string;
}
export interface IPlayInfoDataDashAudioSegment_base {
    initialization: string;
    index_range: string;
}
export interface IPlayInfoDataDashAudio {
    id: number;
    baseUrl: string;
    base_url: string;
    backupUrl: string[];
    backup_url: string[];
    bandwidth: number;
    mimeType: string;
    mime_type: string;
    codecs: string;
    width: number;
    height: number;
    frameRate: string;
    frame_rate: string;
    sar: string;
    startWithSap: number;
    start_with_sap: number;
    SegmentBase: IPlayInfoDataDashAudioSegmentBase;
    segment_base: IPlayInfoDataDashAudioSegment_base;
    codecid: number;
}
export interface IPlayInfoDataDashDolby {
    type: number;
    audio?: any;
}
export interface IPlayInfoDataDash {
    duration: number;
    minBufferTime: number;
    min_buffer_time: number;
    video: IPlayInfoDataDashVideo[];
    audio: IPlayInfoDataDashAudio[];
    dolby: IPlayInfoDataDashDolby;
    flac?: any;
}
export interface IPlayInfoDataSupport_formats {
    quality: number;
    format: string;
    new_description: string;
    display_desc: string;
    superscript: string;
    codecs: string[];
}
export interface IPlayInfoDataVolumeMulti_scene_args {
    high_dynamic_target_i: string;
    normal_target_i: string;
    undersized_target_i: string;
}
export interface IPlayInfoDataVolume {
    measured_i: number;
    measured_lra: number;
    measured_tp: number;
    measured_threshold: number;
    target_offset: number;
    target_i: number;
    target_tp: number;
    multi_scene_args: IPlayInfoDataVolumeMulti_scene_args;
}
export interface IPlayInfoData {
    from: string;
    result: string;
    message: string;
    quality: number;
    format: string;
    timelength: number;
    accept_format: string;
    accept_description: string[];
    accept_quality: number[];
    video_codecid: number;
    seek_param: string;
    seek_type: string;
    dash: IPlayInfoDataDash;
    support_formats: IPlayInfoDataSupport_formats[];
    high_format?: any;
    volume: IPlayInfoDataVolume;
    last_play_time: number;
    last_play_cid: number;
    view_info?: any;
}
