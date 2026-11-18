"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { LOOM } from "../sceneConfig";
import type { HeroAssets } from "../useHeroAssets";
import { useDisposable } from "../useDisposable";
import { borderCount, liftSign, threadX } from "../jacquard";

/**
 * Border jacquards (one above each border), as on South Indian silk-saree looms.
 *
 *  - Punch-card chain: one card per weft row; the chain advances one card per pick
 *    and the square card cylinder turns a quarter turn.
 *  - Griffe lever rocks as the shed opens.
 *  - Harness cords (with lingo weights below the warp) lift ONLY the border threads the
 *    current card selects, so the motif pattern is visible in the cords themselves.
 */

export interface MechState {
  /** Current pick index (integer) and continuous progress (pick + fraction). */
  pick: number;
  advance: number;
  /** Shed opening 0..shedOpen */
  shed: number;
  weaving: boolean;
}

const CARDS_PER_CHAIN = 30;
const HARNESS_TOP = LOOM.jacquardY - 0.12;
const LINGO_Y = 0.42;
const HARNESS_LEN = HARNESS_TOP - LINGO_Y;

function cardTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#d8c49a";
  ctx.fillRect(0, 0, 256, 32);
  ctx.fillStyle = "#2a1a10";
  for (let x = 8; x < 248; x += 9) {
    for (let y = 6; y < 28; y += 8) {
      if ((x * 7 + y * 13) % 5 < 2) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Jacquard({ assets: a, warpThreads, mech }: { assets: HeroAssets; warpThreads: number; mech: React.MutableRefObject<MechState> }) {
  const cards = useRef<THREE.InstancedMesh>(null);
  const cords = useRef<THREE.InstancedMesh>(null);
  const lingos = useRef<THREE.InstancedMesh>(null);
  const cylinders = useRef<(THREE.Group | null)[]>([]);
  const levers = useRef<(THREE.Group | null)[]>([]);
  const last = useRef({ advance: -1, shed: -1 });

  const nBorder = borderCount(warpThreads);
  const borderThreads = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < nBorder; i++) out.push(i);
    for (let i = warpThreads - nBorder; i < warpThreads; i++) out.push(i);
    return out;
  }, [nBorder, warpThreads]);

  // Each jacquard sits above its border.
  const headX = useMemo(() => [threadX(Math.floor(nBorder / 2), warpThreads), threadX(warpThreads - 1 - Math.floor(nBorder / 2), warpThreads)], [nBorder, warpThreads]);

  const res = useDisposable(
    () => {
      const tex = cardTexture();
      const cardMat = new THREE.MeshStandardMaterial({ map: tex, color: "#9c8460", roughness: 0.9 }); // aged pasteboard
      const cardGeo = new THREE.BoxGeometry(0.04, 0.004, 0.3);
      const cordGeo = new THREE.CylinderGeometry(0.0018, 0.0018, HARNESS_LEN, 4, 1, true);
      const lingoGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.14, 6);
      const cordMat = new THREE.MeshStandardMaterial({ color: "#ebe3cf", roughness: 0.9 });
      // closed loop for each card chain (local: x outward, y down), hung from the cylinder
      const loop = (side: number) =>
        new THREE.CatmullRomCurve3(
          [
            [0, 0],
            [0.09, -0.08],
            [0.12, -0.35],
            [0.1, -0.62],
            [0.03, -0.72],
            [-0.04, -0.62],
            [-0.05, -0.35],
            [-0.06, -0.08],
          ].map(([x, y]) => new THREE.Vector3(x * side, y, 0)),
          true,
          "centripetal",
        );
      return { tex, cardMat, cardGeo, cordGeo, lingoGeo, cordMat, loops: [loop(-1), loop(1)] };
    },
    [],
    (r) => [r.tex, r.cardMat, r.cardGeo, r.cordGeo, r.lingoGeo, r.cordMat],
  );

  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), z: new THREE.Vector3(0, 0, 1) }),
    [],
  );

  useFrame(() => {
    const { pick, advance, shed } = mech.current;
    const l = last.current;
    if (Math.abs(advance - l.advance) < 1e-4 && Math.abs(shed - l.shed) < 1e-5) return;
    l.advance = advance;
    l.shed = shed;
    const { m, p, t, n, z } = tmp;

    // Card cylinders turn a quarter per pick; levers rock with the shed.
    cylinders.current.forEach((c) => c && (c.rotation.z = advance * (Math.PI / 2)));
    levers.current.forEach((g, k) => g && (g.rotation.z = (k === 0 ? 1 : -1) * (shed / LOOM.shedOpen) * 0.22));

    // Punch-card chains move one card per pick
    if (cards.current) {
      let idx = 0;
      for (let side = 0; side < 2; side++) {
        const curve = res.loops[side];
        const sx = side === 0 ? -1 : 1;
        const ox = headX[side] + sx * 0.24;
        for (let k = 0; k < CARDS_PER_CHAIN; k++) {
          const u = (((k + advance) / CARDS_PER_CHAIN) % 1 + 1) % 1;
          curve.getPointAt(u, p);
          curve.getTangentAt(u, t);
          n.crossVectors(z, t).normalize();
          m.makeBasis(t, n, z);
          m.setPosition(ox + p.x, LOOM.jacquardY + p.y, LOOM.harnessZ + p.z);
          cards.current.setMatrixAt(idx++, m);
        }
      }
      cards.current.instanceMatrix.needsUpdate = true;
    }

    // Harness cords + lingo weights: lifted cords move up, lowered cords move down
    if (cords.current && lingos.current) {
      borderThreads.forEach((i, k) => {
        const off = shed * liftSign(i, warpThreads, pick);
        const x = threadX(i, warpThreads);
        m.makeTranslation(x, LINGO_Y + HARNESS_LEN / 2 + off, LOOM.harnessZ);
        cords.current!.setMatrixAt(k, m);
        m.makeTranslation(x, LINGO_Y + off, LOOM.harnessZ);
        lingos.current!.setMatrixAt(k, m);
      });
      cords.current.instanceMatrix.needsUpdate = true;
      lingos.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Raised jacquard frame (gantry) */}
      {[-0.82, 0.82].map((x) =>
        [LOOM.harnessZ - 0.26, LOOM.harnessZ + 0.22].map((z) => (
          <RoundedBox key={`${x}${z}`} args={[0.06, LOOM.jacquardY - 1.82 + 0.1, 0.06]} radius={0.01} smoothness={2} position={[x, (LOOM.jacquardY + 1.82) / 2 - 0.05, z]} material={a.wood} castShadow />
        )),
      )}
      <RoundedBox args={[1.8, 0.07, 0.07]} radius={0.012} smoothness={2} position={[0, LOOM.jacquardY - 0.2, LOOM.harnessZ - 0.26]} material={a.wood} castShadow />
      <RoundedBox args={[1.8, 0.07, 0.07]} radius={0.012} smoothness={2} position={[0, LOOM.jacquardY - 0.2, LOOM.harnessZ + 0.22]} material={a.wood} castShadow />

      {/* Comber boards (cords pass through these) */}
      {headX.map((x, k) => (
        <mesh key={`comb${k}`} position={[x, LOOM.comberY, LOOM.harnessZ]} material={a.woodDark} castShadow>
          <boxGeometry args={[0.32, 0.025, 0.12]} />
        </mesh>
      ))}

      {/* Jacquard heads */}
      {headX.map((x, k) => (
        <group key={`head${k}`} position={[x, LOOM.jacquardY, LOOM.harnessZ]}>
          <RoundedBox args={[0.34, 0.3, 0.44]} radius={0.02} smoothness={3} material={a.woodDark} castShadow />
          {/* iron side plates and hooks rail */}
          {[-0.18, 0.18].map((dz) => (
            <mesh key={dz} position={[0, 0, dz * 1.25]} material={a.metal}>
              <boxGeometry args={[0.36, 0.32, 0.012]} />
            </mesh>
          ))}
          <mesh position={[0, -0.17, 0]} material={a.metal}>
            <boxGeometry args={[0.3, 0.02, 0.4]} />
          </mesh>
          {/* griffe lever on top */}
          <group ref={(g) => { levers.current[k] = g; }} position={[0, 0.18, 0]}>
            <mesh position={[(k === 0 ? 1 : -1) * 0.14, 0.02, 0]} material={a.wood} castShadow>
              <boxGeometry args={[0.38, 0.035, 0.05]} />
            </mesh>
          </group>
          {/* square card cylinder on the outer side */}
          <group position={[(k === 0 ? -1 : 1) * 0.24, 0, 0]} ref={(g) => { cylinders.current[k] = g; }}>
            <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]} material={a.metal} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.38, 4]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Punch-card chains (instanced) */}
      <instancedMesh ref={cards} args={[res.cardGeo, res.cardMat, CARDS_PER_CHAIN * 2]} frustumCulled={false} castShadow />

      {/* Harness cords + lingo weights (instanced) */}
      <instancedMesh ref={cords} args={[res.cordGeo, res.cordMat, borderThreads.length]} frustumCulled={false} />
      <instancedMesh ref={lingos} args={[res.lingoGeo, a.metal, borderThreads.length]} frustumCulled={false} />
    </group>
  );
}
