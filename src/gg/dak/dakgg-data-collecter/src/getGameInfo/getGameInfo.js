import { MatchDataStorage } from '../Storage/MatchDataStorage.js';
import { MatchDataMapperStorage } from '../Storage/MatchDataMapperStorage.js';

/**
 * 获取对局数据
 */
export const getGameInfo = ( gameInfoContainer ) => {
	/* 获取数据 */
	const gameInfo = {
		// 游戏名, 常量
		game: '永恒轮回',
		// 玩家昵称
		player: __NEXT_DATA__.query.name,
		// 队友信息
		teammate: [],
		// 对局Id
		gameId: gameInfoContainer.querySelector( '.game-info > .game > .id' ).textContent,
	};
	
	/**
	 * 从原始数据中获取
	 */
		// 根据比赛 Id 读取比赛数据
	const originMatchData = MatchDataStorage.get( gameInfo.gameId );
	// 获取主视角数据
	const selfInfo = originMatchData.matches.find( ( info ) => info.nickname === gameInfo.player );
	// 获取队友数据
	const teammateInfoList = originMatchData.matches.filter( ( info ) => {
		if ( !( info.gameRank === selfInfo.gameRank && info.nickname !== gameInfo.player ) ) {
			return false;
		}
		gameInfo.teammate.push( {} );
		return true;
	} );
	
	/*
	* 计算数据
	* %playTime% Date实例化
	* %date% Date获取
	* %time% Date获取
	* %changeRp% 计算增/减, 显示正负号
	* %playerPage% 根据 player 计算
	* %routeIdOfStart% 如果为 0, 显示 'Private'
	* %stat%
	* */
	
	// 原始数据映射表, ([数据key, 输出key])[]
	const originMatchDataKeyMapper = [
		// 玩家昵称
		[ 'nickname', 'player' ],
		// 赛季
		[ 'seasonId', 'season' ],
		// 匹配模式
		[ 'matchingMode', 'gameMode' ],
		// 游戏版本号
		[ 'versionMajor', 'gameVersionMajor' ],
		[ 'versionMinor', 'gameVersionMinor' ],
		
		// 排名
		[ 'gameRank', 'rank' ],
		// 服务器
		[ 'serverName', 'server' ],
		
		// 角色
		[ 'characterNum', 'character' ],
		// 角色皮肤
		[ 'skinCode', 'skin' ],
		// 角色等级
		[ 'characterLevel', 'characterLevel' ],
		
		// 武器
		[ 'bestWeapon', 'weapon' ],
		// 战术技能
		[ 'tacticalSkillGroup', 'tacticalSkill' ],
		// 战术技能等级
		[ 'tacticalSkillLevel', 'tacticalSkillLevel' ],
		[ 'tacticalSkillLevel', 'skillLevel' ],
		// 出装(数组)
		[ 'equipment', 'item' ],
		
		// 游玩时间
		[ 'startDtm', 'playTime' ],
		// 比赛前的 rp
		[ 'mmrBefore', 'rp' ],
		// 比赛增加的rp (可能为负)
		[ 'mmrGain', 'addedRp' ],
		// 完赛后的 rp
		[ 'mmrAfter', 'resultRp' ],
		// 对局平均 rp
		[ 'mmrAvg', 'avgRp' ],
		
		// 伤害
		[ 'damageToPlayer', 'damage' ],
		// 总承伤(幸存者)
		[ 'damageFromPlayer', 'damageFromPlayer' ],
		// 团队击杀
		[ 'teamKill', 'teamKill' ],
		// 个人击杀
		[ 'playerKill', 'kill' ],
		// 死亡
		[ 'playerDeaths', 'death' ],
		// 助攻
		[ 'playerAssistant', 'assist' ],
		
		// 核心主潜能
		[ 'traitFirstCore', 'traitFirstCore' ],
		// 辅助主潜能 (数组)
		[ 'traitFirstSub', 'traitFirstSub' ],
		// 辅助副潜能 (数组)
		[ 'traitSecondSub', 'traitSecondSub' ],
		// 技能升级顺序 (数组)
		[ 'skillOrderInfo', 'skillOrder' ],
		
		// 路径id
		[ 'routeIdOfStart', 'routeId' ],
		// 注册地区
		[ 'language', 'language' ],
	];
	/**
	 * 替换或者添加数据
	 */
	const replaceMatchData = ( selfMatchData, teammateListMatchData, callback ) => {
		// 主视角数据
		callback( selfMatchData );
		// 队友数据
		teammateListMatchData.forEach( ( teammateInfo, index ) => {
			callback( teammateInfo );
		} );
	};
	// 将自己的数据和队友的数据绑定在替换器上
	const matchDateReplacer = replaceMatchData.bind( void 0, gameInfo, gameInfo.teammate );
	
	// 原始数据映射
	originMatchDataKeyMapper.forEach( ( [ originKey, outputKey ] ) => {
		// 主视角数据
		gameInfo[outputKey] = selfInfo[originKey] == null ? '' : selfInfo[originKey];
		// 队友数据
		teammateInfoList.forEach( ( teammateInfo, index ) => {
			gameInfo.teammate[index][outputKey] = teammateInfo[originKey] == null ? '' : teammateInfo[originKey];
		} );
	} );
	
	/* 计算属性 */
	matchDateReplacer( ( info ) => {
		// 赛季
		const seasons = MatchDataMapperStorage.get( 'seasons' ).seasons;
		const currentSeason = seasons.find( item => item.isCurrent );
		const selectSeasonKey = new URLSearchParams( location.search ).get( 'season' );
		const selectSeason = selectSeasonKey
			? seasons.find( item => item.key === selectSeasonKey )
			: currentSeason;
		info.season = selectSeason.name;
		
		// 游玩模式(匹配模式)
		const gameModes = [
			{ id: 2, name: '一般' },
			{ id: 3, name: '排位' },
			{ id: 6, name: '钴协议' },
		];
		info.gameMode = gameModes.find( item => item.id === info.gameMode )?.name || '';
		
		// 版本号
		info.versionMajor = selectSeason.id >= 18 ? 1 : 0;
		info.gameVersion = `v${ info.versionMajor }.${ info.gameVersionMajor }.${ info.gameVersionMinor }`;
		
		// 角色
		const characters = MatchDataMapperStorage.get( 'characters' ).characters;
		const selectCharacter = characters.find( item => item.id === info.character ) || {};
		info.character = selectCharacter?.name || '';
		// 角色使用皮肤
		info.skin = selectCharacter.skins?.find( item => item.id === info.skin )?.name || '';
		
		// 使用武器
		const weapons = MatchDataMapperStorage.get( 'masteries' ).masteries;
		const selectWeapon = weapons.find( item => item.id === info.weapon ) || {};
		info.weapon = selectWeapon?.name || '';
		
		// 技能
		const tacticalSkills = MatchDataMapperStorage.get( 'tactical-skills' ).tacticalSkills;
		const selectTacticalSkill = tacticalSkills.find( item => item.id === info.tacticalSkill ) || {};
		info.tacticalSkill = selectTacticalSkill?.name || '';
		info.skill = info.tacticalSkill;
		
		// 出装
		const itemGradeMapper = {
			Common: '一般',
			Uncommon: '高级',
			Rare: '稀有',
			Epic: '英雄',
			Legend: '传说',
			Mythic: '超凡',
		};
		const items = MatchDataMapperStorage.get( 'items' ).items;
		info.item = info.item.map( itemId => {
			const selectItem = items.find( item => item.id === itemId );
			return selectItem
				? `(${ itemGradeMapper[selectItem.grade] })${ selectItem.name }`
				: '(Empty)';
		} );
		
		// 潜能信息
		const traitSkills = MatchDataMapperStorage.get( 'trait-skills' ).traitSkills;
		const traitSkillGroups = [
			...MatchDataMapperStorage.get( 'trait-skills' ).traitSkillGroups,
			{ key: 'Cobalt', name: '钴协议' },
		];
		const traitTypeMapper = {
			Core: '核心',
			Sub1: '辅助',
			Sub2: '辅助',
			Cobalt: '钴协议',
		};
		// 主潜能
		const traitFirstCore = traitSkills.find( item => item.id === info.traitFirstCore );
		const traitFirstGroup = traitSkillGroups.find( item => item.key === traitFirstCore.group );
		const traitFirstGroupName = traitFirstGroup?.name || '';
		const traitFirstSub = info.traitFirstSub.map( ( id ) => traitSkills.find( item => item.id === id ) );
		// 副潜能
		const traitSecondSub = info.traitSecondSub.map( ( id ) => traitSkills.find( item => item.id === id ) );
		const traitSecondGroup = traitSkillGroups.find( item => item.key === traitSecondSub[0].group );
		const traitSecondGroupName = traitSecondGroup?.name || '';
		/**
		 * 字符串序列化潜能信息
		 */
		const stringifyTrait = ( groupName, traitInfo ) => `${ traitInfo.name } (${ groupName }, ${ traitTypeMapper[traitInfo.type] })`;
		// 主潜能文本数组
		info.traitCore = [
			`主潜能: ${ traitFirstGroupName }`,
			stringifyTrait( traitFirstGroupName, traitFirstCore ),
			...traitFirstSub.map( trait => stringifyTrait( traitFirstGroupName, trait ) ),
		];
		// 副潜能文本数组
		info.traitSub = [
			`副潜能: ${ traitSecondGroupName }`,
			...traitSecondSub.map( trait => stringifyTrait( traitSecondGroupName, trait ) ),
		];
		// 删除额外的潜能信息
		delete info.traitSecondSub;
		delete info.traitFirstSub;
		delete info.traitFirstCore;
		
		// 技能升级顺序
		const skills = MatchDataMapperStorage.get( 'skills' ).skills
		                                     .map( skillInfo => ( {
			                                     ...skillInfo,
			                                     id: Math.floor( skillInfo.id / 100 ),
		                                     } ) );
		// 将 Id 除以 100 再取整, 因为技能的后两位一定是 0 . 但是输出的数据有可能不是 0
		// 他的 Id 管理有问题
		const skillOrderList = Object.values( info.skillOrder )
		                             .map( skillId => Math.floor( skillId / 100 ) );
		// 去重
		const skillIdSet = new Set( skillOrderList );
		// 获取技能数据数组
		const skillInfoList = Array.from( skillIdSet )
		                           .map( skillId => skills.find( item => item.id.toString().startsWith( skillId ) ) );
		// 将数组转为对象
		const skillMapper = skillInfoList.reduce( ( skillMapper, skill ) => {
			if ( skill ) {
				skillMapper[skill.id] = skill.slot;
			}
			return skillMapper;
		}, {} );
		info.skillOrder = skillOrderList.map( skillId => skillMapper[skillId] ).join( ' -> ' );
		
		// 日期
		const date = new Date( info.playTime );
		info.date = date.toLocaleDateString().replace( /\//g, '-' );
		info.time = date.toLocaleTimeString();
		info.playTime = `${ info.date } ${ info.time }`;
		
		// changeRp
		info.addedRp && ( info.changeRp = info.addedRp > 0
			? `+${ info.addedRp }`
			: `${ info.addedRp }` );
		
		// 玩家主页
		info.playerPage = `https://dak.gg/er/players/${ info.player }`;
		
		// 路径Id, 如果为 0, 显示 'Private'
		info.routeId ||= 'Private';
		
		// stat
		info.stat = [
			info.teamKill,
			info.kill,
			info.death,
			info.assist,
		].join( ' / ' );
		
		// language
		info.language = info.language.startsWith( 'Chinese' )
			? 'Chinese'
			: info.language;
	} );
	
	// 按照输出排序队友
	gameInfo.teammate.sort( ( a, b ) => b.damage - a.damage );
	
	// 将对局信息从队友信息中删除
	const gameRoundInfoList = [
		'season',
		'gameMode',
		'gameVersion',
		'versionMajor',
		'gameVersionMajor',
		'gameVersionMinor',
		'rank',
		'server',
		'playTime',
		'date',
		'time',
		'avgRp',
	];
	gameRoundInfoList.forEach( gameRoundInfo => {
		gameInfo.teammate.forEach( ( teammateInfo ) => {
			delete teammateInfo[gameRoundInfo];
		} );
	} );
	
	return {
		...gameInfo,
	};
};
