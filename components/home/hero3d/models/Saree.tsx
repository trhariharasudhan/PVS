"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ACCORDION_PANELS, FOLD, LOOM, PACK, SAREE, type QualitySettings } from "../sceneConfig";
import { lerp, range, sceneT, smooth, smoother, step, type ProgressStore } from "../math";
import type { HeroAssets } from "../useHeroAssets";
import { useDisposable } from "../useDisposable";

/**
 * The finished saree as a deformable cloth (CPU vertex deformation, no physics engine):
 *  1. unrolls from the loom's cloth beam and rises onto a display rod (drapes gently)
 *  2. brand scene: a soft light sweeps across the weaver's mark near the pallu
 *  3. packing — folded IN THE AIR, following PVS's silk-saree folding procedure:
 *       Step 1 spread & align (a gentle shake-out wave, wrinkles settle)
 *       Step 2 first lengthwise fold (top border brought onto the bottom border)
 *       Step 3 second lengthwise fold (narrow strip, borders kept aligned)
 *       Step 4 crosswise accordion folds, alternating direction, equal widths
 *       Step 5 pallu settled on top (the pallu end finishes face-up)
 *       Step 6 square the shape (small misalignments ease out)
 *       Step 7 quality check (a light passes over the stack)
 *     then the open box rises under the floating saree and it is lowered in (see SareeBox).
 * Folds are hinge rotations with a small layer offset, so layers never intersect and the
 * zari is never pressed into a sharp crease against itself.
 */

const L = SAREE.length;
const H = SAREE.height;
const N = ACCORDION_PANELS;
const P = L / N; // accordion panel width
const ROLL_R = 0.05;
const LAYER = 0.0012; // cloth thickness per layer
const STRIP_T = 3 * LAYER; // 4 layers after the two lengthwise folds → top layer at 3·LAYER

interface DeformParams {
  unroll: number; // 0 rolled … 1 fully open
  amp: number; // drape wave amplitude
  time: number;
  shake: number; // step 1: shake-out wave strength 0..1
  shakePhase: number;
  half: number; // step 2
  second: number; // step 3
  /** per-crease fold amount 0..1 (index 1..N-1), already eased */
  crease: Float32Array;
  palluLift: number; // step 5: top panel lifts a little and settles
  misalign: number; // step 6: 1 = slightly uneven, 0 = squared
  accordion: number; // overall 0..1, for centring the stack
}

/**
 * Soft fold: cloth beyond the crease line a = c wraps around a cylinder centred on the hinge
 * (c, h), then continues straight. Each layer bends on its own radius |h − z|, so stacked
 * layers nest like real cloth (rounded edge, no sharp crease on the zari). With t = ±π the
 * folded part lies flat on the other side of the hinge. Writes into tmp.
 */
const tmp = { a: 0, z: 0 };
/** Middle of the 4-layer strip: the reference layer that carries an already-folded stack. */
const Z_REF = STRIP_T / 2;
function hinge(a: number, z: number, c: number, h: number, t: number, rigid = false) {
  const da = a - c;
  if (rigid && t !== 0) {
    // an already-folded stack rides on the panel rigidly (it does not bend around the crease)
    const sg = t > 0 ? 1 : -1;
    const th = Math.abs(t);
    const r = Math.max(Math.abs(h - Z_REF), 1e-4);
    const ax = c + r * Math.sin(th);
    const az = h - sg * r * Math.cos(th);
    const u = da - r * th; // along the panel past the arc
    const w = z - Z_REF; // across the stack
    const ca = Math.cos(th);
    const sa = sg * Math.sin(th);
    tmp.a = ax + u * ca - w * sa;
    tmp.z = az + u * sa + w * ca;
    return;
  }
  if (da <= 0 || t === 0) {
    tmp.a = a;
    tmp.z = z;
    return;
  }
  const sg = t > 0 ? 1 : -1;
  const th = Math.abs(t);
  const r = Math.max(Math.abs(h - z), 1e-4);
  const arc = r * th;
  const phi = Math.min(da / r, th);
  // point on the arc (starts directly below/above the hinge, travels forward then over)
  const ca = c + r * Math.sin(phi);
  const cz = h - sg * r * Math.cos(phi);
  if (da <= arc) {
    tmp.a = ca;
    tmp.z = cz;
    return;
  }
  // past the arc: straight on along the tangent at the end of the arc
  const rest = da - arc;
  tmp.a = ca + Math.cos(th) * rest;
  tmp.z = cz + sg * Math.sin(th) * rest;
}

