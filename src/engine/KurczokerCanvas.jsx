import { Canvas } from "@react-three/fiber";

import { GameRuntime } from "./GameRuntime.jsx";

export function KurczokerCanvas() {
  return (
    <Canvas
      className="kurczoker-r3f"
      orthographic
      camera={{ position: [0, 0, 10], zoom: 72, near: 0.1, far: 100 }}
      gl={{ antialias: false, alpha: true }}
    >
      <GameRuntime />
    </Canvas>
  );
}

export default KurczokerCanvas;
