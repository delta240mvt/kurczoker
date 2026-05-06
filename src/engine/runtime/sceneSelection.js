import { SCENES } from "../../game/constants.js";

export function selectEngineScene(game) {
  if (game.scene === SCENES.BATTLE) return "battle";
  if (game.scene === SCENES.REWARD || game.scene === SCENES.SHOP) return "reward";
  if (game.scene === SCENES.GAME_OVER || game.scene === SCENES.RUN_COMPLETE) return "end";
  return "map";
}
