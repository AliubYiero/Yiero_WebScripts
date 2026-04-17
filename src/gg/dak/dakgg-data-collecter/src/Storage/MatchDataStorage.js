/**
 * 比赛数据存储
 */
export class MatchDataStorage {
    static matchDataMap = new Map();

    static get(matchId) {
        return this.matchDataMap.get(Number(matchId));
    }

    static set(matchId, matchData) {
        this.matchDataMap.set(Number(matchId), matchData);
    }
}
