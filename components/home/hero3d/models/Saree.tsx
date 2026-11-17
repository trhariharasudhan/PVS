"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BAG, LOOM, SAREE, type QualitySettings } from "../sceneConfig";
import { lerp, sceneT, smoother, step, type ProgressStore } from "../math";
import type { HeroAssets } from "../useHeroAssets";
import { useDisposable } from "../useDisposable";

/**
 * The finished saree as a deformable cloth (CPU vertex deformation, no physics engine):
 *  1. unrolls from the loom's cloth beam and rises into a hanging presentation
 *  2. gentle drape waves (hangs from a gold rod, bottom moves most)
 *  3. receives the embroidered "PVS SILKS" brand mark (reveals left → right)
 *  4. accordion-folds into a neat stack and drops into the shopping bag
 */

const L = SAREE.length;
const H = SAREE.height;
const N_FOLDS = SAREE.folds;
const PANEL = L / N_FOLDS;
const ROLL_R = 0.05;

/** Brand mark placement in saree-local coordinates (on the red body, high contrast). */
const MARK = { x: 0.05, y: -0.06, w: 1.3, h: 0.39 };

interface DeformParams {
  unroll: number; // 0 rolled … 1 fully open
  amp: number; // drape wave amplitude
  fold: number; // 0 flat … 1 folded stack
  time: number;
}

/** Deform one saree-local point. Writes into `out`. Shared by cloth and brand mark so they stay in sync. */
function deform(x0: number, y0: number, prm: DeformParams, out: THREE.Vector3) {
  // --- drape wave (top edge pinned to the rod) ---
  const hang = Math.pow(THREE.MathUtils.clamp(0.5 - y0 / H, 0, 1), 0.85);
  let x = x0;
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
  // keep the visible part centred while it opens
  x += (L / 2) * (1 - prm.unroll);

  // --- accordion fold into a stack (panels end up standing along Z) ---
  if (prm.fold > 0) {
    const phi = prm.fold * (Math.PI / 2) * 0.985;
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    const u = THREE.MathUtils.clamp(x + L / 2, 0, L);
    const i = Math.min(N_FOLDS - 1, Math.floor(u / PANEL));
    const lu = u - i * PANEL;
    const dirZ = i % 2 === 0 ? -sn : sn;
    const startZ = i % 2 === 0 ? 0 : -PANEL * sn;
    const fx = -L / 2 + i * PANEL * c + lu * c;
    const fz = startZ + lu * dirZ;
    // centre the folded stack
    x = fx + (L / 2) * (1 - c);
    z = z * (1 - prm.fold) + fz + (PANEL * sn) / 2 + i * 0.004 * prm.fold;
  }
  out.set(x, y0, z);
}

interface Props {
  progress: ProgressStore;
  quality: QualitySettings;
  assets: HeroAssets;
}

export function Saree({ progress, quality, assets: a }: Props) {
  const group = useRef<THREE.Group>(null);
  const cloth = useRef<THREE.Mesh>(null);
  const mark = useRef<THREE.Mesh>(null);
  const rod = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);

  const res = useDisposable(
    () => {
      const [sx, sy] = quality.clothSegments;
      const geo = new THREE.PlaneGeometry(L, H, sx, sy);
      const base = (geo.attributes.position.array as Float32Array).slice();
      const markGeo = new THREE.PlaneGeometry(MARK.w, MARK.h, 24, 6);
      const markBase = (markGeo.attributes.position.array as Float32Array).slice();
      const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
      a.brandMark.clippingPlanes = [clip];
      return { geo, base, markGeo, markBase, clip };
    },
    [quality.clothSegments, a.brandMark],
    (r) => [r.geo, r.markGeo],
  );

  const scratch = useRef({ v: new THREE.Vector3(), last: { p: -1, t: -1 } });

  useFrame((state) => {
    const g = group.current;
    if (!g || !cloth.current) return;
    const p = progress.value;
    const tS = sceneT(p, "saree");
    const tB = sceneT(p, "brand");
    const tP = sceneT(p, "packaging");

    g.visible = p > 0.4 && tP < 0.86;
    if (!g.visible) return;
    gl.localClippingEnabled = true;

    // ---------- pose ----------
    const rise = smoother(step(tS, 0, 0.6));
    const [px, py, pz] = SAREE.presentPosition;
    const startPos = [0, LOOM.clothBeamY, LOOM.breastBeamZ + 0.08];

    const fold = step(tP, 0.02, 0.38);
    const hover = step(tP, 0.12, 0.45);
    const insert = smoother(step(tP, 0.5, 0.8));
    const [bx, , bz] = BAG.position;

    let x = lerp(startPos[0], px, rise);
    let y = lerp(startPos[1], py, rise);
    let z = lerp(startPos[2], pz, rise);
    x = lerp(x, bx, hover);
    y = lerp(lerp(y, 1.72, hover), 0.62, insert);
    z = lerp(z, bz, hover);
    g.position.set(x, y, z);
    g.rotation.set(0, (Math.PI / 2) * fold, (Math.PI / 2) * (1 - rise));
    g.scale.setScalar(lerp(0.32, 1, step(tS, 0, 0.35)) * lerp(1, 0.72, fold));

    // ---------- cloth deformation ----------
    const prm: DeformParams = {
      unroll: step(tS, 0.08, 0.7),
      amp: 0.075 * step(tS, 0.4, 0.8) * lerp(1, 0.3, step(tB, 0, 0.35)) * (1 - step(tP, 0, 0.2)),
      fold,
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

    // ---------- gold hanging rod ----------
    if (rod.current) {
      const show = step(tS, 0.45, 0.8) * (1 - step(tP, 0, 0.12));
      rod.current.visible = show > 0.01;
      rod.current.scale.set(Math.max(show, 0.001), 1, 1);
    }

    // ---------- brand mark ----------
    if (mark.current) {
      const reveal = step(tB, 0.1, 0.6);
      const visible = tB > 0.08 && tP < 0.04;
      mark.current.visible = visible;
      if (visible) {
        const mArr = res.markGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < mArr.length; i += 3) {
          deform(MARK.x + res.markBase[i], MARK.y + res.markBase[i + 1], prm, v);
          mArr[i] = v.x - MARK.x;
          mArr[i + 1] = v.y - MARK.y;
          mArr[i + 2] = v.z + 0.006;
        }
        res.markGeo.attributes.position.needsUpdate = true;
        res.markGeo.computeVertexNormals();
        // world-space clip plane: keep x <= revealX (saree faces +Z here, no rotation)
        const left = g.position.x + (MARK.x - MARK.w / 2) * g.scale.x;
        res.clip.constant = left + reveal * MARK.w * g.scale.x + 0.001;
      }
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={cloth} geometry={res.geo} material={a.silk} castShadow receiveShadow frustumCulled={false} />
      <mesh ref={mark} geometry={res.markGeo} material={a.brandMark} position={[MARK.x, MARK.y, 0]} visible={false} frustumCulled={false} />
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
