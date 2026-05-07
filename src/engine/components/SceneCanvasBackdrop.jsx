import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { NearestFilter, SRGBColorSpace } from "three";

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
        <planeGeometry args={[9.6, 5.4]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.012]} raycast={() => null}>
        <planeGeometry args={[9.6, 5.4]} />
        <meshBasicMaterial color="#0a0e1c" transparent opacity={0.08} />
      </mesh>
      <mesh position={[0, -2.34, 0.02]} raycast={() => null}>
        <planeGeometry args={[9.6, 0.7]} />
        <meshBasicMaterial color="#0a0e1c" transparent opacity={0.24} />
      </mesh>
    </group>
  );
}
