import { CameraRig } from "./components/CameraRig.jsx";
import { SceneLights } from "./components/SceneLights.jsx";

export function GameRuntime() {
  return (
    <>
      <color attach="background" args={["#7fc8f8"]} />
      <SceneLights />
      <CameraRig />
      <mesh rotation={[0.45, 0.65, 0]} position={[0, 0, 0]}>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial color="#f2c15b" roughness={0.42} metalness={0.08} />
      </mesh>
    </>
  );
}
