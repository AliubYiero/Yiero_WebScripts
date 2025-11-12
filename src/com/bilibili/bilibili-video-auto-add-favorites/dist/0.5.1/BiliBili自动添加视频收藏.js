// ==UserScript==
// @name	BiliBili自动添加视频收藏
// @version	0.5.1
// @license	GPL-3
// @namespace	https://github.com/AliubYiero/TamperMonkeyScripts
// @run-at	document-start
// @author	Yiero
// @homepage	https://github.com/AliubYiero/TamperMonkeyScripts
// @description	进入视频页面后, 自动添加视频到收藏夹中.
// @match	https://www.bilibili.com/video/*
// @match	https://www.bilibili.com/s/video/*
// @grant	GM_xmlhttpRequest
// @grant	GM_getValue
// @grant	GM_setValue
// @grant	GM_registerMenuCommand
// @grant	GM_unregisterMenuCommand
// @grant	GM_info
// @connect	api.bilibili.com
// @icon	https://www.bilibili.com/favicon.ico
// ==/UserScript==

/* ==UserConfig==
配置项:
    favouriteTitle:
        title: 指定收藏夹标题
        description: 更改指定收藏夹标题
        type: text
        default: fun
    userUid:
        title: 用户uid
        description: 设置用户uid
        type: text
        default: ""

 ==/UserConfig== */
function getElement( parent, selector, timeout = 0 ) {
	return new Promise( ( resolve => {
		let result = parent.querySelector( selector );
		if ( result ) {
			return resolve( result );
		}
		let timer;
		const mutationObserver = window.MutationObserver || window.WebkitMutationObserver || window.MozMutationObserver;
		if ( mutationObserver ) {
			const observer = new mutationObserver( ( mutations => {
				for ( let mutation of mutations ) {
					for ( let addedNode of mutation.addedNodes ) {
						if ( addedNode instanceof Element ) {
							result = addedNode.matches( selector ) ? addedNode : addedNode.querySelector( selector );
							if ( result ) {
								observer.disconnect();
								timer && clearTimeout( timer );
								setTimeout( ( () => resolve( result ) ), 300 );
							}
						}
					}
				}
			} ) );
			observer.observe( parent, {
				childList: true,
				subtree: true,
			} );
			if ( timeout > 0 ) {
				timer = setTimeout( ( () => {
					observer.disconnect();
					return resolve( null );
				} ), timeout );
			}
		}
		else {
			const listener = e => {
				if ( e.target instanceof Element ) {
					result = e.target.matches( selector ) ? e.target : e.target.querySelector( selector );
					if ( result ) {
						parent.removeEventListener( 'DOMNodeInserted', listener, true );
						timer && clearTimeout( timer );
						return resolve( result );
					}
				}
			};
			parent.addEventListener( 'DOMNodeInserted', listener, true );
			if ( timeout > 0 ) {
				timer = setTimeout( ( () => {
					parent.removeEventListener( 'DOMNodeInserted', listener, true );
					return resolve( null );
				} ), timeout );
			}
		}
	} ) );
}

const userUidConfig = {
	key: 'userUid',
};

const UserConfigs = {
	'\u914d\u7f6e\u9879': {
		favouriteTitle: {
			title: '\u6307\u5b9a\u6536\u85cf\u5939\u6807\u9898',
			description: '\u66f4\u6539\u6307\u5b9a\u6536\u85cf\u5939\u6807\u9898',
			type: 'text',
			default: 'fun',
		},
		userUid: {
			title: '\u7528\u6237uid',
			description: '\u8bbe\u7f6e\u7528\u6237uid',
			type: 'text',
			default: '',
		},
	},
};

class GMStorageExtra extends Storage {
	constructor() {
		super();
	}
	
	static get length() {
		return this.keys().length;
	}
	
	static getItem( key, defaultValue, group ) {
		( () => {} )( this.createKey( key, group ) );
		return GM_getValue( this.createKey( key, group ), defaultValue );
	}
	
	static hasItem( key, group ) {
		return Boolean( this.getItem( key, group ) );
	}
	
	static setItem( key, value, group ) {
		GM_setValue( this.createKey( key, group ), value );
	}
	
	static removeItem( key, group ) {
		GM_deleteValue( this.createKey( key, group ) );
	}
	
	static clear() {
		const keyList = GM_listValues();
		for ( const key of keyList ) {
			GM_deleteValue( key );
		}
	}
	
	static key( index ) {
		return this.keys()[index];
	}
	
	static keys() {
		return GM_listValues();
	}
	
