/**
 * 数据映射存储
 */
export class MatchDataMapperStorage {
    static matchDataMapper = new Map();

    static get(matchId) {
        return this.matchDataMapper.get(matchId);
    }

    static set(matchId, matchData) {
        this.matchDataMapper.set(matchId, matchData);
    }
}
