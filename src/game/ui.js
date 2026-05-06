import { ABILITY_IDS, BATTLE_PHASES, NODE_TYPES, SCENES } from "./constants.js";
import { getAbilityById } from "./abilities.js";

const ICONS = {
  ability: "icon-ability-bomb.svg",
  audio: "icon-audio-note.svg",
  coin: "icon-grain-coin.svg",
  heart: "icon-hp-heart.svg",
  jump: "icon-jump.svg",
  node: "icon-node.svg",
  scene: "icon-scene-book.svg",
  shield: "icon-shield.svg"
};

const PATH_HINTS = [
  {
    icon: ICONS.scene,
    tone: "gold",
    title: "Trasa",
    desc: "Planuj trasę i odkrywaj różne ścieżki."
  },
  {
    icon: ICONS.coin,
    tone: "gold",
    title: "Nagrody",
    desc: "Skrzynie i sklepy oferują cenne nagrody."
  },
  {
    icon: ICONS.heart,
    tone: "red",
    title: "Ryzyko",
    desc: "Elitarni wrogowie i boss to większe nagrody, ale i większe ryzyko."
  }
];

const LANDING_HINTS = [
  {
    icon: ICONS.node,
    tone: "gold",
    title: "Wybierz ścieżkę",
    desc: "Każda decyzja prowadzi do nowych wyzwań i nagród."
  },
  {
    icon: ICONS.ability,
    tone: "blue",
    title: "Rzuć jajem",
    desc: "Precyzja, kąt i siła są kluczem do zwycięstwa."
  },
  {
    icon: ICONS.coin,
    tone: "gold",
    title: "Zbieraj nagrody",
    desc: "Odkrywaj artefakty, wzmacniaj zdolności i jajo-moce."
  },
  {
    icon: ICONS.heart,
    tone: "red",
    title: "Pokonaj bossa",
    desc: "Dotrzyj do końca wyprawy i zgarnij chwałę."
  }
];

const ABILITY_HINTS = [
  {
    icon: ICONS.ability,
    tone: "blue",
    title: "Egg Bomb",
    desc: "Rzuć bombą jajeczną i traf w słaby punkt wroga."
  },
  {
    icon: ICONS.jump,
    tone: "green",
    title: "Skok",
    desc: "Zmień pozycję i zyskaj lepszy kąt ataku."
  },
  {
    icon: ICONS.shield,
    tone: "blue",
    title: "Pancerz",
    desc: "Przygotuj obronę przed następnym ciosem."
  }
];

const ENEMY_HINTS = [
  {
    icon: ICONS.heart,
    tone: "red",
    title: "Odpowiedź",
    desc: "Przeciwnik kontruje po Twojej akcji."
  },
  {
    icon: ICONS.jump,
    tone: "green",
    title: "Pozycja",
    desc: "Unikaj zagrożeń i trzymaj dystans."
  },
  {
    icon: ICONS.ability,
    tone: "blue",
    title: "Tempo",
    desc: "Kolejna tura wróci, gdy animacja dobiegnie końca."
  },
  {
    icon: ICONS.coin,
    tone: "gold",
    title: "Nagroda",
    desc: "Wygrana walka otworzy wybór wzmocnień."
  }
];

const BOSS_HINTS = [
  {
    icon: ICONS.ability,
    tone: "blue",
    title: "Egg Bomb",
    desc: "Celuj w głowę bossa i pilnuj łuku lotu."
  },
  {
    icon: ICONS.jump,
    tone: "gold",
    title: "Mocny Rzut",
    desc: "Większe ryzyko, mocniejsze uderzenie."
  },
  {
    icon: ICONS.shield,
    tone: "red",
    title: "Twarda Skorupa",
    desc: "Obrona pomaga przetrwać finałową odpowiedź."
  }
];

const DEFEAT_HINTS = [
  {
    icon: ICONS.ability,
    tone: "blue",
    title: "Jeszcze raz",
    desc: "Restart daje nową mapę i nową kolejność nagród."
  },
  {
    icon: ICONS.node,
    tone: "gold",
    title: "Inna ścieżka",
    desc: "Czasem sklep jest lepszy niż szybka walka."
  },
  {
    icon: ICONS.coin,
    tone: "gold",
    title: "Ziarna",
    desc: "Zbieraj je przed trudniejszymi węzłami."
  },
  {
    icon: ICONS.shield,
    tone: "red",
    title: "Obrona",
    desc: "Artefakty potrafią uratować wyprawę."
  }
];

