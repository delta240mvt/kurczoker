import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function CameraRig() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
