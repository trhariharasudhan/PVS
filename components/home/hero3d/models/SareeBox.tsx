"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { BAG, PACK } from "../sceneConfig";
import { lerp, sceneT, smoother, step, type ProgressStore } from "../math";
import type { HeroAssets } from "../useHeroAssets";

/**
 * Packing table + PVS saree box.
 *  - the table slides in as the brand scene ends
 *  - the open box slides in under the folded saree, the saree is lowered in
 *  - the hinged lid closes (PVS mark on top)
 *  - the closed box is lifted, turned upright and lowered into the shopping bag
 */

const [BW, BH, BD] = PACK.box;
const WALL = 0.008;

interface Props {
  progress: ProgressStore;
  assets: HeroAssets;
}

export function SareeBox({ progress, assets: a }: Props) {
  const table = useRef<THREE.Group>(null);
  const box = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = progress.value;
    const tB = sceneT(p, "brand");
    const tP = sceneT(p, "packaging");
    const [tx, , tz] = PACK.tablePos;

    // ---- table ----
    if (table.current) {
      const inT = smoother(step(tB, 0.6, 1));
      const outT = smoother(sceneT(p, "final"));
      table.current.visible = p > 0.62;
      table.current.position.set(lerp(tx - 4, tx, inT) - 3 * outT, 0, tz);
    }

    // ---- box ----
    const g = box.current;
    if (!g) return;
    g.visible = tP > 0.44 && p < 0.985;
    if (!g.visible) return;
    const slide = smoother(step(tP, 0.45, 0.53)); // in from behind, under the lifted saree
    const close = smoother(step(tP, 0.62, 0.7));
    const up = smoother(step(tP, 0.72, 0.8)); // lift + travel to the bag + stand upright
    const down = smoother(step(tP, 0.8, 0.92)); // lower into the bag
    const [bx, , bz] = BAG.position;

    let x: number = tx;
    let y: number = PACK.tableTop;
    let z = lerp(tz - 1.4, tz, slide);
    x = lerp(x, bx, up);
    y = lerp(y, BAG.height + 0.32, up);
    z = lerp(z, bz, up);
    y = lerp(y, 0.03 + BD / 2, down); // standing on its long edge at the bag bottom
    g.position.set(x, y, z);
    // upright: rotate about X so the lid faces the camera, long side vertical
    g.rotation.set((Math.PI / 2) * up, 0, 0);
    if (lid.current) lid.current.rotation.x = lerp(-1.9, 0, close);
  });

  return (
    <>
      {/* Packing table (teak top, turned legs) */}
      <group ref={table} visible={false}>
        <RoundedBox args={[PACK.tableSize[0], 0.05, PACK.tableSize[1]]} radius={0.012} smoothness={3} position={[0, PACK.tableTop - 0.025, 0]} castShadow receiveShadow material={a.wood} />
        <mesh position={[0, PACK.tableTop - 0.08, 0]} material={a.woodDark} castShadow>
          <boxGeometry args={[PACK.tableSize[0] - 0.12, 0.08, PACK.tableSize[1] - 0.12]} />
        </mesh>
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * (PACK.tableSize[0] / 2 - 0.08), (PACK.tableTop - 0.05) / 2, sz * (PACK.tableSize[1] / 2 - 0.08)]} material={a.woodDark} castShadow>
              <cylinderGeometry args={[0.03, 0.022, PACK.tableTop - 0.05, 12]} />
            </mesh>
          )),
        )}
      </group>

      {/* Box: origin at the bottom centre of the tray */}
      <group ref={box} visible={false}>
        {/* tray: floor + four walls, ivory lining inside */}
        <mesh position={[0, WALL / 2, 0]} material={a.boxInner} receiveShadow>
          <boxGeometry args={[BW, WALL, BD]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={`x${s}`} position={[(s * (BW - WALL)) / 2, BH / 2, 0]} material={a.boxBody} castShadow receiveShadow>
            <boxGeometry args={[WALL, BH, BD]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`z${s}`} position={[0, BH / 2, (s * (BD - WALL)) / 2]} material={a.boxBody} castShadow receiveShadow>
            <boxGeometry args={[BW, BH, WALL]} />
          </mesh>
        ))}
        {/* lid hinged on the back edge; PVS mark faces up when closed */}
        <group ref={lid} position={[0, BH, -BD / 2]}>
          <mesh position={[0, 0.0068, BD / 2 + 0.004]} rotation={[-Math.PI / 2, 0, 0]} material={a.boxLid} castShadow>
            <planeGeometry args={[BW + 0.012, BD + 0.012]} />
          </mesh>
          <mesh position={[0, 0.002, BD / 2 + 0.004]} material={a.boxBody}>
            <boxGeometry args={[BW + 0.012, 0.008, BD + 0.012]} />
          </mesh>
          {/* lid skirt */}
          <mesh position={[0, -0.02, BD + 0.01]} material={a.boxBody} castShadow>
            <boxGeometry args={[BW + 0.014, 0.04, 0.006]} />
          </mesh>
        </group>
      </group>
    </>
  );
}