	static groups() {
		const keyList = this.keys();
		return keyList.map( ( key => {
			const splitKeyList = key.split( '.' );
			if ( splitKeyList.length === 2 ) {
				return splitKeyList[0];
			}
			return '';
		} ) ).filter( ( item => item ) );
	}
	
	static createKey( key, group ) {
		if ( group ) {
			return `${ group }.${ key }`;
		}
		for ( let groupName in UserConfigs ) {
			const configGroup = UserConfigs[groupName];
			for ( let configKey in configGroup ) {
				if ( configKey === key ) {
					return `${ groupName }.${ key }`;
				}
			}
		}
		return key;
	}
}

const getUserUid = async () => {
	let userUid = GMStorageExtra.getItem( userUidConfig.key, '' );
	if ( !userUid ) {
		const selector = 'a.header-entry-mini[href^="//space.bilibili.com/"]';
		await getElement( document, selector, 6e4 );
		const userDom = document.querySelector( selector );
		if ( !userDom ) {
			return '';
		}
		userUid = new URL( userDom.href ).pathname.split( '/' )[1];
	}
	return Promise.resolve( userUid );
};

const setUserUid = uid => {
	GMStorageExtra.setItem( userUidConfig.key, uid );
};

const favouriteTitleConfig = {
	key: 'favouriteTitle',
	title: 'fun',
};

const getFavouriteTitle = () => GMStorageExtra.getItem( favouriteTitleConfig.key, favouriteTitleConfig.title );

const setFavouriteTitle = title => {
	GMStorageExtra.setItem( favouriteTitleConfig.key, title );
};

const hasFavouriteTitle = () => GMStorageExtra.hasItem( favouriteTitleConfig.key );

const codeConfig = {
	XOR_CODE: 23442827791579n,
	MASK_CODE: 2251799813685247n,
	MAX_AID: 1n << 51n,
	BASE: 58n,
	data: 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf',
};

function bvToAv( bvid ) {
	const {
		MASK_CODE: MASK_CODE,
		XOR_CODE: XOR_CODE,
		data: data,
		BASE: BASE,
	} = codeConfig;
	const bvidArr = Array.from( bvid );
	[ bvidArr[3], bvidArr[9] ] = [ bvidArr[9], bvidArr[3] ];
	[ bvidArr[4], bvidArr[7] ] = [ bvidArr[7], bvidArr[4] ];
	bvidArr.splice( 0, 3 );
	const tmp = bvidArr.reduce( ( ( pre, bvidChar ) => pre * BASE + BigInt( data.indexOf( bvidChar ) ) ), 0n );
	return Number( tmp & MASK_CODE ^ XOR_CODE );
}

const checkScriptCatEnvironment = () => GM_info.scriptHandler === 'Tampermonkey';

const sleep = timeoutPerSecond => new Promise( ( resolve => {
	setTimeout( resolve, timeoutPerSecond * 1e3 );
} ) );

async function freshListenerPushState( callback, delayPerSecond = 1 ) {
	let _pushState = window.history.pushState.bind( window.history );
	window.history.pushState = function () {
		setTimeout( callback, delayPerSecond * 1e3 );
		return _pushState.apply( this, arguments );
	};
}

const requestConfig = {
	baseURL: 'https://api.bilibili.com',
	csrf: new URLSearchParams( document.cookie.split( '; ' ).join( '&' ) ).get( 'bili_jct' ) || '',
};

const xhrRequest = ( url, method, data ) => {
	if ( !url.startsWith( 'http' ) ) {
		url = requestConfig.baseURL + url;
	}
	const xhr = new XMLHttpRequest;
	xhr.open( method, url );
	xhr.withCredentials = true;
	xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	return new Promise( ( ( resolve, reject ) => {
		xhr.addEventListener( 'load', ( () => {
			const response = JSON.parse( xhr.response );
			if ( response.code !== 0 ) {
				return reject( response.message );
			}
			return resolve( response.data );
		} ) );
		xhr.addEventListener( 'error', ( () => reject( xhr.status ) ) );
		xhr.send( new URLSearchParams( data ) );
	} ) );
};

const api_collectVideoToFavorite = ( videoId, favoriteId ) => {
	const formData = {
		rid: videoId,
		type: '2',
		add_media_ids: favoriteId,
		csrf: requestConfig.csrf,
	};
	return xhrRequest( '/x/v3/fav/resource/deal', 'POST', formData );
};

const api_createFavorites = favTitle => xhrRequest( '/x/v3/fav/folder/add', 'POST', {
	title: favTitle,
	privacy: 1,
	csrf: requestConfig.csrf,
} );

