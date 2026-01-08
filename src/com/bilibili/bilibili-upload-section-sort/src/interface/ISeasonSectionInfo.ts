export default interface ISeasonSectionInfo {
	section: Required<Section>;
	episodes: Required<Episodes>[];
}

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
