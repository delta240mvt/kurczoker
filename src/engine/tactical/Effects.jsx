import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import { Vector3, BufferGeometry, Object3D, Color } from "three";
import { Html } from "@react-three/drei";

export function ShotVisual({ sim, showAim=true }) {
  const object=useMemo(()=>new Object3D(),[]);
  const egg = useRef(),
    trail = useRef(),
    line = useRef(),
    history = useRef([]),
    shotId = useRef(0);
  const trailGeometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints(
        Array.from({ length: 24 }, () => new Vector3()),
      ),
    [],
  );
  const arcGeometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints(
        Array.from({ length: 181 }, () => new Vector3()),
      ),
    [],
  );
  useEffect(()=>()=>{trailGeometry.dispose();arcGeometry.dispose()},[trailGeometry,arcGeometry]);
  useFrame(() => {
    if (!sim || sim.disposed) return;
    const s = sim.snapshot({includeTerrain:false});
    egg.current.count=s.projectiles.length;
    s.projectiles.forEach((p,i)=>{
      object.position.set(p.x,p.y,.1);object.rotation.z=s.time*8;
      const scale=p.weaponId==='fragment'?.11:.18;
      object.scale.set(scale,scale*1.2,scale);object.updateMatrix();egg.current.setMatrixAt(i,object.matrix);
      egg.current.setColorAt(i,new Color(({granajko:'#A6D97A',cluster:'#8F5BFF',fragment:'#F2E500'})[p.weaponId]??'#FFF0CB'));
    });
    egg.current.instanceMatrix.needsUpdate=true;
    if(egg.current.instanceColor)egg.current.instanceColor.needsUpdate=true;
    trail.current.visible = !!s.projectile;
    line.current.visible = showAim && s.phase === "player" && !s.paused;
    if (s.projectile) {
      const p = s.projectile;
      if (shotId.current !== p.id) {
        history.current = [];
        shotId.current = p.id;
      }
      history.current.push(new Vector3(p.x, p.y, p.z));
      if (history.current.length > 24) history.current.shift();
      const attr = trailGeometry.attributes.position;
      for (let i = 0; i < 24; i++) {
        const v = history.current[Math.min(i, history.current.length - 1)];
        attr.setXYZ(i, v.x, v.y, v.z);
      }
      attr.needsUpdate = true;
      trailGeometry.computeBoundingSphere();
    }
    if (line.current.visible) {
      const points = sim.trajectory();
      const attr = arcGeometry.attributes.position;
      points.forEach((p, i) => attr.setXYZ(i, p.x, p.y, p.z));
      attr.needsUpdate = true;
      arcGeometry.setDrawRange(0, points.length);
      arcGeometry.computeBoundingSphere();
    }
  });
  return (
    <>
      <instancedMesh ref={egg} args={[null,null,32]} frustumCulled={false}>
        <sphereGeometry args={[1,12,8]}/><meshStandardMaterial roughness={.5}/>
      </instancedMesh>
      <line ref={trail} geometry={trailGeometry} frustumCulled={false}>
        <lineBasicMaterial color="#f8cf78" transparent opacity={0.75} />
      </line>
      <line ref={line} geometry={arcGeometry} frustumCulled={false}>
        <lineBasicMaterial color="#fcf5cb" transparent opacity={0.7} />
      </line>
    </>
  );
}

export function ImpactVisual({ event, sim }) {
  const label=useRef();
  const root = useRef(),
    materials = useRef([]);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!sim.paused) elapsed.current += Math.min(delta, 0.1);
    const age = elapsed.current;
    if (!root.current) return;
    root.current.visible = age < 0.8;
    if(label.current)label.current.style.opacity=Math.max(0,1-age/.8);
    root.current.scale.setScalar(0.5 + age * 2.2);
    root.current.rotation.z = age * 1.1;
    materials.current.forEach((m) => {
      if (m) m.opacity = Math.max(0, 1 - age / 0.8);
    });
  });
  return (
    <group ref={root} position={[event.x, event.y, 0]}>
      <Html center position={[0, 0.8, 0]} style={{ pointerEvents: "none" }}>
        <span ref={label} className="damage-number">
          {event.damage ? `−${event.damage}` : "BUM!"}
        </span>
      </Html>
      <mesh>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshBasicMaterial
          color="#fff0b5"
          transparent
          ref={(m) => (materials.current[0] = m)}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.45, 0.6, 32]} />
        <meshBasicMaterial
          color="#efb663"
          transparent
          side={2}
          ref={(m) => (materials.current[1] = m)}
        />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.cos(i * 2.4) * 0.75, Math.sin(i * 2.4) * 0.6, 0.1]}
        >
          <icosahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial
            color={i % 2 ? "#e8cc92" : "#977b54"}
            transparent
            ref={(m) => (materials.current[i + 2] = m)}
          />
        </mesh>
      ))}
    </group>
  );
}

export function MineVisual({sim}) {
 const mesh=useRef(),object=useMemo(()=>new Object3D(),[]);
 useFrame(()=>{
  if(sim.disposed||!mesh.current)return;mesh.current.count=sim.mines.length;
  sim.mines.forEach((m,i)=>{
   object.position.set(m.x,m.y,1.35);object.scale.set(.18,.12,.18);object.updateMatrix();mesh.current.setMatrixAt(i,object.matrix);
   mesh.current.setColorAt(i,new Color(m.age>=.8&&Math.floor(sim.time*4)%2?'#F2E500':'#020304'));
  });mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;
 });
 return <instancedMesh ref={mesh} args={[null,null,16]} frustumCulled={false}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial/></instancedMesh>;
}
export function ConeVisual({event,sim}) {
 const ref=useRef(),geometry=useMemo(()=>new BufferGeometry().setFromPoints(event.payload.rays.flatMap(p=>[
  new Vector3(event.payload.origin.x,event.payload.origin.y,1.35),new Vector3(p.x,p.y,1.35)])),[event]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(()=>{if(ref.current)ref.current.visible=sim.time-event.time<.22});
 return <lineSegments ref={ref} geometry={geometry}><lineBasicMaterial color="#F2E500"/></lineSegments>;
}
