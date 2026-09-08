export const ABILITY_COPY = {
  "egg-bomb": {
    name: "Jajobomba",
    icon: "◉",
    description: "Łukowy rzut. Eksplozja zadaje 2 obrażenia.",
    action: "Rzuć jajobombę",
  },
  "crest-jump": {
    name: "Skrzydlaty skok",
    icon: "↟",
    description: "Wysoki skok i unik następnego trafienia.",
    action: "Wykonaj skok",
  },
  "guard-chick": {
    name: "Pisklak strażnik",
    icon: "♜",
    description: "Osłania przed następnym trafieniem.",
    action: "Przywołaj strażnika",
  },
  "mana-grain": {
    name: "Magiczne ziarno",
    icon: "✦",
    description: "Odnawia 1 HP. Następna bomba zada +1 obrażenie.",
    action: "Użyj ziarna",
  },
};
export const REWARD_COPY = {
  ...ABILITY_COPY,
  "crest-crown": {
    name: "Korona grzebienia",
    icon: "♛",
    description: "+1 maksymalnego HP i +1 zdrowia.",
  },
  "wind-boots": {
    name: "Buty wichru",
    icon: "➶",
    description: "Szybszy ruch w każdej następnej walce.",
  },
  "chaos-egg": {
    name: "Jajo chaosu",
    icon: "◉",
    description: "Każda jajobomba zadaje +1 obrażenie.",
  },
  "golden-grain-ring": {
    name: "Złote ziarno",
    icon: "✧",
    description: "Otrzymujesz 6 ziaren na zakupy.",
  },
  "prophet-hen": {
    name: "Kura wyrocznia",
    icon: "☼",
    description: "Większy wybór nagród po walce.",
  },
  "shell-shield": {
    name: "Pancerna skorupa",
    icon: "⬡",
    description: "Blokuje pierwsze trafienie w każdej walce.",
  },
  "heal-small": {
    name: "Bojowy rosół",
    icon: "♥",
    description: "Odnawia utracone zdrowie.",
  },
  "gold-small": {
    name: "Sakiewka ziaren",
    icon: "✧",
    description: "Ziarna do wydania u straganiarki.",
  },
  "grain-guard": {
    name: "Pisklak na straży",
    icon: "♜",
    description: "Osłona przed jednym trafieniem w następnej walce.",
  },
};
export const ROUTE_COPY = {
  battle: ["⚔", "Potyczka", "Ruszaj do walki"],
  elite: ["♜", "Elitarny kogut", "Podejmij wyzwanie"],
  shop: ["✧", "Stragan nioski", "Odwiedź stragan"],
  treasure: ["◈", "Ukryty skarb", "Otwórz skrzynię"],
  boss: ["♛", "Jajokról", "Zmierz się z Jajokrólem"],
};
