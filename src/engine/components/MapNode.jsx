import { useMemo, useState } from "react";
import { NODE_TYPES } from "../../game/constants.js";
import { PixelBillboard } from "./PixelBillboard.jsx";

const NODE_STYLE = {
  [NODE_TYPES.START]: { color: "#62d58d", emissive: "#b9f7bd" },
  [NODE_TYPES.BATTLE]: { color: "#2771d9", emissive: "#7dd3fc" },
  [NODE_TYPES.ELITE]: { color: "#6d4de6", emissive: "#d8b4fe" },
  [NODE_TYPES.TREASURE]: { color: "#d7a03a", emissive: "#fde68a" },
  [NODE_TYPES.SHOP]: { color: "#2ca66f", emissive: "#86efac" },
  [NODE_TYPES.BOSS]: { color: "#a8322d", emissive: "#fb923c" }
};

export function MapNode({ node, position, offered = false, active = false, completed = false, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const style = NODE_STYLE[node.type] ?? NODE_STYLE[NODE_TYPES.BATTLE];
  const glowColor = active ? "#facc15" : style.emissive;
  const scale = useMemo(() => {
    if (hovered && offered) return 1.08;
    if (active) return 1.04;
    return 1;
  }, [active, hovered, offered]);

  return (
    <group
      position={[position[0], position[1], position[2] + 0.02]}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation();
        if (offered) onSelect(node.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {(offered || active) && (
        <mesh position={[0, -0.05, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.012, 8, 40]} />
          <meshBasicMaterial color={glowColor} transparent opacity={active ? 0.9 : 0.58} />
        </mesh>
      )}
      <group position={[0, -0.02, 0.02]}>
        <PixelBillboard type={node.type} active={active} offered={offered || active} scale={0.34} />
      </group>
    </group>
  );
}