function request( url, method = 'GET', paramOrData, GMXmlHttpRequestConfig = {} ) {
	if ( !url.startsWith( 'http' ) ) {
		url = requestConfig.baseURL + url;
	}
	if ( paramOrData && method === 'GET' ) {
		url += '?' + new URLSearchParams( paramOrData ).toString();
	}
	else if ( paramOrData && method === 'POST' ) {
		GMXmlHttpRequestConfig.data = JSON.stringify( paramOrData );
	}
	return new Promise( ( ( resolve, reject ) => {
		const newGMXmlHttpRequestConfig = {
			timeout: 2e4,
			...GMXmlHttpRequestConfig,
			url: url,
			method: method,
			onload( response ) {
				resolve( JSON.parse( response.responseText ) );
			},
			onerror( error ) {
				reject( error );
			},
			ontimeout() {
				reject( new Error( 'Request timed out' ) );
			},
		};
		GM_xmlhttpRequest( newGMXmlHttpRequestConfig );
	} ) );
}

const api_listAllFavorites = async upUid => {
	const res = await request( '/x/v3/fav/folder/created/list-all', 'GET', {
		up_mid: upUid,
	} );
	if ( res.code !== 0 ) {
		throw new Error( res.message );
	}
	return res.data.list;
};

const api_sortFavorites = async favoriteIdList => xhrRequest( '/x/v3/fav/folder/sort', 'POST', {
	sort: favoriteIdList.toString(),
	csrf: requestConfig.csrf,
} );

const getReadFavouriteList = async userUid => {
	const favoriteList = await api_listAllFavorites( userUid );
	const favouriteTitle = getFavouriteTitle();
	const readFavouriteList = favoriteList.filter( ( favoriteInfo => favoriteInfo.title.match( new RegExp( `^${favouriteTitle}\\d+$` ) ) ) );
	readFavouriteList.sort( ( ( a, b ) => {
		const aIndex = Number( a.title.slice( favouriteTitle.length ) );
		const bIndex = Number( b.title.slice( favouriteTitle.length ) );
		return bIndex - aIndex;
	} ) );
	return readFavouriteList;
};

const menuList = [ {
	title: '\u8f93\u5165\u60a8\u7684uid',
	onClick: async () => {
		const uid = prompt( '\u8bf7\u8f93\u5165\u60a8\u7684\u7528\u6237uid (\u9ed8\u8ba4\u5c06\u4ece\u9875\u9762\u4e2d\u83b7\u53d6uid)\n\u5982\u679c\u8bbe\u7f6e\u4e86\u7528\u6237uid\u4f1a\u8ba9\u811a\u672c\u54cd\u5e94\u901f\u5ea6\u66f4\u5feb, \u4e0d\u7528\u7b49\u5f85\u9875\u9762\u8f7d\u5165\u83b7\u53d6uid\n(\u5982\u679c\u60a8\u4e0d\u77e5\u9053uid\u662f\u4ec0\u4e48, \u8bf7\u4e0d\u8981\u968f\u610f\u8f93\u5165)\n(\u7528\u6237uid\u662f\u60a8\u7684\u4e3b\u9875\u4e0a\u7f51\u5740\u7684\u4e00\u4e32\u6570\u5b57 \'https://space.bilibili.com/<uid>\')', await getUserUid() );
		if ( !uid ) {
			return;
		}
		setUserUid( uid );
	},
}, {
	title: '\u8bbe\u7f6e\u6536\u85cf\u5939\u6807\u9898',
	onClick: () => {
		if ( hasFavouriteTitle() ) {
			setFavouriteTitle( getFavouriteTitle() );
		}
		const title = prompt( '\u8bf7\u8f93\u5165\u6536\u85cf\u5939\u6807\u9898 (\u9ed8\u8ba4\u4f7f\u7528 \'fun\'\u4f5c\u4e3a\u6536\u85cf\u5939\u6807\u9898)\n', getFavouriteTitle() );
		if ( !title ) {
			return;
		}
		setFavouriteTitle( title );
	},
} ];

const registerMenu = () => {
	menuList.forEach( ( menuInfo => {
		const { title: title, onClick: onClick } = menuInfo;
		GM_registerMenuCommand( title, onClick );
	} ) );
};

const config = {
	MAX_MEDIA_COUNT: 1e3,
};

const checkFavoriteIsFull = favoriteInfo => favoriteInfo.media_count === config.MAX_MEDIA_COUNT;

const getVideoAvId = () => {
	const urlPathNameList = new URL( window.location.href ).pathname.split( '/' );
	let videoId = urlPathNameList.find( ( urlPathName => urlPathName.startsWith( 'BV1' ) || urlPathName.startsWith( 'av' ) ) );
	if ( !videoId ) {
		throw new Error( '\u6ca1\u6709\u83b7\u53d6\u5230\u89c6\u9891id' );
	}
	if ( videoId.startsWith( 'BV1' ) ) {
		videoId = String( bvToAv( videoId ) );
	}
	if ( videoId.startsWith( 'av' ) ) {
		videoId = videoId.slice( 2 );
	}
	return videoId;
};

