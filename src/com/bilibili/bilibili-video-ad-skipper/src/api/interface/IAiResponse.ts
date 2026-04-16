export interface completion_tokens_detailsItem {
	reasoning_tokens: number;
}

export interface prompt_tokens_detailsItem {
	cached_tokens: number;
}

export interface usageItem {
	completion_tokens: number;
	prompt_tokens: number;
	prompt_cache_hit_tokens: number;
	completion_tokens_details: completion_tokens_detailsItem;
	prompt_cache_miss_tokens: number;
	prompt_tokens_details: prompt_tokens_detailsItem;
	total_tokens: number;
}

export interface messageItem {
	role: string;
	content: string;
	reasoning_content: string;
}

export interface choicesItem {
	finish_reason: string;
	index: number;
	message: messageItem;
}

export interface IAiResponse {
	created: number;
	usage: usageItem;
	model: string;
	id: string;
	choices: Array<choicesItem>;
	system_fingerprint: string;
	object: string;
}
