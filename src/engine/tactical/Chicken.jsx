import { useEffect, useMemo, useRef } from "react";
import { AnimationMixer } from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import manifest from "./releaseManifest.json";

export function Chicken({
  sim,
  side = "player",
  boss = false,
  position,
  decorative = false,
}) {
  const type =
    side === "player"
      ? "hero-chicken"
      : boss
        ? "boss-rooster"
        : "enemy-rooster";
  const { scene, animations } = useGLTF(manifest[type].url);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  const root = useRef(),
    figure = useRef(),
    lastX = useRef(null);
  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);
  const clips = useMemo(
    () =>
      Object.fromEntries(
        animations.map((clip) => [clip.name, mixer.clipAction(clip)]),
      ),
    [mixer, animations],
  );
  const playing = useRef(null),
    lastTime = useRef(null);
  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clone);
    },
    [mixer, clone],
  );
  useFrame(({ clock }, dt) => {
    if (sim?.disposed) return;
    const state = sim?.snapshot(),
      a = state?.[side];
    const t = state?.time ?? clock.elapsedTime;
    if (root.current && a) root.current.position.set(a.x, a.y - 0.55, a.z);
    const speed =
      a && lastX.current != null
        ? Math.abs(a.x - lastX.current) / Math.max(dt, 0.001)
        : 0;
    if (a) lastX.current = a.x;
    const hit = a && t - a.hitAt < 0.2;
    if (figure.current) {
      figure.current.rotation.y =
        side === "enemy" || state?.facing === -1 ? Math.PI : 0;
      figure.current.position.y =
        Math.sin(t * (speed > 0.1 ? 15 : 2.4)) * (speed > 0.1 ? 0.07 : 0.018);
      figure.current.rotation.z = hit
        ? Math.sin(t * 60) * 0.12
        : a?.health <= 0
          ? -1.2
          : 0;
    }
    const attack =
      state &&
      (side === "player"
        ? state.phase === "player-shot"
        : state.phase === "enemy-tell");
    const name = attack ? "Attack" : speed > 0.1 ? "Walk" : "Idle";
    if (name !== playing.current) {
      clips[playing.current]?.fadeOut(0.12);
      clips[name]?.reset().fadeIn(0.12).play();
      playing.current = name;
    }
    mixer.update(
      lastTime.current === null
        ? 0
        : Math.max(0, Math.min(0.1, t - lastTime.current)),
    );
    lastTime.current = t;
  });
  return (
    <group
      ref={root}
      position={position ?? [0, 0, 0]}
      scale={decorative ? 1.7 : 1}
    >
      <group ref={figure} rotation={[0, side === "enemy" ? Math.PI : 0, 0]}>
        <primitive
          object={clone}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={boss ? 0.8 : 0.76}
        />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial
          color="#243732"
          transparent
          opacity={0.13}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
