import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

type TreeData = { x: number; z: number; scale: number };
type RockData = { id: string; position: [number, number, number]; scale: number };
type ResourceNode = {
  id: string;
  kind: "wood" | "stone" | "food";
  position: [number, number, number];
  label: string;
  amount: number;
};
type Inventory = { wood: number; stone: number; food: number; seeds: number };
type CropPlot = { id: number; x: number; z: number; plantedAt: number | null };
type Structure = { id: number; x: number; z: number; type: "fence" | "shelter" };
type Tools = { hoe: boolean; axe: boolean; pickaxe: boolean };

const trees: TreeData[] = [
  { x: -8, z: -5, scale: 1.2 }, { x: -6, z: 4, scale: 0.9 },
  { x: -10, z: 1, scale: 1.1 }, { x: 7, z: -7, scale: 1.1 },
  { x: 9, z: -2, scale: 0.9 }, { x: 6, z: 5, scale: 1.2 },
  { x: -3, z: 9, scale: 1 }, { x: 3, z: 10, scale: 0.9 },
  { x: 11, z: 5, scale: 0.8 }, { x: -11, z: -7, scale: 0.8 },
  { x: -4, z: -10, scale: 1.1 }, { x: 1, z: -12, scale: 1.3 },
  { x: 5, z: -11, scale: 0.85 }, { x: -13, z: -3, scale: 0.9 },
  { x: -12, z: 5, scale: 1.15 }, { x: 13, z: -5, scale: 1 },
  { x: 12, z: 9, scale: 0.9 }, { x: -8, z: 11, scale: 0.95 },
  { x: 8, z: 11, scale: 1.1 }, { x: -2, z: -13, scale: 0.85 },
  { x: 3, z: 6, scale: 0.75 }, { x: -5, z: -2, scale: 0.8 },
  { x: 10, z: 2, scale: 0.85 }, { x: -2, z: 4, scale: 0.75 },
  { x: -18, z: -8, scale: 1.05 }, { x: -20, z: 2, scale: 0.9 },
  { x: -17, z: 12, scale: 1.15 }, { x: -14, z: 18, scale: 0.95 },
  { x: -7, z: 20, scale: 1.2 }, { x: 2, z: 21, scale: 0.95 },
  { x: 12, z: 19, scale: 1.1 }, { x: 19, z: 13, scale: 0.9 },
  { x: 21, z: 4, scale: 1.05 }, { x: 19, z: -8, scale: 1.15 },
  { x: 13, z: -18, scale: 0.95 }, { x: 4, z: -21, scale: 1.2 },
  { x: -7, z: -20, scale: 0.9 }, { x: -17, z: -17, scale: 1.1 },
  { x: 15, z: 7, scale: 0.85 }, { x: -17, z: -1, scale: 0.9 },
  { x: 17, z: -14, scale: 1.0 }, { x: -2, z: 17, scale: 0.85 },
];
const rocks: RockData[] = [
  { id: "rock-0", position: [-4, 0.75, -3], scale: 1.2 },
  { id: "rock-1", position: [4, 0.6, 2], scale: 0.9 },
  { id: "rock-2", position: [8, 0.55, 1], scale: 0.8 },
  { id: "rock-3", position: [-7, 0.6, 7], scale: 0.9 },
  { id: "rock-4", position: [-15, 0.65, -10], scale: 1.1 },
  { id: "rock-5", position: [16, 0.7, -9], scale: 1.15 },
  { id: "rock-6", position: [-18, 0.55, 8], scale: 0.85 },
  { id: "rock-7", position: [18, 0.6, 10], scale: 0.95 },
  { id: "rock-8", position: [3, 0.65, -17], scale: 1.0 },
  { id: "rock-9", position: [-3, 0.55, 18], scale: 0.85 },
  { id: "rock-10", position: [21, 0.6, -1], scale: 0.8 },
  { id: "rock-11", position: [-21, 0.65, -4], scale: 1.05 },
];
const berrySpots: [number, number, number][] = [
  [-6, 0.36, -3], [-10, 0.36, 4], [7, 0.36, -4], [11, 0.36, 5],
  [-16, 0.36, -5], [-18, 0.36, 13], [-12, 0.36, 17], [-2, 0.36, 20],
  [8, 0.36, 18], [16, 0.36, 13], [20, 0.36, 1], [15, 0.36, -16],
];
const extraGrass: [number, number, number][] = Array.from({ length: 72 }, (_, i) => {
  const angle = i * 2.399963;
  const radius = 5 + (i % 7) * 2.65;
  return [Math.cos(angle) * radius, 0.37, Math.sin(angle) * radius];
});
const flowerSpots: [number, number, number][] = [
  [-13,0.38,-12],[-14,0.38,5],[-4,0.38,-16],[6,0.38,-15],
  [13,0.38,-10],[17,0.38,5],[10,0.38,15],[0,0.38,16],[-9,0.38,13],[-19,0.38,0]
];
const resourceNodes: ResourceNode[] = [
  ...trees.map((t, i) => ({ id: `tree-${i}`, kind: "wood" as const, position: [t.x, 0, t.z] as [number, number, number], label: "Tree", amount: 3 })),
  ...rocks.map((r) => ({ id: r.id, kind: "stone" as const, position: r.position, label: "Rock", amount: 2 })),
  ...berrySpots.map((p, i) => ({ id: `berry-${i}`, kind: "food" as const, position: p, label: "Berry bush", amount: 2 })),
];
const initialPlots: CropPlot[] = [
  { id: 0, x: -1.5, z: 5.2, plantedAt: null },
  { id: 1, x: 0, z: 5.2, plantedAt: null },
  { id: 2, x: 1.5, z: 5.2, plantedAt: null },
  { id: 3, x: -1.5, z: 7, plantedAt: null },
  { id: 4, x: 0, z: 7, plantedAt: null },
  { id: 5, x: 1.5, z: 7, plantedAt: null },
];
const CROP_GROW_MS = 30_000;

