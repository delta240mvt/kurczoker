export const CANVAS = {
  WIDTH: 960,
  HEIGHT: 540,
  GROUND_Y: 430
};

export const SCENES = {
  MAP: "map",
  BATTLE: "battle",
  REWARD: "reward",
  SHOP: "shop",
  GAME_OVER: "game-over",
  RUN_COMPLETE: "run-complete"
};

export const NODE_TYPES = {
  START: "start",
  BATTLE: "battle",
  ELITE: "elite",
  TREASURE: "treasure",
  SHOP: "shop",
  BOSS: "boss"
};

export const BATTLE_PHASES = {
  PLAYER_TURN: "player-turn",
  PROJECTILE: "projectile",
  ENEMY_TURN: "enemy-turn",
  WON: "won",
  LOST: "lost"
};

export const ACTOR_TEAMS = {
  PLAYER: "player",
  ENEMY: "enemy"
};

export const ACTOR_KINDS = {
  PLAYER: "player",
  ENEMY: "enemy",
  SUMMON: "summon"
};

export const ABILITY_IDS = {
  EGG_BOMB: "egg-bomb",
  CREST_JUMP: "crest-jump",
  GUARD_CHICK: "guard-chick",
  MANA_GRAIN: "mana-grain"
};

export const ARTIFACT_IDS = {
  CREST_CROWN: "crest-crown",
  WIND_BOOTS: "wind-boots",
  CHAOS_EGG: "chaos-egg",
  GOLDEN_GRAIN_RING: "golden-grain-ring",
  PROPHET_HEN: "prophet-hen",
  SHELL_SHIELD: "shell-shield"
};

export const TUNING = {
  PLAYER_TURN_MS: 8000,
  ENEMY_TURN_MS: 900,
  GRAVITY: 0.00145,
  PROJECTILE_SPEED: 0.58,
  PLAYER_SPEED: 0.22,
  JUMP_VELOCITY: -0.62,
  GROUND_FRICTION: 0.82,
  RUN_HEALTH: 3
};
