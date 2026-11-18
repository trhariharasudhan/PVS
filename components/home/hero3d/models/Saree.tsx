"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOOM, PACK, SAREE, type QualitySettings } from "../sceneConfig";
import { lerp, sceneT, smoother, step, type ProgressStore } from "../math";
import type { HeroAssets } from "../useHeroAssets";
import { useDisposable } from "../useDisposable";

/**
 * The finished saree as a deformable cloth (CPU vertex deformation, no physics engine):
 *  1. unrolls from the loom's cloth beam and rises onto a display rod (drapes gently)
 *  2. brand scene: a soft light sweeps across "PVS SILKS", which is WOVEN into the body
 *     (part of the texture — it comes off the loom with the cloth)
 *  3. packing, the way shops fold a saree: laid flat on the table, folded in half along
 *     its width, then folded flat panel-over-panel (zig-zag) into a neat rectangle,
 *     which is lowered into the PVS box (see SareeBox).
 */

const L = SAREE.length;
const H = SAREE.height;
const N_FOLDS = SAREE.folds;
const PANEL = L / N_FOLDS;
const ROLL_R = 0.05;
const LAYER = 0.006; // cloth thickness per layer (prevents z-fighting in the stack)

interface DeformParams {
  unroll: number; // 0 rolled … 1 fully open
  amp: number; // drape wave amplitude
  half: number; // 0 open … 1 folded in half along the width
  fold: number; // 0 flat … 1 zig-zag folded flat
  time: number;
}

const smoothF = (t: number) => t * t * (3 - 2 * t);

/** Deform one saree-local point (x along length, y across width, z = cloth normal). */
function deform(x0: number, y0: number, prm: DeformParams, out: THREE.Vector3) {
  // --- drape wave (top edge pinned to the rod), fades out while packing ---
  const hang = Math.pow(THREE.MathUtils.clamp(0.5 - y0 / H, 0, 1), 0.85);
  let x = x0;
  let y = y0;
  let z =
    prm.amp *
    hang *
    (Math.sin(x0 * 2.3 + prm.time * 0.7 + y0 * 0.8) * 0.65 + Math.sin(x0 * 5.1 - prm.time * 0.45) * 0.25);

  // --- unroll: everything right of xr is wrapped on a small spiral roll ---
  const xr = -L / 2 + prm.unroll * L;
  if (x0 > xr) {
    const s = x0 - xr;
    const R = ROLL_R + 0.0025 * (s / (2 * Math.PI * ROLL_R));
    const phi = s / R;
    x = xr + R * Math.sin(phi);
    z += R * (1 - Math.cos(phi));
  }
  x += (L / 2) * (1 - prm.unroll);

  // --- 1st fold: top half of the width folds over onto the bottom half (crease at y = 0) ---
  if (prm.half > 0 && y0 > 0) {
    const a = Math.PI * prm.half * 0.995;
    const yy = y;
    y = yy * Math.cos(a);
    z = z + yy * Math.sin(a) + LAYER * prm.half;
  }
  // keep the half-folded cloth centred
  y += (H / 4) * prm.half;

  // --- 2nd fold: the way a saree is folded on a table — the pallu end is folded over onto the
  // next panel, then that pair over the next, and so on (one crease at a time), until the
  // whole saree is one neat rectangle. Each fold lifts the cloth up and over its crease.
  if (prm.fold > 0) {
    const creases = N_FOLDS - 1;
    for (let j = 1; j <= creases; j++) {
      const f = THREE.MathUtils.clamp(prm.fold * creases - (j - 1), 0, 1);
      if (f <= 0) break;
      const c = L / 2 - j * PANEL; // crease line (does not move: earlier folds lie beyond it)
      if (x0 <= c) continue;
      const a = Math.PI * smoothF(f);
      const dx = x - c;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const lift = ((1 - ca) / 2) * (2 * z + LAYER * 2); // keep folded layers above the base panel
      x = c + dx * ca - z * sa;
      z = dx * sa + z * ca + lift;
    }
    // slide the finished stack back to the centre
    x += (L / 2 - PANEL / 2) * smoothF(prm.fold);
  }
  out.set(x, y, z);
}

interface Props {
  progress: ProgressStore;
  quality: QualitySettings;
  assets: HeroAssets;
}

