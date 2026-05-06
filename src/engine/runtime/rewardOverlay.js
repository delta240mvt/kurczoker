import { createUiModel } from "../../game/ui.js";
import { SCENES } from "../../game/constants.js";

export function getRewardOverlayModel(game) {
  if (!game || (game.scene !== SCENES.REWARD && game.scene !== SCENES.SHOP)) {
    return null;
  }

  const overlay = createUiModel(game).overlay;
  if (!overlay || (overlay.type !== "reward" && overlay.type !== "shop")) {
    return null;
  }

  return {
    ...overlay,
    title: overlay.type === "shop" ? "Stragan nioski" : game.rewardMode === "treasure" ? "Skarb wyprawy" : "Wybierz nagrode",
    subtitle:
      overlay.type === "shop"
        ? "Wydaj ziarna na stale wzmocnienie."
        : "Jedna karta przejdzie z Toba dalej.",
    cards: overlay.cards.map((card, index) => ({
      ...card,
      selected: index === 0
    }))
  };
}
