import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";

import { RewardOverlay } from "./components/RewardOverlay.jsx";
import { GameRuntime } from "./GameRuntime.jsx";
import { selectEngineScene } from "./runtime/sceneSelection.js";
import { useGameStore } from "./store/useGameStore.js";
import { SCENES } from "../game/constants.js";

const SCENE_LABELS = {
  [SCENES.MAP]: "Mapa",
  [SCENES.BATTLE]: "Walka",
  [SCENES.REWARD]: "Nagroda",
  [SCENES.SHOP]: "Sklep",
  [SCENES.GAME_OVER]: "Koniec",
  [SCENES.RUN_COMPLETE]: "Zwyciestwo"
};

function setText(selector, value) {
  const target = document.querySelector(selector);
  if (target) {
    target.textContent = value;
  }
}

function ShellStatusSync() {
  const game = useGameStore((state) => state.game);

  useEffect(() => {
    setText("[data-game-message]", game.ui?.message ?? "");
    setText("[data-game-scene]", SCENE_LABELS[game.scene] ?? game.scene);
    setText("[data-game-status-node]", game.run?.currentNodeId ?? "start");
    setText("[data-game-node]", game.run?.currentNodeId ?? "start");
    setText("[data-game-health]", `${game.run?.health ?? 0} / ${game.run?.maxHealth ?? 0}`);
    setText("[data-game-status-health]", `${game.run?.health ?? 0} / ${game.run?.maxHealth ?? 0}`);
  }, [game]);

  return null;
}

function MapRouteActions() {
  const game = useGameStore((state) => state.game);
  const selectNode = useGameStore((state) => state.selectNode);

  if (selectEngineScene(game) !== "map") {
    return null;
  }

  const offeredNodeIds = new Set(game.run?.offeredNodeIds ?? []);
  const offeredNodes = (game.map?.nodes ?? []).filter((node) => offeredNodeIds.has(node.id));

  if (offeredNodes.length === 0) {
    return null;
  }

  return (
    <div className="map-route-actions" aria-label="Dostepne szlaki">
      {offeredNodes.map((node) => (
        <button key={node.id} type="button" className="map-route-actions__btn" onClick={() => selectNode(node.id)}>
          <span className="map-route-actions__type">{node.type}</span>
          <span className="map-route-actions__label">{node.label ?? node.id}</span>
        </button>
      ))}
    </div>
  );
}

export function KurczokerCanvas() {
  return (
    <>
      <Canvas
        aria-label="KURCZOKER game canvas"
        className="kurczoker-r3f"
        orthographic
        role="img"
        camera={{ position: [0, 0, 10], zoom: 72, near: 0.1, far: 100 }}
        gl={{ antialias: false, alpha: true }}
      >
        <GameRuntime />
      </Canvas>
      <MapRouteActions />
      <RewardOverlay />
      <ShellStatusSync />
    </>
  );
}

export default KurczokerCanvas;
