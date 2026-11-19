"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BAG, FOLD, PACK } from "../sceneConfig";
import { lerp, range, sceneT, smoother, type ProgressStore } from "../math";
import type { HeroAssets } from "../useHeroAssets";

/**
 * PVS saree box (no table — the whole packing happens in the studio air):
 *  - the open box glides in from the left and rises under the floating, folded saree
 *  - the saree is lowered in; two ivory tissue flaps fold over it
 *  - the hinged lid closes with a soft bounce (PVS mark on top)
 *  - final scene: the closed box lifts, turns upright and is lowered into the shopping bag
 */

const [BW, BH, BD] = PACK.box;
const WALL = 0.008;

/** Ease-out with a small overshoot (lid / box settling). */
const backOut = (t: number, s = 1.6) => {
  const x = THREE.MathUtils.clamp(t, 0, 1) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** Lid angle: swings shut, then two small, decaying hops as it lands (never dips into the box). */
const lidAngle = (t: number) => {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  const shut = smoother(range(x, 0, 0.5));
  const hop = 0.16 * Math.sin(Math.PI * range(x, 0.5, 0.72)) + 0.05 * Math.sin(Math.PI * range(x, 0.72, 0.86));
  return lerp(-1.95, 0, shut) - hop;
};

interface Props {
  progress: ProgressStore;
  assets: HeroAssets;
}

export function SareeBox({ progress, assets: a }: Props) {
  const box = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const flapL = useRef<THREE.Group>(null);
  const flapR = useRef<THREE.Group>(null);

  useFrame((state) => {
    const p = progress.value;
    const tP = sceneT(p, "packaging");
    const tF = sceneT(p, "final");
    const at = (k: keyof typeof FOLD) => range(tP, FOLD[k][0], FOLD[k][1]);

    const g = box.current;
    if (!g) return;
    g.visible = tP > FOLD.boxIn[0] && p < 0.995;
    if (!g.visible) return;

    const arrive = at("boxIn");
    const glide = backOut(arrive, 1.1); // in from the lower left, settles with a little overshoot
    const up = smoother(range(tF, 0.0, 0.42)); // lift + travel to the bag + stand upright
    const down = smoother(range(tF, 0.42, 0.78)); // lower into the bag
    const [px, py, pz] = PACK.boxPos;
    const [bx, , bz] = BAG.position;

    // arc: starts low at the left, swings up under the saree
    let x = lerp(px - 1.7, px, glide);
    let y = lerp(py - 0.55, py, glide) + Math.sin(Math.PI * Math.min(arrive, 1)) * 0.12;
    let z = lerp(pz + 0.4, pz, glide);
    // tiny hover breath while waiting for the saree (stops once it carries it)
    y += Math.sin(state.clock.elapsedTime * 1.1) * 0.006 * (1 - smoother(at("lower")));
    x = lerp(x, bx, up);
    y = lerp(y, BAG.height + 0.36, up);
    z = lerp(z, bz, up);
    y = lerp(y, 0.03 + BD / 2, down); // standing on its long edge at the bag bottom
    g.position.set(x, y, z);
    g.rotation.set((Math.PI / 2) * up, lerp(-0.9, 0, smoother(arrive)) + 0.25 * Math.sin(Math.PI * up), 0);

    if (lid.current) lid.current.rotation.x = lidAngle(at("lid"));
    const tissue = smoother(at("tissue"));
    if (flapL.current) flapL.current.rotation.z = lerp(-1.75, -0.02, tissue);
    if (flapR.current) flapR.current.rotation.z = lerp(1.75, 0.02, smoother(range(at("tissue"), 0.25, 1)));
  });

  return (
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
      {/* gold rim on the tray edge */}
      <mesh position={[0, BH - 0.003, BD / 2 + 0.0005]} material={a.brass}>
        <boxGeometry args={[BW + 0.002, 0.006, 0.002]} />
      </mesh>

      {/* tissue flaps, hinged on the long inner walls; they fold over the saree */}
      {[
        { ref: flapL, s: -1 },
        { ref: flapR, s: 1 },
      ].map(({ ref, s }) => (
        <group key={s} ref={ref} position={[(s * (BW - 2 * WALL)) / 2, BH - 0.012, 0]}>
          <mesh position={[(-s * BW) / 4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={a.tissue} castShadow>
            <planeGeometry args={[BW / 2 + 0.02, BD - 0.03]} />
          </mesh>
        </group>
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
  );
}
