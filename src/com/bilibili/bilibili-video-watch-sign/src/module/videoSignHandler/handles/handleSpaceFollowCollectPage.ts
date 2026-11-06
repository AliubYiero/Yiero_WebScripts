import { baseVideoCardParser } from './handleSpaceIndexPage';
import { baseVideoSignLoader } from './base';
import { BindUpdatePageButton } from './bindUpdatePageButton';

export const handleSpaceFollowCollectPage = async () => {
    const selectorList = {
        container: '.fav-list-main > .items',
        item: '.items__item',
    };

    baseVideoSignLoader(selectorList, baseVideoCardParser);
    BindUpdatePageButton.paginationWithStatus();
};