export function createUiModel(state = {}, input = {}) {
  const run = state.run ?? {};
  const ui = state.ui ?? {};
  const scene = state.scene ?? SCENES.MAP;
  const abilityId = input.selectedAbilityId ?? ui.selectedAbilityId ?? run.abilities?.[0] ?? ABILITY_IDS.EGG_BOMB;
  const ability = getAbilityById(abilityId) ?? getAbilityById(ABILITY_IDS.EGG_BOMB);
  const health = `${run.health ?? 0} / ${run.maxHealth ?? 0}`;
  const sceneLabel = getSceneLabel(state);
  const statusAbility = ability?.label ?? abilityId;
  const isShop = scene === SCENES.SHOP;

  const model = {
    scene,
    sceneLabel,
    canvasBackdrop: getBackdrop(state),
    actionDisabled: isActionDisabled(state),
    topHud: [
      { key: "health", label: "HP", value: health, icon: ICONS.heart },
      { key: "node", label: "Węzeł", value: run.currentNodeId ?? "start", icon: ICONS.node },
      { key: "scene", label: "Scena", value: sceneLabel, icon: ICONS.scene },
      isShop
        ? { key: "gold", label: "Ziarna", value: String(run.gold ?? 0), icon: ICONS.coin }
        : { key: "ability", label: "Zdolność", value: abilityId, icon: ICONS.ability }
    ],
    status: [
      { key: "health", label: "HP", value: health, icon: ICONS.heart },
      { key: "node", label: "Węzeł", value: run.currentNodeId ?? "start", icon: ICONS.node },
      isShop
        ? { key: "gold", label: "Ziarna", value: String(run.gold ?? 0), icon: ICONS.coin }
        : { key: "action", label: "Akcja", value: statusAbility, icon: ICONS.ability },
      { key: "audio", label: "Audio", value: ui.muted ? "cisza" : "muzyka", icon: ICONS.audio }
    ],
    ribbon: getRibbon(state),
    hints: getHints(state),
    boss: getBossModel(state),
    overlay: getOverlay(state),
    statusVariant: scene === SCENES.GAME_OVER ? "dead" : scene === SCENES.RUN_COMPLETE ? "victory" : ""
  };

  return model;
}

function getSceneLabel(state) {
  if (state.scene === SCENES.BATTLE && state.battle?.type === NODE_TYPES.BOSS) return "Boss";
  if (state.scene === SCENES.BATTLE) return "Walka";
  if (state.scene === SCENES.REWARD) return state.rewardMode === "treasure" ? "Skarb" : "Nagroda";
  if (state.scene === SCENES.SHOP) return "Sklep";
  if (state.scene === SCENES.GAME_OVER) return "Koniec";
  if (state.scene === SCENES.RUN_COMPLETE) return "Zwycięstwo";
  return "Mapa";
}

function getBackdrop(state) {
  if (state.scene === SCENES.BATTLE && state.battle?.type === NODE_TYPES.BOSS) return "08";
  if (state.scene === SCENES.BATTLE) {
    return state.battle?.phase === BATTLE_PHASES.PLAYER_TURN ? "03" : "04";
  }
  if (state.scene === SCENES.REWARD) return state.rewardMode === "treasure" ? "07" : "05";
  if (state.scene === SCENES.SHOP) return "06";
  if (state.scene === SCENES.GAME_OVER) return "09";
  if (state.scene === SCENES.RUN_COMPLETE) return "10";
  return "02";
}

function isActionDisabled(state) {
  if (state.scene === SCENES.BATTLE) return state.battle?.phase !== BATTLE_PHASES.PLAYER_TURN;
  if (state.scene === SCENES.REWARD) return true;
  return false;
}

function getRibbon(state) {
  const message = state.ui?.message;
  if (state.scene === SCENES.BATTLE && state.battle?.type === NODE_TYPES.BOSS) {
    const boss = getBossModel(state);
    return {
      text: message ?? `Tura gracza — boss HP ${boss?.health ?? 0}/${boss?.maxHealth ?? 0}. Atak!`,
      variant: "danger"
    };
  }
  if (state.scene === SCENES.BATTLE && state.battle?.phase !== BATTLE_PHASES.PLAYER_TURN) {
    return { text: message ?? "Eksplozja trafiona. Przeciwnik odpowiada.", variant: "" };
  }
  if (state.scene === SCENES.REWARD) {
    return { text: message ?? "Wybierz nagrodę za pokonanie wroga!", variant: "" };
  }
  if (state.scene === SCENES.SHOP) {
    return { text: message ?? "Kup wzmocnienie albo ruszaj dalej.", variant: "" };
  }
  if (state.scene === SCENES.GAME_OVER) {
    return { text: message ?? "Koniec wyprawy.", variant: "danger" };
  }
  if (state.scene === SCENES.RUN_COMPLETE) {
    return { text: message ?? "KURCZOKER pokonany.", variant: "victory" };
  }
  return { text: message ?? "Wybierz kolejną ścieżkę.", variant: "" };
}

