## 比赛数据

### API

```plain
https://er.dakgg.io/api/v1/players/:player/matches/:season/:gameId
```

- 请求方式: `GET`

### 请求体

| 参数      | 类型     | 描述     | 备注                                     |
| --------- | -------- | -------- | ---------------------------------------- |
| :player   | `string` | 玩家名   | 需要使用转义序列对统一资源标识符进行编码 |
| :seasonId | `enum`   | 赛季编号 | 见 [`seasonId 枚举`](#`seasonId`%20枚举) |
| :gameId   | `number` | 游戏Id   | 游戏编号                                 |

#### `seasonId` 枚举

| 枚举 | 对应赛季    | 编号          |
| ---- | ----------- | ------------- |
| 0    | 一般        | NORMAL        |
| 1    | EA赛季 S1   | SEASON_1      |
| 2    | EA 季前赛 2 | PRE_SEASON_2  |
| 3    | EA赛季 S2   | SEASON_2      |
| 4    | EA 季前赛 3 | PRE_SEASON_3  |
| 5    | EA赛季 S3   | SEASON_3      |
| 6    | EA 季前赛 4 | PRE_SEASON_4  |
| 7    | EA赛季 S4   | SEASON_4      |
| 8    | EA 季前赛 5 | PRE_SEASON_5  |
| 9    | EA赛季 S5   | SEASON_5      |
| 10   | EA 季前赛 6 | PRE_SEASON_6  |
| 11   | EA赛季 S6   | SEASON_6      |
| 12   | EA 季前赛 7 | PRE_SEASON_7  |
| 13   | EA赛季 S7   | SEASON_7      |
| 14   | EA 季前赛 8 | PRE_SEASON_8  |
| 15   | EA赛季 S8   | SEASON_8      |
| 16   | EA 季前赛 9 | PRE_SEASON_9  |
| 17   | EA赛季 S9   | SEASON_9      |
| 18   | 季前赛 1    | PRE_SEASON_10 |
| 19   | 正式赛季 S1 | SEASON_10     |
| 20   | 季前赛 2    | PRE_SEASON_11 |
| 21   | 正式赛季 S2 | SEASON_11     |
| 22   | 季前赛 3    | PRE_SEASON_12 |
| 23   | 正式赛季 S3 | SEASON_12     |
| 24   | 季前赛 4    | PRE_SEASON_13 |
| 25   | 正式赛季 S4 | SEASON_13     |
| 26   | 季前赛 5    | PRE_SEASON_14 |
| 27   | 正式赛季 S5 | SEASON_14     |

### 响应体

| 字段        | 类型           | 内容              | 备注                                                       |
| ----------- | -------------- | ----------------- | ---------------------------------------------------------- |
| playerTiers | `playerTier[]` | `playerTier` 数组 | 玩家水平数组, 见 [`playerTier` 对象](#`playerTier`%20对象) |
| skillInfos  | `skillInfo[]`  | `skillInfo` 数组  | 技能信息数组, 见 [`skillInfo 对象`](#`skillInfo`%20对象)   |
| matchTier   | `Object`       | 比赛水平          | 见 [`matchTier` 对象](#`matchTier`%20对象)                 |
| matches     | `Object`       |                   | 见 [`match` 对象](#`match`%20对象)                         |

#### `playerTier` 对象

| 字段        | 类型     | 内容     | 备注                                                         |
| ----------- | -------- | -------- | ------------------------------------------------------------ |
| userNum     | `number` | 玩家Id   | 在 [`match` 对象](#`match`%20对象) 可以找到对应的玩家        |
| mmr         | `number` | 玩家 Rp  | 比赛前的初始 RP                                              |
| tierId      | `enum`   | 段位编号 | 见 [`tierId` 枚举](#`tierId`%20枚举)                         |
| tierGradeId | `number` | 段位等级 |                                                              |
| tierMmr     | `number` | 段位分数 | 比如RP 500, `tierMmr` 显示 50 . 表示 铁阎1 50分 (铁阎1 450RP ~ 600RP). |

##### `tierId` 枚举

| 枚举 | 对应段位 |
| ---- | -------- |
| 1    | 铁阎     |
| 2    | 铜魂     |
| 3    | 银烙     |
| 4    | 金魄     |
| 5    | 修罗     |
| 6    | 灭钻     |
| 63   | 星陨     |
| 66   | 无瑕     |
| 7    | 半神     |
| 8    | 永恒     |

---

#### `skillInfo` 对象

| 字段      | 类型       | 内容                   | 备注                                                  |
| --------- | ---------- | ---------------------- | ----------------------------------------------------- |
| userNum   | `number`   | 玩家Id                 | 在 [`match` 对象](#`match`%20对象) 可以找到对应的玩家 |
| builds    | `string[]` | 技能升满级的顺序       | 只显示 QWET 的升级顺序                                |
| orders    | `string[]` | 技能升级顺序           | 数组的每一项对应每级升哪一个技能                      |
| maxLevels | `Object`   | 终局时每一个技能的等级 | 见 [`maxLevel` 对象](#`maxLevel`%20对象)              |

##### `maxLevel` 对象

| 字段 | 类型     | 内容              | 备注 |
| ---- | -------- | ----------------- | ---- |
| Q    | `number` | 终局时 Q 技能等级 |      |
| W    | `number` | 终局时 W 技能等级 |      |
| E    | `number` | 终局时 E 技能等级 |      |
| R    | `number` | 终局时 R 技能等级 |      |
| T    | `number` | 终局时 T 技能等级 |      |

---

#### `matchTier` 对象

| 字段      | 类型     | 内容             | 备注 |
| --------- | -------- | ---------------- | ---- |
| mmr       | `number` | 对局平均 Rp      |      |
| tierType  | `number` | 对局平均段位     |      |
| tierGrade | `number` | 对局平均段位等级 |      |
| tierMmr   | `number` | 对局平均段位分数 |      |

---

#### `match` 对象

| 字段                                    | 类型                     | 内容                     | 备注                                                         |
| --------------------------------------- | ------------------------ | ------------------------ | ------------------------------------------------------------ |
| userNum                                 | `number`                 | 玩家Id                   |                                                              |
| nickname                                | `string`                 | 玩家昵称                 |                                                              |
| gameId                                  | `number`                 | 比赛id (比赛编号)        |                                                              |
| seasonId                                | `enum`                   | 赛季编号                 | 见 [`seasonId 枚举`](#`seasonId`%20枚举)                     |
| matchingMode                            | `enum`                   | 比赛模式枚举             | `2`: 一般<br />`3`: 排位<br />`6`: 钴模式                    |
| matchingTeamMode                        | `enum`                   |                          | *未知枚举*                                                   |
| characterNum                            | `enum`                   | 游玩角色枚举             |                                                              |
| skinCode                                | `number`                 | 使用皮肤编号             |                                                              |
| characterLevel                          | `number`                 | (完赛时)角色等级         |                                                              |
| gameRank                                | `number`                 | 排名                     |                                                              |
| playerKill                              | `number`                 | 玩家击杀                 |                                                              |
| playerAssistant                         | `number`                 | 玩家助攻                 |                                                              |
| monsterKill                             | `number`                 | 狩猎野生动物数           |                                                              |
| bestWeapon                              | `enum`                   | 武器类型编号             | 见 [`bestWeapon` 枚举](#`bestWeapon`%20枚举)                 |
| bestWeaponLevel                         | `number`                 | (完赛时)武器等级         |                                                              |
| masteryLevel                            | `object`                 | 熟练度表                 | 见 [`masteryLevel` 对象](#`masteryLevel`%20对象)             |
| equipment                               | `number[]`               |                          | 出装道具编号数组                                             |
| versionMajor                            | `number`                 | 版本号                   | 例: `36` 表示 v1.36.1中的 36                                 |
| versionMinor                            | `number`                 | 小版本号                 | 例: `1` 表示 v1.36.1中的 1                                   |
| language                                | `string`                 | 玩家地区                 | `ChineseSimplified`: 中国<br />`ChineseTraditional`: 中国台湾<br />`Korean`: 韩国<br />`Japanese`: 日本 |
| skillLevelInfo                          | `Record<string, number>` | 技能等级对象             | `key`: 技能编号<br />`value`: 技能等级                       |
| skillOrderInfo                          | `Record<string, number>` | 技能升级顺序对象         | `key`: 等级<br />`value`: 升级的技能编号                     |
| serverName                              | `string`                 | 服务器                   | `Asia` 对应亚洲<br />`Asia2` 对应亚二(国服)                  |
| maxHp                                   | `number`                 | 体力上限                 |                                                              |
| maxSp                                   | `number`                 | 耐力上限                 |                                                              |
| attackPower                             | `number`                 | 攻击力                   |                                                              |
| defense                                 | `number`                 | 防御力                   |                                                              |
| hpRegen                                 | `number`                 | 体力再生                 |                                                              |
| spRegen                                 | `number`                 | 耐力再生                 |                                                              |
| attackSpeed                             | `number`                 | 攻击速度                 |                                                              |
| moveSpeed                               | `number`                 | 移动速度                 |                                                              |
| outOfCombatMoveSpeed                    | `number`                 | 移动速度                 | 同 `moveSpeed`                                               |
| sightRange                              | `number`                 | 视野范围                 |                                                              |
| attackRange                             | `number`                 | 普攻射程                 |                                                              |
| criticalStrikeChance                    | `number`                 | 暴击率                   |                                                              |
| criticalStrikeDamage                    | `number`                 | 暴击伤害量               |                                                              |
| coolDownReduction                       | `number`                 | 冷却缩减                 |                                                              |
| lifeSteal                               | `number`                 | 吸血 - 所有伤害          |                                                              |
| normalLifeSteal                         | `number`                 | 吸血 - 普攻伤害          |                                                              |
| skillLifeSteal                          | `number`                 | 吸血 - 技能伤害          |                                                              |
| amplifierToMonster                      | `number`                 | 狩猎野生动物             |                                                              |
| trapDamage                              | `number`                 |                          |                                                              |
| rewardCoin                              | `number`                 |                          |                                                              |
| bonusCoin                               | `number`                 |                          |                                                              |
| gainExp                                 | `number`                 |                          |                                                              |
| baseExp                                 | `number`                 |                          |                                                              |
| bonusExp                                | `number`                 |                          |                                                              |
| startDtm                                | `string`                 | 游戏开始日期             |                                                              |
| duration                                | `number`                 | 游戏持续时间(s)          | 整局游戏的持续时间                                           |
| mmrBefore                               | `number`                 | 游戏开始前的 rp          |                                                              |
| mmrGain                                 | `number`                 | 游戏改变的 rp            |                                                              |
| mmrAfter                                | `number`                 | 游戏结束后的 rp          | `mmrAfter` = `mmrBefore` + `mmrGain`                         |
| playTime                                | `number`                 | 玩家的游玩时间(s)        | 截止至玩家死亡时的时间                                       |
| watchTime                               | `number`                 |                          |                                                              |
| totalTime                               | `number`                 |                          | 同 `playTime`                                                |
| survivableTime                          | `number`                 |                          |                                                              |
| botAdded                                | `number`                 |                          |                                                              |
| botRemain                               | `number`                 |                          |                                                              |
| restrictedAreaAccelerated               | `number`                 |                          |                                                              |
| safeAreas                               | `number`                 |                          |                                                              |
| teamNumber                              | `number`                 | 团队人数                 |                                                              |
| preMade                                 | `number`                 |                          |                                                              |
| eventMissionResult                      | `object`                 |                          |                                                              |
| gainedNormalMmrKFactor                  | `number`                 |                          |                                                              |
| victory                                 | `number`                 |                          |                                                              |
| craftUncommon                           | `number`                 |                          |                                                              |
| craftRare                               | `number`                 |                          |                                                              |
| craftEpic                               | `number`                 |                          |                                                              |
| craftLegend                             | `number`                 |                          |                                                              |
| damageToPlayer                          | `number`                 | 玩家总伤害(玩家)         | 对其他玩家的总伤害                                           |
| damageToPlayer_trap                     | `number`                 |                          |                                                              |
| damageToPlayer_basic                    | `number`                 | 玩家伤害(普攻)           |                                                              |
| damageToPlayer_skill                    | `number`                 | 玩家伤害(技能)           |                                                              |
| damageToPlayer_itemSkill                | `number`                 | 玩家伤害(物品技能)       |                                                              |
| damageToPlayer_direct                   | `number`                 |                          |                                                              |
| damageToPlayer_uniqueSkill              | `number`                 |                          |                                                              |
| damageFromPlayer                        | `number`                 | 玩家总承伤(幸存者)       | 其它玩家对自己造成的伤害                                     |
| damageFromPlayer_trap                   | `number`                 |                          |                                                              |
| damageFromPlayer_basic                  | `number`                 | 玩家承伤(普攻)           |                                                              |
| damageFromPlayer_skill                  | `number`                 | 玩家承伤(技能)           |                                                              |
| damageFromPlayer_itemSkill              | `number`                 | 玩家承伤(物品技能)       |                                                              |
| damageFromPlayer_direct                 | `number`                 |                          |                                                              |
| damageFromPlayer_uniqueSkill            | `number`                 |                          |                                                              |
| damageToMonster                         | `number`                 | 玩家总伤害(野怪)         | 对野怪造成的伤害                                             |
| damageToMonster_trap                    | `number`                 |                          |                                                              |
| damageToMonster_basic                   | `number`                 | 玩家伤害(普攻)(野怪)     |                                                              |
| damageToMonster_skill                   | `number`                 | 玩家伤害(技能)(野怪)     |                                                              |
| damageToMonster_itemSkill               | `number`                 | 玩家伤害(物品技能)(野怪) |                                                              |
| damageToMonster_direct                  | `number`                 |                          |                                                              |
| damageToMonster_uniqueSkill             | `number`                 |                          |                                                              |
| damageFromMonster                       | `number`                 | 玩家总承伤(野怪)         | 野怪对自己造成的伤害                                         |
| damageToPlayer_Shield                   | `number`                 |                          |                                                              |
| damageOffsetedByShield_Player           | `number`                 |                          |                                                              |
| damageOffsetedByShield_Monster          | `number`                 |                          |                                                              |
| killMonsters                            | `Record<string, number>` | 击杀野怪数               | `key`: 野怪编号<br />`value`: 击杀对应野怪数                 |
| healAmount                              | `number`                 |                          |                                                              |
| teamRecover                             | `number`                 |                          |                                                              |
| protectAbsorb                           | `number`                 |                          |                                                              |
| addSurveillanceCamera                   | `number`                 |                          |                                                              |
| addTelephotoCamera                      | `number`                 |                          |                                                              |
| removeSurveillanceCamera                | `number`                 |                          |                                                              |
| removeTelephotoCamera                   | `number`                 |                          |                                                              |
| useHyperLoop                            | `number`                 |                          |                                                              |
| useSecurityConsole                      | `number`                 |                          |                                                              |
| giveUp                                  | `number`                 |                          |                                                              |
| teamSpectator                           | `number`                 |                          |                                                              |
| pcCafe                                  | `number`                 |                          |                                                              |
| routeIdOfStart                          | `number`                 |                          |                                                              |
| routeSlotId                             | `number`                 |                          |                                                              |
| teamKill                                | `number`                 | 团队击杀数               |                                                              |
| placeOfStart                            | `string`                 |                          |                                                              |
| mmrAvg                                  | `number`                 | 对局平均 rp              |                                                              |
| matchSize                               | `number`                 | 对局玩家总数             |                                                              |
| totalFieldKill                          | `number`                 |                          |                                                              |
| accountLevel                            | `number`                 |                          |                                                              |
| killerUserNum                           | `number`                 |                          |                                                              |
| killer                                  | `string`                 |                          |                                                              |
| killDetail                              | `string`开始             |                          |                                                              |
| causeOfDeath                            | `string`                 |                          |                                                              |
| placeOfDeath                            | `string`                 |                          |                                                              |
| killerCharacter                         | `string`                 |                          |                                                              |
| killerWeapon                            | `string`                 |                          |                                                              |
| killerUserNum2                          | `number`                 |                          |                                                              |
| killerUserNum3                          | `number`                 |                          |                                                              |
| fishingCount                            | `number`                 |                          |                                                              |
| useEmoticonCount                        | `number`                 |                          |                                                              |
| expireDtm                               | `string`                 |                          |                                                              |
| traitFirstCore                          | `number`                 |                          |                                                              |
| traitFirstSub                           | `object`                 |                          |                                                              |
| traitSecondSub                          | `object`                 |                          |                                                              |
| airSupplyOpenCount                      | `object`                 |                          |                                                              |
| foodCraftCount                          | `object`                 |                          |                                                              |
| beverageCraftCount                      | `object`                 |                          |                                                              |
| rankPoint                               | `number`                 | 游戏结束后的 rp          | 同 `mmrAfter`                                                |
| totalTurbineTakeOver                    | `number`                 |                          |                                                              |
| usedNormalHealPack                      | `number`                 |                          |                                                              |
| usedReinforcedHealPack                  | `number`                 |                          |                                                              |
| usedNormalShieldPack                    | `number`                 |                          |                                                              |
| usedReinforceShieldPack                 | `number`                 |                          |                                                              |
| totalVFCredits                          | `object`                 |                          |                                                              |
| activelyGainedCredits                   | `number`                 |                          |                                                              |
| usedVFCredits                           | `object`                 |                          |                                                              |
| sumUsedVFCredits                        | `number`                 |                          |                                                              |
| craftMythic                             | `number`                 |                          |                                                              |
| playerDeaths                            | `number`                 |                          |                                                              |
| killGamma                               | `boolean`                |                          |                                                              |
| scoredPoint                             | `object`                 |                          |                                                              |
| killDetails                             | `string`                 |                          |                                                              |
| deathDetails                            | `string`                 |                          |                                                              |
| killsPhaseOne                           | `number`                 |                          |                                                              |
| killsPhaseTwo                           | `number`                 |                          |                                                              |
| killsPhaseThree                         | `number`                 |                          |                                                              |
| deathsPhaseOne                          | `number`                 |                          |                                                              |
| deathsPhaseTwo                          | `number`                 |                          |                                                              |
| deathsPhaseThree                        | `number`                 |                          |                                                              |
| usedPairLoop                            | `number`                 |                          |                                                              |
| ccTimeToPlayer                          | `number`                 |                          |                                                              |
| creditSource                            | `object`                 |                          |                                                              |
| boughtInfusion                          | `string`                 |                          |                                                              |
| itemTransferredConsole                  | `object`                 |                          |                                                              |
| itemTransferredDrone                    | `object`                 |                          |                                                              |
| escapeState                             | `number`                 |                          |                                                              |
| totalDoubleKill                         | `number`                 |                          |                                                              |
| totalTripleKill                         | `number`                 |                          |                                                              |
| totalQuadraKill                         | `number`                 |                          |                                                              |
| totalExtraKill                          | `number`                 |                          |                                                              |
| collectItemForLog                       | `object`                 |                          |                                                              |
| equipFirstItemForLog                    | `object`                 |                          |                                                              |
| battleZone1AreaCode                     | `number`                 |                          |                                                              |
| battleZone1BattleMark                   | `number`                 |                          |                                                              |
| battleZone1ItemCode                     | `object`                 |                          |                                                              |
| battleZone2AreaCode                     | `number`                 |                          |                                                              |
| battleZone2BattleMark                   | `number`                 |                          |                                                              |
| battleZone2ItemCode                     | `object`                 |                          |                                                              |
| battleZone3AreaCode                     | `number`                 |                          |                                                              |
| battleZone3BattleMark                   | `number`                 |                          |                                                              |
| battleZone3ItemCode                     | `object`                 |                          |                                                              |
| battleZonePlayerKill                    | `number`                 |                          |                                                              |
| battleZoneDeaths                        | `number`                 |                          |                                                              |
| battleZone1Winner                       | `number`                 |                          |                                                              |
| battleZone2Winner                       | `number`                 |                          |                                                              |
| battleZone3Winner                       | `number`                 |                          |                                                              |
| battleZone1BattleMarkCount              | `number`                 |                          |                                                              |
| battleZone2BattleMarkCount              | `number`                 |                          |                                                              |
| battleZone3BattleMarkCount              | `number`                 |                          |                                                              |
| tacticalSkillGroup                      | `number`                 |                          |                                                              |
| tacticalSkillLevel                      | `number`                 |                          |                                                              |
| totalGainVFCredit                       | `number`                 |                          |                                                              |
| killPlayerGainVFCredit                  | `number`                 |                          |                                                              |
| killChickenGainVFCredit                 | `number`                 |                          |                                                              |
| killBoarGainVFCredit                    | `number`                 |                          |                                                              |
| killWildDogGainVFCredit                 | `number`                 |                          |                                                              |
| killWolfGainVFCredit                    | `number`                 |                          |                                                              |
| killBearGainVFCredit                    | `number`                 |                          |                                                              |
| killOmegaGainVFCredit                   | `number`                 |                          |                                                              |
| killBatGainVFCredit                     | `number`                 |                          |                                                              |
| killWicklineGainVFCredit                | `number`                 |                          |                                                              |
| killAlphaGainVFCredit                   | `number`                 |                          |                                                              |
| killItemBountyGainVFCredit              | `number`                 |                          |                                                              |
| killDroneGainVFCredit                   | `number`                 |                          |                                                              |
| killGammaGainVFCredit                   | `number`                 |                          |                                                              |
| killTurretGainVFCredit                  | `number`                 |                          |                                                              |
| itemShredderGainVFCredit                | `number`                 |                          |                                                              |
| totalUseVFCredit                        | `number`                 |                          |                                                              |
| remoteDroneUseVFCreditMySelf            | `number`                 |                          |                                                              |
| remoteDroneUseVFCreditAlly              | `number`                 |                          |                                                              |
| transferConsoleFromMaterialUseVFCredit  | `number`                 |                          |                                                              |
| transferConsoleFromEscapeKeyUseVFCredit | `number`                 |                          |                                                              |
| transferConsoleFromRevivalUseVFCredit   | `number`                 |                          |                                                              |
| tacticalSkillUpgradeUseVFCredit         | `number`                 |                          |                                                              |
| infusionReRollUseVFCredit               | `number`                 |                          |                                                              |
| infusionTraitUseVFCredit                | `number`                 |                          |                                                              |
| infusionRelicUseVFCredit                | `number`                 |                          |                                                              |
| infusionStoreUseVFCredit                | `number`                 |                          |                                                              |
| teamElimination                         | `number`                 |                          |                                                              |
| teamDown                                | `number`                 |                          |                                                              |
| teamBattleZoneDown                      | `number`                 |                          |                                                              |
| teamRepeatDown                          | `number`                 |                          |                                                              |
| adaptiveForce                           | `number`                 |                          |                                                              |
| adaptiveForceAttack                     | `number`                 |                          |                                                              |
| adaptiveForceAmplify                    | `number`                 |                          |                                                              |
| skillAmp                                | `number`                 |                          |                                                              |
| campFireCraftUncommon                   | `number`                 |                          |                                                              |
| campFireCraftRare                       | `number`                 |                          |                                                              |
| campFireCraftEpic                       | `number`                 |                          |                                                              |
| campFireCraftLegendary                  | `number`                 |                          |                                                              |
| cobaltRandomPickRemoveCharacter         | `number`                 |                          |                                                              |
| tacticalSkillUseCount                   | `number`                 |                          |                                                              |
| creditRevivalCount                      | `number`                 |                          |                                                              |
| creditRevivedOthersCount                | `number`                 |                          |                                                              |
| timeSpentInBriefingRoom                 | `number`                 |                          |                                                              |
| IsLeavingBeforeCreditRevivalTerminate   | `boolean`                |                          |                                                              |
| crGetAnimal                             | `number`                 |                          |                                                              |
| crGetMutant                             | `number`                 |                          |                                                              |
| crGetPhaseStart                         | `number`                 |                          |                                                              |
| crGetKill                               | `number`                 |                          |                                                              |
| crGetAssist                             | `number`                 |                          |                                                              |
| crGetTimeElapsed                        | `number`                 |                          |                                                              |
| crGetCreditBonus                        | `number`                 |                          |                                                              |
| crUseRemoteDrone                        | `number`                 |                          |                                                              |
| crUseUpgradeTacticalSkill               | `number`                 |                          |                                                              |
| crUseTreeOfLife                         | `number`                 |                          |                                                              |
| crUseMeteorite                          | `number`                 |                          |                                                              |
| crUseMythril                            | `number`                 |                          |                                                              |
| crUseForceCore                          | `number`                 |                          |                                                              |
| crUseVFBloodSample                      | `number`                 |                          |                                                              |
| crUseActivationModule                   | `number`                 |                          |                                                              |
| crUseRootkit                            | `number`                 |                          |                                                              |
| mmrGainInGame                           | `number`                 |                          |                                                              |
| mmrLossEntryCost                        | `number`                 |                          |                                                              |
| premadeMatchingType                     | `number`                 |                          |                                                              |
| viewContribution                        | `number`                 |                          |                                                              |
| useReconDrone                           | `number`                 |                          |                                                              |
| useEmpDrone                             | `number`                 |                          |                                                              |
| exceptPreMadeTeam                       | `boolean`                |                          |                                                              |
| terminateCount                          | `number`                 |                          |                                                              |
| clutchCount                             | `number`                 |                          |                                                              |
| unknownKill                             | `number`                 |                          |                                                              |
| mainWeather                             | `number`                 |                          |                                                              |
| subWeather                              | `number`                 |                          |                                                              |
| activeInstallation                      | `object`                 |                          |                                                              |
| useGuideRobot                           | `number`                 |                          |                                                              |
| guideRobotRadial                        | `number`                 |                          |                                                              |
| guideRobotFlagShip                      | `number`                 |                          |                                                              |
| guideRobotSignature                     | `number`                 |                          |                                                              |
| crGetByGuideRobot                       | `number`                 |                          |                                                              |
| damageToGuideRobot                      | `number`                 |                          |                                                              |
| getBuffCubeRed                          | `number`                 |                          |                                                              |
| getBuffCubePurple                       | `number`                 |                          |                                                              |
| getBuffCubeGreen                        | `number`                 |                          |                                                              |
| getBuffCubeGold                         | `number`                 |                          |                                                              |
| getBuffCubeSkyBlue                      | `number`                 |                          |                                                              |
| sumGetBuffCube                          | `number`                 |                          |                                                              |
| isLeavingBeforeCreditRevivalTerminate   | `boolean`                |                          |                                                              |

##### `matchingMode` 枚举

| 枚举 | 比赛类型 |
| ---- | -------- |
| 2    | 一般     |
| 3    | 排位     |
| 6    | 钴模式   |

##### `bestWeapon` 枚举

| 枚举 | 武器类型 |
| ---- | -------- |
| 1    |          |
| 2    |          |
| 3    |          |
| 4    |          |
| 5    |          |
| 6    | 斧头     |
|      |          |
|      |          |

##### `masteryLevel` 对象

| 字段 | 类型     | 内容            | 备注 |
| ---- | -------- | --------------- | ---- |
| 14   | `number` | 武器 熟练度等级 |      |
| 101  | `number` | 制作 熟练度等级 |      |
| 102  | `number` | 探索 熟练度等级 |      |
| 103  | `number` | 移动 熟练度等级 |      |
| 201  | `number` | 防御 熟练度等级 |      |
| 202  | `number` | 狩猎 熟练度等级 |      |

