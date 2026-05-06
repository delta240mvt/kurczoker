import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export function ModelAsset({ src, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], visible = true }) {
  const { scene } = useGLTF(src);
  const clone = useMemo(() => {
    const next = scene.clone(true);
    next.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return next;
  }, [scene]);

  if (!visible) return null;

  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}

export function preloadModelAsset(src) {
  useGLTF.preload(src);
}
