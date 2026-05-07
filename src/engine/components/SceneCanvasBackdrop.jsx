import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { NearestFilter, SRGBColorSpace } from "three";

const BACKDROP_SIZE = [13.35, 7.52];

export function SceneCanvasBackdrop({ backdropId = "02" }) {
  const texture = useTexture(`/uix/canvas/${backdropId}-canvas.webp`);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <group position={[0, 0, -1.48]}>
      <mesh raycast={() => null}>
        <planeGeometry args={BACKDROP_SIZE} />
        <meshBasicMaterial map={texture} toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[0, 0, 0.012]} raycast={() => null}>
        <planeGeometry args={BACKDROP_SIZE} />
        <meshBasicMaterial color="#0a0e1c" transparent opacity={0.08} fog={false} />
      </mesh>
      <mesh position={[0, -2.34, 0.02]} raycast={() => null}>
        <planeGeometry args={[BACKDROP_SIZE[0], 0.7]} />
        <meshBasicMaterial color="#0a0e1c" transparent opacity={0.24} fog={false} />
      </mesh>
    </group>
  );
}