/** Deform one saree-local point (x along length, y across width, z = cloth normal). */
function deform(x0: number, y0: number, prm: DeformParams, out: THREE.Vector3) {
  // --- drape wave (top edge pinned to the rod) ---
  const hang = Math.pow(THREE.MathUtils.clamp(0.5 - y0 / H, 0, 1), 0.85);
  let x = x0;
  let y = y0;
  let z =
    prm.amp *
    hang *
    (Math.sin(x0 * 2.3 + prm.time * 0.7 + y0 * 0.8) * 0.65 + Math.sin(x0 * 5.1 - prm.time * 0.45) * 0.25);

  // --- step 1: shake-out — a travelling wave along the length that dies away ---
  if (prm.shake > 0) {
    const env = Math.sin(Math.PI * THREE.MathUtils.clamp((x0 / L + 0.5) * 0.6 + prm.shakePhase * 0.6 - 0.2, 0, 1));
    z += prm.shake * 0.07 * env * Math.sin(x0 * 4.2 - prm.shakePhase * 14);
  }

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

  // --- step 2: first lengthwise fold — top half over the face onto the bottom half (crease y = 0) ---
  if (prm.half > 0 && y0 > 0) {
    hinge(y, z, 0, LAYER / 2, Math.PI * prm.half);
    y = tmp.a;
    z = tmp.z;
  }
  // --- step 3: second lengthwise fold — bottom quarter up over the stack (crease y = −H/4) ---
  if (prm.second > 0 && y < -H / 4 + 1e-6) {
    // mirrored axis (−y) so the bottom quarter is the part "beyond" the crease
    hinge(-y, z, H / 4, LAYER * 1.5, Math.PI * prm.second);
    y = -tmp.a;
    z = tmp.z;
  }
  // keep the strip centred across its width: [-H/2,H/2] → [-H/2,0] → [-H/4,0]
  y += (H / 4) * prm.half - (H / 8) * prm.second;

  // --- step 4: accordion — panel k hangs off panel k−1 at crease k (x = −L/2 + kP).
  // Panel 0 (body start) is the base; the pallu end is folded first, so the growing stack
  // swings over and the long unfolded part stays still. Alternating directions = zig-zag.
  // Forward kinematics: apply the crease nearest the point first, down to crease 1.
  const k = Math.min(N - 1, Math.max(0, Math.floor((x0 + L / 2) / P + 1e-6)));
  for (let j = k; j >= 1; j--) {
    let f = prm.crease[j];
    if (f <= 0) continue;
    if (j === N - 1) f -= prm.palluLift; // step 5: the pallu panel lifts and settles back
    const up = j % 2 === 1; // odd creases fold up over the stack, even ones fold back
    const c = -L / 2 + j * P;
    // hinge sits just outside the strip on the side the panel folds towards
    const h = up ? STRIP_T + LAYER * 0.5 : -LAYER * 0.5;
    // panel j itself bends softly; panels beyond it (already stacked) ride along rigidly
    hinge(x, z, c, h, (up ? 1 : -1) * Math.PI * Math.max(0, f), j < k);
    x = tmp.a;
    z = tmp.z;
  }
  // step 6: before squaring, panels sit a few millimetres out of line
  if (k > 0 && prm.misalign > 0) x += prm.misalign * 0.012 * Math.sin(k * 2.7) * prm.crease[k];
  // slide the stack to the centre as it forms
  x += (L / 2 - P / 2) * prm.accordion;

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
      // vertices exactly on every accordion crease, and on y = 0 / y = −H/4 (sy is a multiple of 4)
      const segX = N * Math.max(6, Math.ceil(sx / N));
      const segY = Math.ceil(sy / 4) * 4;
      const geo = new THREE.PlaneGeometry(L, H, segX, segY);
      const base = (geo.attributes.position.array as Float32Array).slice();
      return { geo, base };
    },
    [quality.clothSegments],
    (r) => [r.geo],
  );

  const scratch = useRef({ v: new THREE.Vector3(), crease: new Float32Array(N) });

  useFrame((state) => {
    const g = group.current;
    if (!g || !cloth.current) return;
    const p = progress.value;
    const tS = sceneT(p, "saree");
    const tB = sceneT(p, "brand");
    const tP = sceneT(p, "packaging");
    const time = state.clock.elapsedTime;
    const at = (k: keyof typeof FOLD) => range(tP, FOLD[k][0], FOLD[k][1]);

    // Hidden once the box lid has closed over it (the box carries it from there).
    g.visible = p > 0.4 && tP < FOLD.lid[1] - 0.02;
    if (!g.visible) return;

    // ---------- pose ----------
    const rise = smoother(step(tS, 0, 0.6));
    const [px, py, pz] = SAREE.presentPosition;
    const start = [0, LOOM.clothBeamY, LOOM.breastBeamZ + 0.08];
    const toAir = smoother(at("spread")); // off the rod, floating, tilted towards the camera
    const flat = smoother(at("square")); // lies flat, face up, ready for the box
    const lower = smoother(at("lower"));
    const [fx, fy, fz] = PACK.foldPos;
    const [bx, by, bz] = PACK.boxPos;

    let x = lerp(start[0], px, rise);
    let y = lerp(start[1], py, rise);
    let z = lerp(start[2], pz, rise);
    x = lerp(x, fx, toAir);
    y = lerp(y, fy, toAir);
    z = lerp(z, fz, toAir);
    // floating: a slow breath while it is folded in the air (stops once it is in the box)
    y += Math.sin(time * 1.1) * 0.012 * toAir * (1 - lower);
    // lowered into the open box (box floor + wall thickness)
    x = lerp(x, bx, lower);
    y = lerp(y, by + 0.012, lower);
    z = lerp(z, bz, lower);
    g.position.set(x, y, z);
    const tilt = lerp(0, -0.78, toAir) + lerp(0, -Math.PI / 2 + 0.78, flat);
    g.rotation.set(tilt, 0, (Math.PI / 2) * (1 - rise));
    g.scale.setScalar(lerp(0.32, 1, step(tS, 0, 0.35)));

    // ---------- cloth deformation ----------
    const accT = at("accordion");
    const crease = scratch.current.crease;
    // creases fold from the pallu end (N−1) down to crease 1, overlapping a little for flow
    const SPAN = 1.4; // each crease takes 1.4 "slots", so neighbouring folds overlap a little
    for (let j = 1; j < N; j++) {
      const order = N - 1 - j; // 0 for the first crease to fold
      crease[j] = smoother(range(accT * (N - 2 + SPAN), order, order + SPAN));
    }
    const palluT = at("pallu");
    const prm: DeformParams = {
      unroll: step(tS, 0.08, 0.7),
      amp: 0.075 * step(tS, 0.4, 0.8) * lerp(1, 0.3, step(tB, 0, 0.35)) * (1 - toAir),
      time,
      shake: Math.sin(Math.PI * at("spread")),
      shakePhase: at("spread"),
      half: smoother(at("half")),
      second: smoother(at("second")),
      crease,
      palluLift: 0.12 * Math.sin(Math.PI * palluT),
      misalign: 1 - smooth(at("square")),
      accordion: smoother(accT),
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

    // ---------- display rod (released at the start of packing) ----------
    if (rod.current) {
      const show = step(tS, 0.45, 0.8) * (1 - step(tP, 0, 0.04));
      rod.current.visible = show > 0.01;
      rod.current.scale.set(Math.max(show, 0.001), 1, 1);
    }

    // ---------- light sweeps: weaver's mark (brand) and the quality check (step 7) ----------
    if (sweep.current) {
      const brandOn = step(tB, 0.05, 0.25) * (1 - step(tB, 0.85, 1));
      const qc = at("check");
      const qcOn = Math.sin(Math.PI * qc);
      sweep.current.intensity = 2.6 * brandOn + 1.6 * qcOn;
      if (qcOn > 0.01) sweep.current.position.set(lerp(-0.35, 0.35, qc), 0.05, 0.35);
      else sweep.current.position.set(lerp(-0.4, 1.0, step(tB, 0.1, 0.8)), 0.15, 0.7);
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