function Tree({ x, z, scale }: TreeData) {
  return <group position={[x, 0, z]} scale={scale}>
    <mesh position={[0, 1, 0]} castShadow><cylinderGeometry args={[0.22, 0.35, 2, 8]} /><meshStandardMaterial color="#795038" /></mesh>
    <mesh position={[0, 2.3, 0]} castShadow><coneGeometry args={[1.15, 2.2, 7]} /><meshStandardMaterial color="#285c37" flatShading /></mesh>
    <mesh position={[0, 3.2, 0]} castShadow><coneGeometry args={[0.8, 1.7, 7]} /><meshStandardMaterial color="#397747" flatShading /></mesh>
  </group>;
}
function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.35, 0]} castShadow><dodecahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color="#355b32" roughness={0.95} /></mesh>
    <mesh position={[0.3, 0.25, 0.15]} castShadow><dodecahedronGeometry args={[0.35, 1]} /><meshStandardMaterial color="#4b7138" roughness={1} /></mesh>
    <mesh position={[-0.25, 0.3, 0.1]} castShadow><dodecahedronGeometry args={[0.3, 1]} /><meshStandardMaterial color="#294d2d" roughness={1} /></mesh>
  </group>;
}
function BerryBush({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 0.35, 0]} castShadow><dodecahedronGeometry args={[0.5, 1]} /><meshStandardMaterial color="#416b35" roughness={1} /></mesh>
    { [[-0.2,0.55,0.25],[0.18,0.45,0.3],[0.25,0.62,-0.1],[-0.15,0.4,-0.25],[0.02,0.72,0.12],[-0.34,0.46,-0.05],[0.36,0.55,0.02]] .map((p,i)=><mesh key={i} position={p as [number,number,number]} castShadow><sphereGeometry args={[0.105,10,10]} /><meshStandardMaterial color={i%2===0?"#d82949":"#a91e36"} roughness={0.38} /></mesh>) }
  </group>;
}
function FallenLog({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, Math.PI / 2]}>
    <mesh castShadow><cylinderGeometry args={[0.2,0.25,2.2,10]} /><meshStandardMaterial color="#62432d" roughness={1} /></mesh>
    <mesh position={[0,1.1,0]} castShadow><cylinderGeometry args={[0.2,0.2,0.04,10]} /><meshStandardMaterial color="#b18a5b" roughness={1} /></mesh>
  </group>;
}
function GrassPatch({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}>{[0,1,2,3,4].map(i=><mesh key={i} position={[Math.sin(i*1.7)*0.22,0.22,Math.cos(i*1.7)*0.22]} rotation={[0,i*0.9,(i%2?-1:1)*0.2]}><coneGeometry args={[0.055,0.5,4]} /><meshStandardMaterial color={i%2?"#52783a":"#829b4e"} roughness={1} /></mesh>)}</group>;
}
function DayNight({ onNightChange }: { onNightChange: (night: boolean) => void }) {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const updateTimer = useRef(0);
  const lastNight = useRef(false);
  const [sunPosition, setSunPosition] = useState<[number,number,number]>([0,30,20]);
  const dayColor = new THREE.Color("#fff1d0");
  const sunsetColor = new THREE.Color("#ff873d");
  const nightColor = new THREE.Color("#879bd8");
  const daySky = new THREE.Color("#8bc9d5");
  const nightSky = new THREE.Color("#263a63");
  const groundNight = new THREE.Color("#273b32");
  useFrame((_, delta) => {
    elapsed.current = (elapsed.current + delta) % 120;
    const angle = Math.PI / 2 + elapsed.current / 120 * Math.PI * 2;
    const sx = Math.cos(angle) * 40, sy = Math.sin(angle) * 30, sz = 20;
    const height = Math.sin(angle);
    const daylight = THREE.MathUtils.smoothstep(height, -0.2, 0.3);
    const darkness = 1 - daylight;
    const night = darkness > 0.72;
    const sunset = 1 - THREE.MathUtils.smoothstep(Math.abs(height), 0, 0.45);
    updateTimer.current += delta;
    if (updateTimer.current >= 0.15) {
      updateTimer.current = 0;
      setSunPosition([sx, sy, sz]);
      if (night !== lastNight.current) { lastNight.current = night; onNightChange(night); }
    }
    if (sunRef.current) {
      sunRef.current.position.set(sx, sy, sz);
      sunRef.current.intensity = 0.18 + daylight * 2.15;
      sunRef.current.color.copy(dayColor.clone().lerp(sunsetColor, sunset).lerp(nightColor, darkness));
    }
    if (hemiRef.current) {
      // Keep enough ambient light to see the island at night.
      hemiRef.current.intensity = 0.72 + daylight * 0.95;
      hemiRef.current.color.set("#c9e5ff").lerp(nightSky, darkness * 0.72);
      hemiRef.current.groundColor.set("#46523a").lerp(groundNight, darkness * 0.68);
    }
    if (moonLightRef.current) {
      moonLightRef.current.position.set(-sx * 0.8, Math.max(7, -sy * 0.8), -sz * 0.8);
      moonLightRef.current.intensity = 0.12 + darkness * 1.05;
      moonLightRef.current.visible = darkness > 0.35;
    }
    if (moonRef.current) {
      moonRef.current.position.set(-sx * 0.8, Math.max(7, -sy * 0.8), -sz * 0.8);
      moonRef.current.visible = darkness > 0.35;
    }
    scene.background = daySky.clone().lerp(nightSky, darkness * 0.82);
  });
  return <>
    <Sky distance={450000} sunPosition={sunPosition} inclination={0.5} azimuth={0.25} />
    <hemisphereLight ref={hemiRef} args={["#c9e5ff", "#46523a", 1.5]} />
    <directionalLight ref={sunRef} position={[0,30,20]} intensity={2.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <directionalLight ref={moonLightRef} position={[-20,18,-16]} color="#b9d4ff" intensity={0.9} />
    <mesh ref={moonRef} visible={false}><sphereGeometry args={[1.6,24,24]} /><meshStandardMaterial color="#f0f4ff" emissive="#8daeff" emissiveIntensity={0.45} /></mesh>
  </>;
}
function FlowerPatch({ position }: { position: [number,number,number] }) {
  return <group position={position}>
    {[0,1,2].map(i => <group key={i} position={[(i-1)*0.18,0, (i%2)*0.13]}>
      <mesh position={[0,0.18,0]}><cylinderGeometry args={[0.018,0.025,0.34,5]} /><meshStandardMaterial color="#477a3d" /></mesh>
      <mesh position={[0,0.36,0]}><sphereGeometry args={[0.09,8,8]} /><meshStandardMaterial color={["#f3d58b","#f0b8d0","#f4eee0"][i]} emissive={["#6a4c19","#55283c","#494338"][i]} emissiveIntensity={0.08} /></mesh>
    </group>)}
  </group>;
}
function Hut() {
  return <group>
    {/* Warm timber frame and plank walls */}
    <mesh position={[0,1.05,0]} castShadow receiveShadow><boxGeometry args={[3.3,1.7,2.8]} /><meshStandardMaterial color="#8b603a" roughness={0.92} /></mesh>
    {[-1.52,1.52].map(x => <group key={x} position={[x,0,0]}>
      <mesh position={[0,1.0,0]} castShadow><boxGeometry args={[0.16,2.0,3.0]} /><meshStandardMaterial color="#55351f" roughness={0.9} /></mesh>
      <mesh position={[0.03,1.72,0]} castShadow><boxGeometry args={[0.19,0.13,3.08]} /><meshStandardMaterial color="#b1814c" /></mesh>
    </group>)}
    {Array.from({length:7},(_,i)=>0.28+i*0.22).flatMap((y,i)=>[
      <mesh key={`front-plank-${i}`} position={[0,y,1.425]} castShadow><boxGeometry args={[3.28,0.075,0.055]} /><meshStandardMaterial color={i%2?"#93653e":"#a47449"} roughness={0.88} /></mesh>,
      <mesh key={`back-plank-${i}`} position={[0,y,-1.425]} castShadow><boxGeometry args={[3.28,0.075,0.055]} /><meshStandardMaterial color={i%2?"#93653e":"#a47449"} roughness={0.88} /></mesh>,
      <mesh key={`left-plank-${i}`} position={[-1.675,y,0]} castShadow><boxGeometry args={[0.055,0.075,2.75]} /><meshStandardMaterial color={i%2?"#93653e":"#a47449"} roughness={0.88} /></mesh>,
      <mesh key={`right-plank-${i}`} position={[1.675,y,0]} castShadow><boxGeometry args={[0.055,0.075,2.75]} /><meshStandardMaterial color={i%2?"#93653e":"#a47449"} roughness={0.88} /></mesh>
    ])}
    {/* Heavy corner posts and cross beams */}
    {[-1.58,1.58].flatMap(x=>[-1.38,1.38].map(z=><mesh key={`${x}-${z}`} position={[x,1.05,z]} castShadow><boxGeometry args={[0.2,2.05,0.2]} /><meshStandardMaterial color="#57371f" /></mesh>))}
    <mesh position={[0,1.95,1.43]} castShadow><boxGeometry args={[3.35,0.18,0.18]} /><meshStandardMaterial color="#59391f" /></mesh>
    {/* Gabled roof, with visible rafters and shingles */}
    <mesh position={[-0.82,2.48,0]} rotation={[0,0,0.62]} castShadow><boxGeometry args={[2.35,0.22,3.35]} /><meshStandardMaterial color="#513522" roughness={1} /></mesh>
<mesh position={[0.82,2.48,0]} rotation={[0,0,-0.62]} castShadow><boxGeometry args={[2.35,0.22,3.35]} /><meshStandardMaterial color="#65432b" roughness={1} /></mesh>
    {[-1.35,-0.9,-0.45,0,0.45,0.9,1.35].map(z=><group key={z}>
      <mesh position={[-0.8,2.54,z]} rotation={[0,0,0.62]}><boxGeometry args={[2.15,0.06,0.06]} /><meshStandardMaterial color="#9a7048" /></mesh>
<mesh position={[0.8,2.54,z]} rotation={[0,0,-0.62]}><boxGeometry args={[2.15,0.06,0.06]} /><meshStandardMaterial color="#9a7048" /></mesh>
    </group>)}
    <mesh position={[0,3.18,0]} castShadow><boxGeometry args={[0.18,0.18,3.55]} /><meshStandardMaterial color="#4a2d1b" /></mesh>
    {/* Door and little window details */}
    <mesh position={[0,0.92,1.435]} castShadow><boxGeometry args={[0.82,1.45,0.09]} /><meshStandardMaterial color="#4a2d1b" /></mesh>
    <mesh position={[0,0.92,1.49]}><boxGeometry args={[0.65,1.3,0.035]} /><meshStandardMaterial color="#714729" /></mesh>
    <mesh position={[0.25,0.95,1.52]}><sphereGeometry args={[0.045,8,8]} /><meshStandardMaterial color="#e0b75f" metalness={0.55} roughness={0.3} /></mesh>
    {[-1,1].map(x=><group key={x} position={[x*1.0,1.3,1.45]}>
      <mesh><boxGeometry args={[0.42,0.42,0.08]} /><meshStandardMaterial color="#53351f" /></mesh>
      <mesh position={[0,0,0.05]}><boxGeometry args={[0.3,0.3,0.035]} /><meshStandardMaterial color="#8fc6d1" emissive="#386d7a" emissiveIntensity={0.25} /></mesh>
      <mesh position={[0,0,0.08]}><boxGeometry args={[0.045,0.34,0.035]} /><meshStandardMaterial color="#53351f" /></mesh>
      <mesh position={[0,0,0.08]}><boxGeometry args={[0.34,0.045,0.035]} /><meshStandardMaterial color="#53351f" /></mesh>
    </group>)}
    <mesh position={[0,0.14,1.65]} receiveShadow><boxGeometry args={[2.3,0.22,0.65]} /><meshStandardMaterial color="#92704b" /></mesh>
    {/* Stone foundation */}
    {Array.from({length:10},(_,i)=><mesh key={i} position={[-1.48+i*0.33,0.24,1.44]} castShadow><dodecahedronGeometry args={[0.22,0]} /><meshStandardMaterial color={i%2?"#77776b":"#8d8d7e"} roughness={1} /></mesh>)}
  </group>;
}
function Fireplace({ lit }: { lit: boolean }) {
  const flames = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flames.current) { flames.current.scale.set(1 + Math.sin(t*9)*0.08, 1 + Math.sin(t*13)*0.18, 1 + Math.cos(t*8)*0.08); flames.current.rotation.y = Math.sin(t*2)*0.12; }
    if (light.current) light.current.intensity = lit ? 2.5 + Math.sin(t*12)*0.55 : 0;
  });
  return <group position={[2,0.42,-0.25]}>
    {Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9;return <mesh key={i} position={[Math.cos(a)*0.62,0.12,Math.sin(a)*0.48]} rotation={[0,a,0]} castShadow><dodecahedronGeometry args={[0.25,0]} /><meshStandardMaterial color={i%2?"#777a70":"#96988a"} roughness={1} /></mesh>;})}
    <mesh position={[0,0.16,0]} rotation={[0,0.2,0.55]} castShadow><cylinderGeometry args={[0.11,0.12,1.15,8]} /><meshStandardMaterial color="#52331f" /></mesh>
    <mesh position={[0,0.2,0]} rotation={[0,0.2,-0.55]} castShadow><cylinderGeometry args={[0.11,0.12,1.15,8]} /><meshStandardMaterial color="#694229" /></mesh>
    {lit && <group ref={flames} position={[0,0.62,0]}>
      <mesh><coneGeometry args={[0.28,0.85,7]} /><meshStandardMaterial color="#ff7a22" emissive="#ff4d00" emissiveIntensity={2.1} /></mesh>
      <mesh position={[0,0.12,0.02]}><coneGeometry args={[0.16,0.58,7]} /><meshStandardMaterial color="#ffe58a" emissive="#ffb52e" emissiveIntensity={2.4} /></mesh>
    </group>}
    <pointLight ref={light} position={[0,1.0,0]} color="#ff9b45" intensity={0} distance={13} decay={2} />
  </group>;
}
function Rock({ position, scale }: RockData) {
  return <mesh position={position} scale={scale} castShadow><dodecahedronGeometry args={[0.7,0]} /><meshStandardMaterial color="#858b83" flatShading /></mesh>;
}
function CropPlotMesh({ plot }: { plot: CropPlot }) {
  const stage = plot.plantedAt === null ? 0 : Math.min(3, Math.floor((Date.now()-plot.plantedAt)/(CROP_GROW_MS/3))+1);
  return <group position={[plot.x,0.39,plot.z]}>
    <mesh receiveShadow><boxGeometry args={[1.25,0.12,1.25]} /><meshStandardMaterial color={plot.plantedAt===null?"#775034":"#4b3021"} roughness={1} /></mesh>
    {plot.plantedAt !== null && Array.from({length: Math.min(stage,3)}).map((_,i)=><group key={i} position={[(i-1)*0.28,0.12, i%2===0?0.1:-0.12]}>
      <mesh position={[0,0.18+stage*0.03,0]} rotation={[0,0,0.12*(i-1)]}><cylinderGeometry args={[0.025,0.04,0.38+stage*0.08,5]} /><meshStandardMaterial color="#4d8c3d" /></mesh>
      {stage>=2 && <mesh position={[0.05,0.23+stage*0.03,0]}><sphereGeometry args={[stage===3?0.13:0.08,8,7]} /><meshStandardMaterial color={stage===3?"#e7b943":"#78a94e"} /></mesh>}
    </group>)}
  </group>;
}
function Player({ yaw, pitch, locked, playerPosition, movementKeys }: { yaw: MutableRefObject<number>; pitch: MutableRefObject<number>; locked: boolean; playerPosition: MutableRefObject<THREE.Vector3>; movementKeys: MutableRefObject<Record<string, boolean>> }) {
  const player = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const keys = useRef<Record<string,boolean>>({});
  const position = useRef(new THREE.Vector3(0,0,0));
  const direction = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; if (["w","a","s","d"," "].includes(e.key.toLowerCase())) e.preventDefault(); };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    const clear = () => { keys.current = {}; };
    window.addEventListener("keydown",down); window.addEventListener("keyup",up); window.addEventListener("blur",clear);
    return () => { window.removeEventListener("keydown",down); window.removeEventListener("keyup",up); window.removeEventListener("blur",clear); };
  },[]);
  useFrame((_,delta) => {
    const p=position.current,k={w:!!keys.current.w||!!movementKeys.current.w,a:!!keys.current.a||!!movementKeys.current.a,s:!!keys.current.s||!!movementKeys.current.s,d:!!keys.current.d||!!movementKeys.current.d},speed=6*Math.min(delta,0.05);
    direction.current.set(Math.sin(yaw.current),0,Math.cos(yaw.current));
    right.current.set(Math.cos(yaw.current),0,-Math.sin(yaw.current));
    if(k.w)p.addScaledVector(direction.current,speed); if(k.s)p.addScaledVector(direction.current,-speed); if(k.d)p.addScaledVector(right.current,speed); if(k.a)p.addScaledVector(right.current,-speed);
    const distance=Math.hypot(p.x,p.z); if(distance>24){p.x*=24/distance;p.z*=24/distance;}
    playerPosition.current.copy(p);
    if(player.current){player.current.position.copy(p);player.current.rotation.y=yaw.current;}
    const target=new THREE.Vector3(p.x-Math.sin(yaw.current)*7,p.y+2.5+pitch.current*4,p.z-Math.cos(yaw.current)*7);
    camera.position.lerp(target,1-Math.exp(-7*delta)); camera.lookAt(p.x,p.y+1.25,p.z);
  });
  return <group ref={player}>
    <mesh position={[0,1,0]} castShadow><capsuleGeometry args={[0.38,0.8,4,8]} /><meshStandardMaterial color="#d49b56" flatShading /></mesh>
    <mesh position={[0,1.85,0]} castShadow><sphereGeometry args={[0.28,12,10]} /><meshStandardMaterial color="#edc69b" flatShading /></mesh>
    <mesh position={[0,1.1,-0.35]} castShadow><boxGeometry args={[0.48,0.55,0.2]} /><meshStandardMaterial color="#70442d" /></mesh>
    {!locked && <mesh position={[0,2.25,0]}><sphereGeometry args={[0.05,8,8]} /><meshBasicMaterial color="#fff" /></mesh>}
  </group>;
}
function FenceMesh({ structure }: { structure: Structure }) {
  return <group position={[structure.x,0.4,structure.z]}>
    {structure.type === "fence" ? <>
      {[-0.9,0,0.9].map((x,i)=><mesh key={i} position={[x,0.5,0]} castShadow><boxGeometry args={[0.14,1,0.14]} /><meshStandardMaterial color="#80542f" /></mesh>)}
      {[0.3,0.7].map((y,i)=><mesh key={i} position={[0,y,0]} castShadow><boxGeometry args={[2,0.14,0.14]} /><meshStandardMaterial color="#b1814c" /></mesh>)}
    </> : <Hut />}
  </group>;
}
function Island({ yaw,pitch,locked,playerPosition,harvested,plots,structures,movementKeys,onNightChange,fireplaceLit }: { yaw: MutableRefObject<number>; pitch: MutableRefObject<number>; locked: boolean; playerPosition: MutableRefObject<THREE.Vector3>; harvested: string[]; plots: CropPlot[]; structures: Structure[]; movementKeys: MutableRefObject<Record<string, boolean>>; onNightChange: (night: boolean) => void; fireplaceLit: boolean }) {
  return <>
    <DayNight onNightChange={onNightChange} />
    <ambientLight intensity={0.25} />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.25,0]}><planeGeometry args={[300,300]} /><meshStandardMaterial color="#1d718b" roughness={0.32} metalness={0.08} /></mesh>
    <mesh position={[0,-0.05,0]} receiveShadow><cylinderGeometry args={[27,28,0.8,96]} /><meshStandardMaterial color="#5b4934" flatShading roughness={1} /></mesh>
    <mesh position={[0,0.34,0]} receiveShadow><cylinderGeometry args={[26.8,26.8,0.18,96]} /><meshStandardMaterial color="#638747" flatShading roughness={1} /></mesh>
    {/* Subtle terrain details */}
    {Array.from({length:28},(_,i)=>{const a=i*2.399963;const r=8+(i%5)*3.2;return <mesh key={i} position={[Math.cos(a)*r,0.445,Math.sin(a)*r]} rotation={[-Math.PI/2,0,a]} receiveShadow><circleGeometry args={[0.55+(i%3)*0.2,8]} /><meshStandardMaterial color={i%2?"#759750":"#577c3e"} roughness={1} /></mesh>;})}
    {trees.map((tree,i)=>harvested.includes(`tree-${i}`)?null:<Tree key={i} {...tree}/>)}
    <Bush position={[-7,0.4,-4]} scale={1.1}/><Bush position={[-9,0.4,3]} scale={0.9}/><Bush position={[8,0.4,-5]} scale={1.2}/><Bush position={[10,0.4,4]} scale={0.85}/><Bush position={[4,0.4,8]} scale={1.1}/><Bush position={[-4,0.4,8]} scale={0.8}/><Bush position={[12,0.4,-1]} scale={0.9}/><Bush position={[-12,0.4,-5]} scale={0.85}/>
    {berrySpots.map((p,i)=>harvested.includes(`berry-${i}`)?null:<BerryBush key={i} position={p}/>)}
    {extraGrass.map((p,i)=><GrassPatch key={`grass-${i}`} position={p} scale={0.65+(i%4)*0.16}/>)}
    {flowerSpots.map((p,i)=><FlowerPatch key={`flower-${i}`} position={p}/>)}
    <GrassPatch position={[-2,0.42,-2]} scale={1.2}/><GrassPatch position={[1,0.42,3]}/><GrassPatch position={[-5,0.42,2]} scale={1.3}/><GrassPatch position={[5,0.42,-5]}/><GrassPatch position={[7,0.42,7]} scale={1.1}/><GrassPatch position={[-9,0.42,7]}/><GrassPatch position={[0,0.42,11]}/><GrassPatch position={[10,0.42,-8]}/>
    <FallenLog position={[-5,0.5,-6]} rotation={0.6}/><FallenLog position={[8,0.5,6]} rotation={1.2}/><FallenLog position={[-15,0.5,4]} rotation={0.2}/><FallenLog position={[16,0.5,-4]} rotation={1.5}/>
    {rocks.map(r=>harvested.includes(r.id)?null:<Rock key={r.id} {...r}/>)}
    {plots.map(plot=><CropPlotMesh key={plot.id} plot={plot}/>)}
    {structures.map(s=><FenceMesh key={s.id} structure={s}/>)}
    <group position={[2,0.4,-3]}><Hut /></group>
    <Fireplace lit={fireplaceLit} />
    <Player yaw={yaw} pitch={pitch} locked={locked} playerPosition={playerPosition} movementKeys={movementKeys}/>
  </>;
}

