import { CameraRig } from "./components/CameraRig.jsx";
import { SceneLights } from "./components/SceneLights.jsx";
import { selectEngineScene } from "./runtime/sceneSelection.js";
import { useGameStore } from "./store/useGameStore.js";

const SCENE_PLACEHOLDERS = {
  map: { color: "#f2c15b", position: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
  battle: { color: "#d95f43", position: [0, -0.15, 0], scale: [2.4, 1.1, 0.45] },
  reward: { color: "#58b368", position: [0, 0.1, 0], scale: [1.45, 1.9, 0.35] },
  end: { color: "#7c6f9e", position: [0, 0, 0], scale: [2, 1.35, 0.3] }
};

function ScenePlaceholder({ engineScene }) {
  const placeholder = SCENE_PLACEHOLDERS[engineScene] ?? SCENE_PLACEHOLDERS.map;

  return (
    <mesh rotation={[0.45, 0.65, 0]} position={placeholder.position} scale={placeholder.scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={placeholder.color} roughness={0.42} metalness={0.08} />
    </mesh>
  );
}

export function GameRuntime() {
  const game = useGameStore((state) => state.game);
  const engineScene = selectEngineScene(game);

  return (
    <>
      <color attach="background" args={["#7fc8f8"]} />
      <SceneLights />
      <CameraRig />
      <ScenePlaceholder engineScene={engineScene} />
    </>
  );
}
