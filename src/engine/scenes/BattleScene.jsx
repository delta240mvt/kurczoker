import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { World } from "../tactical/World.jsx";
import { Chicken } from "../tactical/Chicken.jsx";
import { ShotVisual, ImpactVisual } from "../tactical/Effects.jsx";

export function BattleScene({
  sim,
  quality,
  onSnapshot,
  onEvent,
  onOutcome,
  onReady,
  onAim,
}) {
  const lastPublish = useRef(-1),
    resolved = useRef(false),
    ready = useRef(false);
  const [impact, setImpact] = useState(null);
  useFrame((_, delta) => {
    if (!sim || sim.disposed) return;
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    sim.advance(delta);
    const state = sim.snapshot();
    if (state.time - lastPublish.current >= 0.1 || state.outcome) {
      lastPublish.current = state.time;
      onSnapshot(state);
    }
    for (const event of sim.drainEvents()) {
      onEvent(event);
      if (event.type === "impact") setImpact(event);
    }
    if (state.outcome && !resolved.current) {
      resolved.current = true;
      onOutcome(state);
    }
  });
  return (
    <>
      <World arena={sim.arena} quality={quality} />
      <Chicken sim={sim} side="player" />
      <Chicken sim={sim} side="enemy" boss={sim.options.type === "boss"} />
      <ShotVisual sim={sim} />
      {impact && <ImpactVisual key={impact.id} event={impact} sim={sim} />}
      <mesh
        position={[0, 3, 0]}
        onPointerMove={(e) => {
          if (e.pointerType !== "touch" || e.buttons) onAim(e.point);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onAim(e.point);
        }}
      >
        <planeGeometry args={[18, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}