export function Saree({ progress, quality, assets: a }: Props) {
  const group = useRef<THREE.Group>(null);
  const cloth = useRef<THREE.Mesh>(null);
  const rod = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.PointLight>(null);

  const res = useDisposable(
    () => {
      const [sx, sy] = quality.clothSegments;
      // extra segments along the length so the zig-zag creases stay crisp
      const geo = new THREE.PlaneGeometry(L, H, Math.max(sx, N_FOLDS * 16), sy);
      const base = (geo.attributes.position.array as Float32Array).slice();
      return { geo, base };
    },
    [quality.clothSegments],
    (r) => [r.geo],
  );

  const scratch = useRef({ v: new THREE.Vector3() });

  useFrame((state) => {
    const g = group.current;
    if (!g || !cloth.current) return;
    const p = progress.value;
    const tS = sceneT(p, "saree");
    const tB = sceneT(p, "brand");
    const tP = sceneT(p, "packaging");

    // Hidden once the box lid has closed over it.
    g.visible = p > 0.4 && tP < 0.71;
    if (!g.visible) return;

    // ---------- pose ----------
    const rise = smoother(step(tS, 0, 0.6));
    const [px, py, pz] = SAREE.presentPosition;
    const start = [0, LOOM.clothBeamY, LOOM.breastBeamZ + 0.08];

    const lay = smoother(step(tP, 0.0, 0.15)); // display rod → lying flat on the table
    const lift = smoother(step(tP, 0.47, 0.53)); // stack lifts while the box slides in under it
    const into = smoother(step(tP, 0.54, 0.62)); // …then is lowered into the box
    const [tx, , tz] = PACK.tablePos;
    const tableY = PACK.tableTop + 0.012;

    let x = lerp(start[0], px, rise);
    let y = lerp(start[1], py, rise);
    let z = lerp(start[2], pz, rise);
    x = lerp(x, tx, lay);
    y = lerp(y, tableY + 0.03, lay);
    z = lerp(z, tz, lay);
    y += 0.28 * lift * (1 - into);
    y = lerp(y, PACK.tableTop + 0.022, into); // box floor sits on the table top
    g.position.set(x, y, z);
    // standing (on the rod) → lying face-up on the table
    g.rotation.set(-Math.PI / 2 * lay, 0, (Math.PI / 2) * (1 - rise));
    g.scale.setScalar(lerp(0.32, 1, step(tS, 0, 0.35)) * lerp(1, PACK.sareeScale, lay));

    // ---------- cloth deformation ----------
    const prm: DeformParams = {
      unroll: step(tS, 0.08, 0.7),
      amp: 0.075 * step(tS, 0.4, 0.8) * lerp(1, 0.3, step(tB, 0, 0.35)) * (1 - lay),
      half: step(tP, 0.15, 0.31),
      fold: step(tP, 0.3, 0.5),
      time: state.clock.elapsedTime,
    };

    const pos = res.geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const v = scratch.current.v;
    for (let i = 0; i < arr.length; i += 3) {
      deform(res.base[i], res.base[i + 1], prm, v);
      arr[i] = v.x;
      arr[i + 1] = v.y;
      arr[i + 2] = v.z;
    }
    pos.needsUpdate = true;
    res.geo.computeVertexNormals();
    res.geo.computeBoundingSphere();

    // ---------- display rod ----------
    if (rod.current) {
      const show = step(tS, 0.45, 0.8) * (1 - lay);
      rod.current.visible = show > 0.01;
      rod.current.scale.set(Math.max(show, 0.001), 1, 1);
    }

    // ---------- brand: light sweep across the woven name ----------
    if (sweep.current) {
      const on = step(tB, 0.05, 0.25) * (1 - step(tB, 0.85, 1));
      sweep.current.intensity = 5 * on;
      sweep.current.position.set(lerp(-1.4, 1.4, step(tB, 0.1, 0.8)), 0.4, 1.2);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={cloth} geometry={res.geo} material={a.silk} castShadow receiveShadow frustumCulled={false} />
      <pointLight ref={sweep} position={[0, 0.4, 1.2]} intensity={0} color="#fff1d6" distance={2.6} decay={2} />
      <group ref={rod} position={[0, H / 2 + 0.015, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={a.brass} castShadow>
          <cylinderGeometry args={[0.014, 0.014, L + 0.2, 16]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (L / 2 + 0.11), 0, 0]} material={a.brass}>
            <sphereGeometry args={[0.03, 16, 12]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