const addVideoToFavorite = async ( videoId, latestFavorite ) => {
	const latestFavoriteId = String( latestFavorite.id );
	const res = await api_collectVideoToFavorite( videoId, latestFavoriteId );
	const successfullyAdd = ( res == null ? void 0 : res.success_num ) === 0;
	if ( !successfullyAdd ) {
		return;
	}
	( () => {} )( `\u5f53\u524d\u89c6\u9891\u5df2\u6dfb\u52a0\u81f3\u6536\u85cf\u5939 [${ latestFavorite.title }]` );
};

const createNewFavorite = title => api_createFavorites( title );

const sortOlderFavoritesToLast = async userUid => {
	const favoriteList = await api_listAllFavorites( userUid );
	const favoriteTitle = getFavouriteTitle();
	let readFavouriteList = favoriteList.filter( ( favoriteInfo => favoriteInfo.title.startsWith( favoriteTitle ) ) );
	let otherFavouriteList = favoriteList.filter( ( favoriteInfo => !favoriteInfo.title.startsWith( favoriteTitle ) ) );
	readFavouriteList.sort( ( ( a, b ) => {
		const aIndex = Number( a.title.slice( favoriteTitle.length ) );
		const bIndex = Number( b.title.slice( favoriteTitle.length ) );
		return bIndex - aIndex;
	} ) );
	if ( readFavouriteList[0].media_count >= config.MAX_MEDIA_COUNT ) {
		throw new Error( 'The latest favorite folder is full.' );
	}
	const latestFavourite = readFavouriteList[0];
	readFavouriteList = readFavouriteList.slice( 1 );
	const defaultFavourite = otherFavouriteList[0];
	otherFavouriteList = otherFavouriteList.slice( 1 );
	const newFavoriteIdList = [ defaultFavourite, latestFavourite, ...otherFavouriteList, ...readFavouriteList ].map( ( info => info.id ) );
	api_sortFavorites( newFavoriteIdList );
};

const api_isFavorVideo = () => request( '/x/v2/fav/video/favoured', 'GET', {
	aid: getVideoAvId(),
} ).then( ( res => {
	if ( res.code !== 0 ) {
		throw new Error( res.message );
	}
	return res.data.favoured;
} ) );

const autoAddVideoToFavourites = async () => {
	let isFavorVideo = await api_isFavorVideo();
	( () => {} )( '\u5f53\u524d\u89c6\u9891\u5df2\u7ecf\u88ab\u6536\u85cf:', isFavorVideo, `av${ getVideoAvId() }` );
	if ( isFavorVideo ) {
		return;
	}
	const userUid = await getUserUid();
	if ( !userUid ) {
		throw new Error( '\u83b7\u53d6\u7528\u6237uid\u5931\u8d25' );
	}
	const readFavouriteList = await getReadFavouriteList( userUid );
	if ( !readFavouriteList.length ) {
		const favoriteTitle = getFavouriteTitle();
		await createNewFavorite( favoriteTitle + '1' );
		await autoAddVideoToFavourites();
		return;
	}
	const videoId = getVideoAvId();
	const latestFavourite = readFavouriteList[0];
	const isFullInFavorite = checkFavoriteIsFull( readFavouriteList[0] );
	if ( !isFullInFavorite ) {
		await addVideoToFavorite( videoId, latestFavourite );
	}
	if ( isFullInFavorite ) {
		const favoriteTitle = getFavouriteTitle();
		const latestFavouriteId = Number( latestFavourite.title.slice( favoriteTitle.length ) );
		await createNewFavorite( `${ favoriteTitle }${ latestFavouriteId + 1 }` );
		await sleep( 1 );
		await sortOlderFavoritesToLast( userUid );
		await autoAddVideoToFavourites();
		return;
	}
	isFavorVideo = await api_isFavorVideo();
	if ( !isFavorVideo ) {
		throw new Error( '\u6536\u85cf\u5931\u8d25' );
	}
	const favButtonSelector = '.video-fav.video-toolbar-left-item:not(.on)';
	const favButtonDom = await getElement( document, favButtonSelector );
	if ( favButtonDom ) {
		favButtonDom.classList.add( 'on' );
	}
};

!checkScriptCatEnvironment() && registerMenu();

autoAddVideoToFavourites();

freshListenerPushState( ( async () => {
	await autoAddVideoToFavourites();
} ), 5 );
