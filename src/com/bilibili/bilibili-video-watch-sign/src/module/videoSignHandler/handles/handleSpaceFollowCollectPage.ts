import { baseVideoCardParser } from './handleSpaceIndexPage.ts';
import { baseVideoSignLoader } from './base.ts';
import { BindUpdatePageButton } from './bindUpdatePageButton.ts';

export const handleSpaceFollowCollectPage = async () => {
	const selectorList = {
		container: '.fav-list-main > .items',
		item: '.items__item',
	};
	
	baseVideoSignLoader( selectorList, baseVideoCardParser );
	BindUpdatePageButton.paginationWithStatus();
};
