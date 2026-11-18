"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { renderSareeCanvas, type SareeDesign } from "@/lib/saree/render";

/**
 * A saree spread on a display rod, the way shops show it on the wall: borders along the
 * top and bottom, the pallu at the right end, soft curtain folds that deepen towards the
 * lower border. Colour + ORM maps come from the same renderer as the flat view,
 * so zari reads as metal and silk keeps its sheen. Drag to turn.
 * Renders on demand (only while dragging / when the design changes) to save battery.
 *
 * Loaded with next/dynamic (ssr: false) only when the device can run WebGL.
 */

const SPAN = 2.4; // visible length on the rod, metres (pallu + some body)
const DROP = 1.15; // ≈ real saree width in metres (border to border)
const SHOWN = 0.45; // fraction of the saree length shown (the pallu end)

function useSareeMaps(design: SareeDesign) {
  const key = JSON.stringify(design);
  const maps = useMemo(() => {
    // Full saree at high detail; the UVs below show only the pallu end.
    const color = renderSareeCanvas(2600, 760, design, "color");
    const orm = renderSareeCanvas(2600, 760, design, "orm");
    const c = new THREE.CanvasTexture(color);
    c.colorSpace = THREE.SRGBColorSpace;
    c.anisotropy = 8;
    const o = new THREE.CanvasTexture(orm);
    o.colorSpace = THREE.NoColorSpace;
    return { c, o };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => {
    maps.c.dispose();
    maps.o.dispose();
  }, [maps]);
  return maps;
}

function makeCloth() {
  const g = new THREE.PlaneGeometry(SPAN, DROP, 200, 60);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const along = x / SPAN + 0.5; // 0 left … 1 right (pallu end)
    const down = (DROP / 2 - y) / DROP; // 0 at the rod, 1 at the lower border
    // curtain folds: broad waves + finer pleats, deeper away from the rod
    const amp = 0.008 + 0.05 * Math.pow(down, 1.4);
    const z =
      Math.sin(along * Math.PI * 9 + down * 0.8) * amp +
      Math.sin(along * Math.PI * 23 + 1.3) * amp * 0.22 +
      down * down * 0.04;
    // the cloth gathers slightly between pleats, so the hem is a touch narrower
    pos.setXYZ(i, x * (1 - down * 0.015), y - Math.abs(Math.sin(along * Math.PI * 9)) * 0.006 * down, z);
    // texture: u along the saree length (pallu at the right), v across the width
    uv.setXY(i, 1 - SHOWN + SHOWN * along, 1 - down);
  }
  g.computeVertexNormals();
  return g;
}

function Cloth({ design }: { design: SareeDesign }) {
  const { c, o } = useSareeMaps(design);
  const geom = useMemo(makeCloth, []);
  useEffect(() => () => geom.dispose(), [geom]);
  const ref = useRef<THREE.Mesh>(null);
  // Re-render once when the design (textures) changes — the canvas renders on demand only.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [c, invalidate]);
  const sheen = design.sheen ?? 1;
  return (
    <mesh ref={ref} geometry={geom} castShadow receiveShadow position={[0, 0, 0]}>
      <meshPhysicalMaterial
        map={c}
        aoMap={o}
        roughnessMap={o}
        metalnessMap={o}
        roughness={1}
        metalness={1}
        sheen={0.6 + sheen * 0.4}
        sheenRoughness={0.45}
        sheenColor={new THREE.Color("#ffe8c8")}
        side={THREE.DoubleSide}
        envMapIntensity={1.35}
      />
    </mesh>
  );
}

function Rod() {
  return (
    <group position={[0, DROP / 2 + 0.015, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, SPAN * 1.08, 24]} />
        <meshStandardMaterial color="#5a3420" roughness={0.55} metalness={0.05} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * SPAN * 1.08) / 2, 0, 0]} castShadow>
          <sphereGeometry args={[0.03, 20, 16]} />
          <meshStandardMaterial color="#c9a24e" roughness={0.3} metalness={1} />
        </mesh>
      ))}
    </group>
  );
}

export default function SareeDrape3D({ design, label }: { design: SareeDesign; label: string }) {
  return (
    <div className="relative h-full w-full" role="img" aria-label={label}>
      <Canvas
        frameloop="demand"
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.05, 3.05], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <color attach="background" args={["#f4ecdd"]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[1.6, 2.4, 2.2]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-2, 0.5, 1]} intensity={0.4} color="#ffd9a8" />
        <Environment resolution={128} frames={1}>
          {/* warm room tone so metallic zari reflects gold, not a black void */}
          <color attach="background" args={["#a88a62"]} />
          <Lightformer form="rect" intensity={1.4} color="#fff1dc" position={[0, 3, 2]} scale={[5, 2, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#ffd29a" position={[-3, 1, 1]} scale={[2, 3, 1]} rotation-y={Math.PI / 2} />
          <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[3, 0, 2]} scale={[2, 3, 1]} rotation-y={-Math.PI / 2} />
        </Environment>
        <Rod />
        <Cloth design={design} />
        {/* back wall catching the shadow */}
        <mesh position={[0, 0, -0.35]} receiveShadow>
          <planeGeometry args={[8, 6]} />
          <shadowMaterial opacity={0.18} />
        </mesh>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2 - 0.25}
          maxPolarAngle={Math.PI / 2 + 0.2}
          minAzimuthAngle={-0.6}
          maxAzimuthAngle={0.6}
          rotateSpeed={0.6}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
