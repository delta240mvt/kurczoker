import { lazy, useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
const BattleScene = lazy(() =>
  import("./scenes/BattleScene.jsx").then((m) => ({ default: m.BattleScene })),
);
import {BattleCamera} from './tactical/BattleCamera.jsx';
import { MapScene } from "./scenes/MapScene.jsx";
function FitCamera() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    camera.position.set(0, 6, 16);
    camera.lookAt(0, 1.8, 0);
    camera.zoom = Math.min(size.width / 16.5, size.height / 8.8);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}
export function GameRuntime({
  sim,
  game,
  quality,
  selectNode,
  menu,
  view,
  ...events
}) {
  return (
    <>
      {sim?.terrain?<BattleCamera sim={sim} view={view}/>:<FitCamera />}
      {sim ? (
        <BattleScene sim={sim} quality={quality} view={view} {...events} />
      ) : (
        <MapScene
          game={game}
          quality={quality}
          selectNode={selectNode}
          menu={menu}
        />
      )}
    </>
  );
}