function getHints(state) {
  if (state.scene === SCENES.BATTLE && state.battle?.type === NODE_TYPES.BOSS) return BOSS_HINTS;
  if (state.scene === SCENES.BATTLE) {
    return state.battle?.phase === BATTLE_PHASES.PLAYER_TURN ? ABILITY_HINTS : ENEMY_HINTS;
  }
  if (state.scene === SCENES.GAME_OVER) return DEFEAT_HINTS;
  if (state.scene === SCENES.RUN_COMPLETE || state.scene === SCENES.REWARD || state.scene === SCENES.SHOP) return [];
  return PATH_HINTS;
}

function getBossModel(state) {
  if (state.scene !== SCENES.BATTLE || state.battle?.type !== NODE_TYPES.BOSS) return null;
  const boss = state.battle?.actors?.find((actor) => actor.id?.includes("boss") || actor.kind === "enemy");
  const maxHealth = boss?.maxHealth ?? boss?.health ?? 1;
  const health = Math.max(0, boss?.health ?? maxHealth);
  return {
    name: "KURCZOKER BOSS",
    health,
    maxHealth,
    percent: Math.round((health / Math.max(1, maxHealth)) * 100)
  };
}

function getOverlay(state) {
  if (state.scene === SCENES.REWARD) {
    return {
      type: "reward",
      cta: state.rewardMode === "treasure" ? "Weź nagrodę" : "",
      cards: (state.rewardChoices ?? []).map(toRewardCard)
    };
  }

  if (state.scene === SCENES.SHOP) {
    return {
      type: "shop",
      cards: (state.shopOffers ?? []).map((offer) => ({
        ...toRewardCard(offer),
        price: offer.price ?? 0,
        affordable: (state.run?.gold ?? 0) >= (offer.price ?? 0)
      }))
    };
  }

  if (state.scene === SCENES.GAME_OVER || state.scene === SCENES.RUN_COMPLETE) {
    const victory = state.scene === SCENES.RUN_COMPLETE;
    return {
      type: "end",
      title: victory ? "WYPRAWA UKOŃCZONA" : "KONIEC WYPRAWY",
      eyebrow: victory ? "KURCZOKER pokonany" : "Kurza kronika zapisuje porażkę",
      variant: victory ? "victory" : "danger",
      cta: "Nowa wyprawa",
      stats: [
        { key: "nodes", label: "Węzły", value: String(state.run?.completedNodeIds?.length ?? 0) },
        { key: "gold", label: "Ziarna", value: String(state.run?.gold ?? 0) },
        {
          key: "artifacts",
          label: victory ? "Artefakty" : "Walki",
          value: String(victory ? state.run?.artifacts?.length ?? 0 : countBattleNodes(state.run?.completedNodeIds ?? []))
        }
      ]
    };
  }

  return null;
}

function toRewardCard(reward) {
  return {
    id: reward.id,
    type: reward.type,
    name: reward.label ?? reward.id,
    typeLabel: typeLabel(reward.type),
    desc: reward.description ?? descriptionFor(reward),
    valueLabel: valueLabel(reward),
    icon: iconFor(reward),
    tone: toneFor(reward)
  };
}

function typeLabel(type) {
  if (type === "ability") return "Zdolność";
  if (type === "artifact") return "Artefakt";
  if (type === "heal") return "Leczenie";
  if (type === "gold") return "Ziarna";
  if (type === "summon") return "Przywołanie";
  return "Nagroda";
}

function valueLabel(reward) {
  if (reward.valueLabel) return reward.valueLabel;
  if (reward.type === "heal") return `+${reward.value ?? 1} HP`;
  if (reward.type === "gold") return `+${reward.value ?? 0}`;
  if (reward.type === "ability") return "+1";
  if (reward.type === "artifact") return "PASSIVE";
  return `+${reward.value ?? 1}`;
}

function descriptionFor(reward) {
  if (reward.type === "heal") return "Przywraca punkt HP na miejscu.";
  if (reward.type === "gold") return "Dodaje ziarna do sakiewki wyprawy.";
  if (reward.type === "artifact") return "Pasywny efekt działa do końca wyprawy.";
  if (reward.type === "ability") return getAbilityById(reward.id)?.description ?? "Nowa akcja do użycia w walce.";
  return "Wzmocnienie gotowe do użycia.";
}

function iconFor(reward) {
  if (reward.type === "heal") return "heart";
  if (reward.type === "gold") return "coin";
  if (reward.type === "artifact") return "shield";
  if (reward.id === ABILITY_IDS.CREST_JUMP) return "jump";
  return "egg";
}

function toneFor(reward) {
  if (reward.type === "heal") return "red";
  if (reward.type === "gold") return "gold";
  if (reward.type === "artifact") return "blue";
  return "gold";
}

function countBattleNodes(completedNodeIds) {
  return completedNodeIds.filter((id) => id.includes("battle") || id.includes("elite") || id.includes("boss")).length;
}
