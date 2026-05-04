import { ABILITY_IDS, ARTIFACT_IDS } from "./constants.js";

const ABILITIES = [
  {
    id: ABILITY_IDS.EGG_BOMB,
    label: "Egg Bomb",
    kind: "projectile",
    damage: 2,
    radius: 42,
    cooldown: 1,
    description: "Arcing egg shot that bursts on impact."
  },
  {
    id: ABILITY_IDS.CREST_JUMP,
    label: "Crest Jump",
    kind: "movement",
    damage: 0,
    radius: 0,
    cooldown: 2,
    impulse: -0.78,
    description: "A sharp leap for better firing angles."
  },
  {
    id: ABILITY_IDS.GUARD_CHICK,
    label: "Guard Chick",
    kind: "summon",
    damage: 1,
    radius: 28,
    cooldown: 3,
    summonType: "guard-chick",
    summonTtl: 3,
    description: "Calls a short-lived chick blocker."
  },
  {
    id: ABILITY_IDS.MANA_GRAIN,
    label: "Mana Grain",
    kind: "buff",
    damage: 0,
    radius: 36,
    cooldown: 2,
    mana: 1,
    description: "Restores tempo for the next trick."
  }
];

const ARTIFACTS = [
  {
    id: ARTIFACT_IDS.CREST_CROWN,
    label: "Crest Crown",
    effect: { maxHealth: 1, heal: 1 }
  },
  {
    id: ARTIFACT_IDS.WIND_BOOTS,
    label: "Wind Boots",
    effect: { stat: "moveSpeedBonus", value: 0.06 }
  },
  {
    id: ARTIFACT_IDS.CHAOS_EGG,
    label: "Chaos Egg",
    effect: { stat: "eggBombDamageBonus", value: 1 }
  },
  {
    id: ARTIFACT_IDS.GOLDEN_GRAIN_RING,
    label: "Golden Grain Ring",
    effect: { gold: 6 }
  },
  {
    id: ARTIFACT_IDS.PROPHET_HEN,
    label: "Prophet Hen",
    effect: { stat: "rewardChoiceBonus", value: 1 }
  },
  {
    id: ARTIFACT_IDS.SHELL_SHIELD,
    label: "Shell Shield",
    effect: { stat: "damageReduction", value: 1 }
  }
];

export function getAbilityById(id) {
  return ABILITIES.find((ability) => ability.id === id) ?? null;
}

export function getArtifactById(id) {
  return ARTIFACTS.find((artifact) => artifact.id === id) ?? null;
}

export function getRewardChoices(seed = 1, runState = {}) {
  const ownedAbilities = new Set(runState.abilities ?? []);
  const ownedArtifacts = new Set(runState.artifacts ?? []);
  const choiceCount = 3 + (runState.stats?.rewardChoiceBonus ?? 0);
  const rewards = [
    ...ABILITIES.filter((ability) => !ownedAbilities.has(ability.id)).map((ability) => ({
      id: ability.id,
      type: "ability",
      label: ability.label,
      value: 1
    })),
    ...ARTIFACTS.filter((artifact) => !ownedArtifacts.has(artifact.id)).map((artifact) => ({
      id: artifact.id,
      type: "artifact",
      label: artifact.label,
      value: 1
    })),
    { id: "heal-small", type: "heal", label: "Warm Broth", value: 1 },
    { id: "gold-small", type: "gold", label: "Grain Purse", value: 5 }
  ];

  return rewards
    .map((reward) => ({ reward, order: seededOrder(seed, reward.id) }))
    .sort((left, right) => left.order - right.order || left.reward.id.localeCompare(right.reward.id))
    .slice(0, choiceCount)
    .map(({ reward }) => reward);
}

export function applyReward(runState, reward) {
  if (!reward) {
    return runState;
  }

  if (reward.type === "ability") {
    if (!getAbilityById(reward.id) || (runState.abilities ?? []).includes(reward.id)) {
      return cloneRunState(runState);
    }

    return {
      ...runState,
      abilities: [...(runState.abilities ?? []), reward.id]
    };
  }

  if (reward.type === "artifact") {
    const artifact = getArtifactById(reward.id);
    const artifacts = runState.artifacts ?? [];

    if (!artifact || artifacts.includes(reward.id)) {
      return cloneRunState(runState);
    }

    return applyArtifactEffect(
      {
        ...runState,
        artifacts: [...artifacts, reward.id],
        stats: { ...(runState.stats ?? {}) }
      },
      artifact
    );
  }

  if (reward.type === "heal") {
    const maxHealth = runState.maxHealth ?? runState.health ?? 0;

    return {
      ...runState,
      health: Math.min(maxHealth, (runState.health ?? 0) + (reward.value ?? 1))
    };
  }

  if (reward.type === "gold") {
    return {
      ...runState,
      gold: (runState.gold ?? 0) + (reward.value ?? 0)
    };
  }

  if (reward.type === "summon") {
    return {
      ...runState,
      temporarySummons: [
        ...(runState.temporarySummons ?? []),
        { type: reward.id, ttl: reward.value ?? 1 }
      ]
    };
  }

  return cloneRunState(runState);
}

function applyArtifactEffect(runState, artifact) {
  const effect = artifact.effect;
  let next = runState;

  if (effect.maxHealth) {
    next = {
      ...next,
      maxHealth: (next.maxHealth ?? 0) + effect.maxHealth,
      health: (next.health ?? 0) + (effect.heal ?? 0)
    };
  }

  if (effect.gold) {
    next = {
      ...next,
      gold: (next.gold ?? 0) + effect.gold
    };
  }

  if (effect.stat) {
    next = {
      ...next,
      stats: {
        ...(next.stats ?? {}),
        [effect.stat]: ((next.stats ?? {})[effect.stat] ?? 0) + effect.value
      }
    };
  }

  return next;
}

function cloneRunState(runState) {
  return {
    ...runState,
    abilities: runState.abilities ? [...runState.abilities] : runState.abilities,
    artifacts: runState.artifacts ? [...runState.artifacts] : runState.artifacts,
    temporarySummons: runState.temporarySummons
      ? runState.temporarySummons.map((summon) => ({ ...summon }))
      : runState.temporarySummons,
    stats: runState.stats ? { ...runState.stats } : runState.stats
  };
}

function seededOrder(seed, id) {
  let hash = Number(seed) || 1;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return hash;
}
