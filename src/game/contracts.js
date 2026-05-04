/**
 * @typedef {Object} MapNode
 * @property {string} id
 * @property {string} type
 * @property {string} label
 * @property {number} depth
 * @property {string[]} nextNodeIds
 * @property {{ encounterId?: string, rewardTier?: number }} payload
 */

/**
 * @typedef {Object} TerrainPlatform
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} TerrainHazard
 * @property {string} id
 * @property {"spikes"|"fire"|"pit"} type
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} damage
 */

/**
 * @typedef {Object} Actor
 * @property {string} id
 * @property {"player"|"enemy"|"summon"} kind
 * @property {"player"|"enemy"} team
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} width
 * @property {number} height
 * @property {number} health
 * @property {number} maxHealth
 * @property {number} ttl
 */

/**
 * @typedef {Object} Ability
 * @property {string} id
 * @property {string} label
 * @property {"projectile"|"movement"|"summon"|"buff"} kind
 * @property {number} damage
 * @property {number} radius
 * @property {number} cooldown
 */

/**
 * @typedef {Object} Reward
 * @property {string} id
 * @property {"artifact"|"ability"|"heal"|"gold"} type
 * @property {string} label
 * @property {number} value
 */

/**
 * @typedef {Object} BattleConfig
 * @property {string} encounterId
 * @property {Actor[]} actors
 * @property {TerrainPlatform[]} platforms
 * @property {TerrainHazard[]} hazards
 * @property {number} turnDurationMs
 */

/**
 * @typedef {Object} InputSnapshot
 * @property {-1|0|1} moveX
 * @property {boolean} jump
 * @property {{x:number,y:number}} aim
 * @property {boolean} firePressed
 * @property {string} selectedAbilityId
 */

export const contractVersion = "2026-05-04";