const panelStyle: React.CSSProperties = { position:"absolute", zIndex:25, top:160, right:20, width:280, maxHeight:"calc(100vh - 230px)", overflowY:"auto", padding:16, color:"#f5f5ed", background:"rgba(16,27,21,.94)", border:"1px solid rgba(201,229,255,.25)", borderRadius:14, fontFamily:"sans-serif", boxShadow:"0 12px 35px rgba(0,0,0,.28)" };
const actionStyle: React.CSSProperties = { width:"100%", padding:"10px 12px", marginTop:8, border:0, borderRadius:8, background:"#b9d69a", color:"#1b2b1d", fontWeight:700, cursor:"pointer" };
const moveButtonStyle: React.CSSProperties = { border:"1px solid rgba(255,255,255,.38)", borderRadius:12, background:"rgba(18,34,25,.72)", color:"#f4f4df", fontSize:18, fontWeight:800, cursor:"pointer", touchAction:"none", backdropFilter:"blur(8px)" };

export default function App() {
  const yaw=useRef(0), pitch=useRef(0);
  const playerPosition=useRef(new THREE.Vector3(0,0,0));
  const movementKeys=useRef<Record<string,boolean>>({});
  const mouseLook=useRef(false);
  const [locked,setLocked]=useState(false);
  const [isNight,setIsNight]=useState(false);
  const [fireplaceLit,setFireplaceLit]=useState(false);
  const [inventory,setInventory]=useState<Inventory>({wood:0,stone:0,food:0,seeds:3});
  const [harvested,setHarvested]=useState<string[]>([]);
  const [message,setMessage]=useState("Explore, gather, plant, and craft!");
  const [plots,setPlots]=useState<CropPlot[]>(initialPlots);
  const [structures,setStructures]=useState<Structure[]>([]);
  const [tools,setTools]=useState<Tools>({hoe:false,axe:false,pickaxe:false});
  const [panel,setPanel]=useState<"farm"|"craft"|"build"|null>(null);
  const [clock,setClock]=useState(Date.now());

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      if (!mouseLook.current || !locked) return;

      yaw.current -= e.movementX * 0.0025;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - e.movementY * 0.0015,
        -0.35,
        0.45
      );
    };

    // MacBook two-finger trackpad gestures can generate wheel events.
    // Use those gestures to look around without pressing the touchpad.
    
