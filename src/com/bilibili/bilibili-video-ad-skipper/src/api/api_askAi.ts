import { IAiResponse } from './interface/IAiResponse.ts';


export const api_askAi = async (
	config: {
		url: string;
		model: string;
		prompt?: string;
		message: string;
		apiKey: string;
	},
) => {
	const messages: { role: string, content: string }[] = [
		{ 'role': 'user', 'content': config.message },
	];
	config.prompt && messages.push( {
		'role': 'system',
		'content': config.prompt,
	} );
	
	const res = await fetch( config.url, {
		method: 'POST',
		body: JSON.stringify( {
			model: config.model,
			messages: messages,
		} ),
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${ config.apiKey }`,
		},
	} );
	return await res.json() as Promise<IAiResponse>;
};
