import { Canvas } from "@react-three/fiber";

import { GameRuntime } from "./GameRuntime.jsx";
import { selectEngineScene } from "./runtime/sceneSelection.js";
import { useGameStore } from "./store/useGameStore.js";

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
    </>
  );
}

export default KurczokerCanvas;