const trackpadLook = (e: WheelEvent) => {
  if (!locked) return;

  // Let two-finger trackpad gestures scroll an open menu.
  const target = e.target as HTMLElement;
  if (target.closest("section") && target.closest("section") !== document.querySelector(".help-panel")) {
    return;
  }

  e.preventDefault();

  yaw.current -= e.deltaX * 0.003;
  pitch.current = THREE.MathUtils.clamp(
    pitch.current + e.deltaY * 0.002,
    -0.35,
    0.45
  );
};

    const pointerUp = () => {
      mouseLook.current = false;
    };

    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        mouseLook.current = false;
        setLocked(false);
      }
    };

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("wheel", trackpadLook, { passive: false });
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("keydown", escape);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("wheel", trackpadLook);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("keydown", escape);
    };
  }, [locked]);

  useEffect(()=>{ if(!isNight && fireplaceLit) setFireplaceLit(false); },[isNight,fireplaceLit]);

  // Refresh crop stages once per second so the menu and plants update as they grow.
  useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),1000);return ()=>window.clearInterval(timer);},[]);

  useEffect(()=>{
    const gather=(e:KeyboardEvent)=>{
      if(e.key.toLowerCase()!=="e"||e.repeat||!locked)return;
      if(panel!==null)return;
      const p=playerPosition.current;
      const nearby=resourceNodes.filter(n=>!harvested.includes(n.id)).map(node=>({node,distance:Math.hypot(p.x-node.position[0],p.z-node.position[2])})).filter(item=>item.distance<2.8).sort((a,b)=>a.distance-b.distance)[0];
      if(!nearby){setMessage("No resources nearby. Move closer to a tree, rock, or berry bush.");return;}
      const {node}=nearby;
      setInventory(current=>({...current,[node.kind]:current[node.kind]+node.amount}));
      setHarvested(current=>[...current,node.id]);
      window.setTimeout(()=>setHarvested(current=>current.filter(id=>id!==node.id)),10000);
      setMessage(`Collected ${node.amount} ${node.kind}! This resource returns in 10 seconds.`);
    };
    window.addEventListener("keydown",gather);return ()=>window.removeEventListener("keydown",gather);
  },[harvested,locked,panel]);

  const startGame=()=>setLocked(true);
  const exitGame=()=>{mouseLook.current=false;setLocked(false);movementKeys.current={};};
  const igniteFireplace=()=>{if(!isNight){setMessage("You can only light the fireplace at night.");return;}if(fireplaceLit){setMessage("The fireplace is already burning.");return;}if(inventory.wood<1){setMessage("You need 1 wood to light the fireplace.");return;}setInventory(v=>({...v,wood:v.wood-1}));setFireplaceLit(true);setMessage("The fireplace is burning and warming the hut!");};
  const setMove=(key:string,down:boolean)=>{movementKeys.current[key]=down;};
  const cropStage=(plot:CropPlot)=>plot.plantedAt===null?0:Math.min(3,Math.floor((clock-plot.plantedAt)/(CROP_GROW_MS/3))+1);
  const cropIsMature=(plot:CropPlot)=>plot.plantedAt!==null && clock-plot.plantedAt>=CROP_GROW_MS;
  const plantCrop=(id:number)=>{
    if(!tools.hoe){setMessage("Craft a hoe first in the Craft menu.");return;}
    setPlots(current=>current.map(plot=>plot.id===id&&plot.plantedAt===null?{...plot,plantedAt:Date.now()}:plot));
    setInventory(current=>({...current,seeds:Math.max(0,current.seeds-1)}));
    setMessage(`Planted a seed in plot ${id+1}. It will be ready in about 30 seconds.`);
  };
  const handlePlant=(id:number)=>{
    const plot=plots.find(p=>p.id===id); if(!plot)return;
    if(plot.plantedAt!==null){setMessage("This plot already has a crop.");return;}
    if(inventory.seeds<1){setMessage("You need seeds. Craft a seed packet or harvest a crop first.");return;}
    if(!tools.hoe){setMessage("You need a crafted hoe to farm. Open Crafting first.");return;}
    plantCrop(id);
  };
  const harvestCrop=(id:number)=>{
    const plot=plots.find(p=>p.id===id); if(!plot||plot.plantedAt===null)return;
    if(!cropIsMature(plot)){setMessage("This crop is still growing. Come back in a little while.");return;}
    setInventory(current=>({...current,food:current.food+3,seeds:current.seeds+1}));
    setPlots(current=>current.map(p=>p.id===id?{...p,plantedAt:null}:p));
    setMessage("Harvested 3 food and recovered 1 seed!");
  };
  const craft=(recipe:"hoe"|"axe"|"pickaxe"|"seeds")=>{
    if(recipe==="hoe"){
      if(tools.hoe){setMessage("You already have a hoe.");return;}
      if(inventory.wood<3||inventory.stone<1){setMessage("Hoe recipe: 3 wood + 1 stone.");return;}
      setInventory(v=>({...v,wood:v.wood-3,stone:v.stone-1}));setTools(v=>({...v,hoe:true}));setMessage("Crafted a hoe! You can now plant seeds.");
    } else if(recipe==="axe"){
      if(tools.axe){setMessage("You already have an axe.");return;}
      if(inventory.wood<2||inventory.stone<2){setMessage("Axe recipe: 2 wood + 2 stone.");return;}
      setInventory(v=>({...v,wood:v.wood-2,stone:v.stone-2}));setTools(v=>({...v,axe:true}));setMessage("Crafted a stone axe! (Tool unlock added; resource yields stay the same for now.)");
    } else if(recipe==="pickaxe"){
      if(tools.pickaxe){setMessage("You already have a pickaxe.");return;}
      if(inventory.wood<2||inventory.stone<3){setMessage("Pickaxe recipe: 2 wood + 3 stone.");return;}
      setInventory(v=>({...v,wood:v.wood-2,stone:v.stone-3}));setTools(v=>({...v,pickaxe:true}));setMessage("Crafted a stone pickaxe!");
    } else {
      if(inventory.food<2){setMessage("Seed packet recipe: 2 food gives you 3 seeds.");return;}
      setInventory(v=>({...v,food:v.food-2,seeds:v.seeds+3}));setMessage("Crafted 3 seeds using 2 food.");
    }
  };
  const build=(type:"fence"|"shelter")=>{
    const woodCost=type==="fence"?4:8, stoneCost=type==="fence"?0:2;
    if(inventory.wood<woodCost||inventory.stone<stoneCost){setMessage(type==="fence"?"Fence recipe: 4 wood.":"Shelter kit recipe: 8 wood + 2 stone.");return;}
    const p=playerPosition.current;
    const x=THREE.MathUtils.clamp(Math.round((p.x+Math.sin(yaw.current)*3)*2)/2,-23,23);
    const z=THREE.MathUtils.clamp(Math.round((p.z+Math.cos(yaw.current)*3)*2)/2,-23,23);
    const tooClose=structures.some(s=>Math.hypot(s.x-x,s.z-z)<2.2);
    if(tooClose){setMessage("That spot is too close to another structure. Move and try again.");return;}
    setInventory(v=>({...v,wood:v.wood-woodCost,stone:v.stone-stoneCost}));
    setStructures(v=>[...v,{id:Date.now(),x,z,type}]);
    setMessage(type==="fence"?"Placed a wooden fence in front of you!":"Built a small shelter in front of you!");
  };

  return <main className="game" style={{position:"relative",width:"100%",height:"100vh",overflow:"hidden"}}>
    <Canvas shadows camera={{position:[0,4,-7],fov:65}} gl={{antialias:true}} onCreated={({gl})=>{gl.setClearColor("#8bc9d5");gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.08;}} onPointerDown={()=>{if(locked)mouseLook.current=true;}} onPointerUp={()=>{mouseLook.current=false;}} onPointerLeave={()=>{mouseLook.current=false;}} style={{cursor:locked?"crosshair":"default"}} >
      <Island yaw={yaw} pitch={pitch} locked={locked} playerPosition={playerPosition} harvested={harvested} plots={plots} structures={structures} movementKeys={movementKeys} onNightChange={setIsNight} fireplaceLit={fireplaceLit}/>
    </Canvas>
    <header className="hud"><div className="brand">FBF <span>ISLAND SURVIVAL</span></div><div className="status">DAY 1 <span>•</span> FARM. BUILD. FIGHT.</div></header>

    <div style={{position:"absolute",top:76,right:20,zIndex:10,display:"flex",flexDirection:"column",gap:9,minWidth:175,padding:16,color:"#fff",background:"rgba(16,27,21,.88)",border:"1px solid rgba(201,229,255,.25)",borderRadius:12,fontFamily:"sans-serif",fontSize:14,pointerEvents:"none"}}>
      <strong style={{fontSize:12,letterSpacing:2,color:"#b9d69a"}}>BACKPACK</strong>
      <span>🪵 Wood: {inventory.wood}</span><span>🪨 Stone: {inventory.stone}</span><span>🍓 Food: {inventory.food}</span><span>🌱 Seeds: {inventory.seeds}</span>
      <small style={{paddingTop:8,color:"#d4e7c8",lineHeight:1.5}}>{message}</small>
    </div>

    {/* Gameplay panels remain clickable while the mouse is locked. */}
    <div style={{position:"absolute",left:20,top:76,zIndex:13,display:"flex",gap:8,flexWrap:"wrap",maxWidth:"55%"}}>
      <button style={{...actionStyle,width:"auto",margin:0}} onClick={()=>setPanel(panel==="farm"?null:"farm")}>🌱 Farming</button>
      <button style={{...actionStyle,width:"auto",margin:0}} onClick={()=>setPanel(panel==="craft"?null:"craft")}>🛠 Crafting</button>
      <button style={{...actionStyle,width:"auto",margin:0}} onClick={()=>setPanel(panel==="build"?null:"build")}>🪵 Building</button>
      <button style={{...actionStyle,width:"auto",margin:0,background:isNight?"#f3a45c":"#71806a",color:isNight?"#2d1a0b":"#fff"}} onClick={igniteFireplace} disabled={!isNight||fireplaceLit}>🔥 {fireplaceLit?"Fire lit":isNight?"Light fire · 1 wood":"Fireplace (night only)"}</button>
    </div>

    {panel && <section style={panelStyle}>
      <button onClick={()=>setPanel(null)} style={{float:"right",border:0,borderRadius:6,padding:"4px 8px",cursor:"pointer"}}>✕</button>
      {panel==="farm" && <>
        <h2 style={{margin:"0 0 6px",fontSize:20}}>🌱 Farm</h2><p style={{fontSize:12,color:"#d4e7c8",lineHeight:1.5}}>You have {inventory.seeds} seeds. Crops take about 30 seconds to mature. Harvesting gives 3 food and 1 seed.</p>
        {plots.map(plot=>{const stage=cropStage(plot);const mature=cropIsMature(plot);const status=plot.plantedAt===null?"Empty":mature?"Ready to harvest":`Growing · stage ${stage}/3`;return <div key={plot.id} style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.13)"}}><strong>Plot {plot.id+1}</strong><div style={{fontSize:12,color:"#d4e7c8",marginTop:3}}>{status}</div>{plot.plantedAt===null?<button style={actionStyle} onClick={()=>handlePlant(plot.id)}>Plant seed</button>:<button style={{...actionStyle,background:mature?"#e5bd62":"#53634b",color:mature?"#292014":"#fff"}} onClick={()=>harvestCrop(plot.id)}>{mature?"Harvest crop":"Check crop"}</button>}</div>;})}
      </>}
      {panel==="craft" && <>
        <h2 style={{margin:"0 0 6px",fontSize:20}}>🛠 Crafting bench</h2><p style={{fontSize:12,color:"#d4e7c8",lineHeight:1.5}}>Spend resources from your backpack to unlock tools and farming materials.</p>
        <div style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.13)"}}><strong>Wooden hoe</strong><div style={{fontSize:12,color:"#d4e7c8"}}>Cost: 3 wood + 1 stone · {tools.hoe?"Crafted":"Needed to plant crops"}</div><button style={actionStyle} onClick={()=>craft("hoe")}>{tools.hoe?"Already crafted":"Craft hoe"}</button></div>
        <div style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.13)"}}><strong>Stone axe</strong><div style={{fontSize:12,color:"#d4e7c8"}}>Cost: 2 wood + 2 stone · {tools.axe?"Crafted":"Tool unlock"}</div><button style={actionStyle} onClick={()=>craft("axe")}>{tools.axe?"Already crafted":"Craft axe"}</button></div>
        <div style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.13)"}}><strong>Stone pickaxe</strong><div style={{fontSize:12,color:"#d4e7c8"}}>Cost: 2 wood + 3 stone · {tools.pickaxe?"Crafted":"Tool unlock"}</div><button style={actionStyle} onClick={()=>craft("pickaxe")}>{tools.pickaxe?"Already crafted":"Craft pickaxe"}</button></div>
        <div style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.13)"}}><strong>Seed packet ×3</strong><div style={{fontSize:12,color:"#d4e7c8"}}>Cost: 2 food · gives 3 seeds</div><button style={actionStyle} onClick={()=>craft("seeds")}>Craft seeds</button></div>
      </>}
      {panel==="build" && <>
        <h2 style={{margin:"0 0 6px",fontSize:20}}>🪵 Build</h2><p style={{fontSize:12,color:"#d4e7c8",lineHeight:1.5}}>Structures are placed a few steps in front of your character. Move to choose a different location.</p>
        <div style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.13)"}}><strong>Wooden fence</strong><div style={{fontSize:12,color:"#d4e7c8"}}>Cost: 4 wood</div><button style={actionStyle} onClick={()=>build("fence")}>Craft & place fence</button></div>
        <div style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.13)"}}><strong>Small shelter</strong><div style={{fontSize:12,color:"#d4e7c8"}}>Cost: 8 wood + 2 stone</div><button style={actionStyle} onClick={()=>build("shelter")}>Build shelter</button></div>
        <p style={{fontSize:11,color:"#b9d69a"}}>Placed structures stay until you restart or refresh the page.</p>
      </>}
    </section>}

    {locked && <div aria-label="Movement controls" style={{position:"absolute",right:20,bottom:78,zIndex:20,display:"grid",gridTemplateColumns:"repeat(3,48px)",gridTemplateRows:"repeat(2,44px)",gap:5,touchAction:"none",userSelect:"none"}}>
      <span />
      <button aria-label="Move forward" style={moveButtonStyle} onPointerDown={e=>{e.preventDefault();setMove("w",true);}} onPointerUp={()=>setMove("w",false)} onPointerLeave={()=>setMove("w",false)} onContextMenu={e=>e.preventDefault()}>▲</button>
      <span />
      <button aria-label="Move left" style={moveButtonStyle} onPointerDown={e=>{e.preventDefault();setMove("a",true);}} onPointerUp={()=>setMove("a",false)} onPointerLeave={()=>setMove("a",false)} onContextMenu={e=>e.preventDefault()}>◀</button>
      <button aria-label="Move backward" style={moveButtonStyle} onPointerDown={e=>{e.preventDefault();setMove("s",true);}} onPointerUp={()=>setMove("s",false)} onPointerLeave={()=>setMove("s",false)} onContextMenu={e=>e.preventDefault()}>▼</button>
      <button aria-label="Move right" style={moveButtonStyle} onPointerDown={e=>{e.preventDefault();setMove("d",true);}} onPointerUp={()=>setMove("d",false)} onPointerLeave={()=>setMove("d",false)} onContextMenu={e=>e.preventDefault()}>▶</button>
    </div>}

    <section className="help-panel"><strong>HOW TO PLAY</strong><p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</p><p><kbd>DRAG</kbd> Look around</p><p><kbd>E</kbd> Gather resources</p><p><kbd>ARROWS</kbd> On-screen movement</p><p><kbd>ESC</kbd> Return to start</p><p><kbd>MENU</kbd> Farm / craft / build</p></section>
    {!locked ? <div className="start-overlay"><div className="start-card"><span className="eyebrow">YOUR ADVENTURE BEGINS</span><h1>FARM. BUILD. FIGHT.</h1><p>Explore the island. Gather resources. Grow your own food.</p><button onClick={startGame}>START EXPLORING</button><small>Drag the world to look around. Use WASD or the on-screen arrows to move.</small></div></div> : <button className="exit-button" onClick={exitGame}>EXIT MOUSE CONTROL</button>}
    <footer className="bottom-hint"><span>◈</span> Find your way. Build your future. Survive.</footer>
  </main>;
}
