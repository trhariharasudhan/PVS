"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SCENES } from "./sceneConfig";
import { lerp, range, smooth, smoother, type ProgressStore } from "./math";

type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number] };

/** Camera path after the opening turntable. Positions/targets are Catmull-Rom smoothed. */
const KEYS: Key[] = [
  { p: 0.15, pos: [0, 2.75, 5.9], tgt: [0, 1.25, 0] },
  { p: 0.25, pos: [2.0, 2.35, 3.6], tgt: [0, 1.15, -0.1] },
  { p: 0.33, pos: [1.3, 1.78, 2.55], tgt: [0, 0.9, 0.45] },
  { p: 0.4, pos: [-1.0, 1.72, 2.95], tgt: [0, 0.82, 0.7] },
  { p: 0.5, pos: [0, 1.75, 4.7], tgt: [0, 1.15, 1.2] },
  { p: 0.6, pos: [0, 1.62, 5.6], tgt: [0, 1.5, 1.6] },
  { p: 0.66, pos: [0.06, 1.48, 3.6], tgt: [0.05, 1.42, 1.6] },
  { p: 0.72, pos: [0.2, 2.2, 4.3], tgt: [-0.1, 1.0, 1.6] },
  // packing: look down at the table (lay flat → fold → box)
  { p: 0.79, pos: [-0.2, 2.45, 3.4], tgt: [-0.35, 0.66, 1.6] },
  { p: 0.86, pos: [0.15, 2.2, 3.6], tgt: [-0.25, 0.7, 1.6] },
  // box travels into the bag
  { p: 0.89, pos: [0.85, 2.15, 4.6], tgt: [0.8, 1.05, 1.6] },
  { p: 0.94, pos: [1.2, 1.8, 4.7], tgt: [1.15, 0.9, 1.55] },
  { p: 1.0, pos: [1.35, 1.3, 4.6], tgt: [1.3, 0.78, 1.55] },
];

const ORBIT_END = SCENES.loom[1];
/** Opening: the LOOM turns on a turntable (camera still), so the studio light's shadows sweep
 *  across the floor exactly as they would in a real product shoot. */
const TURN_START_ANGLE = -Math.PI * 2 - 0.5;

/** Loom turntable angle (radians) for progress p — used by the Loom model. */
export function turntableAngle(p: number) {
  const t = range(p, 0, ORBIT_END);
  return lerp(TURN_START_ANGLE, 0, smoother(t));
}

function opening(p: number, outPos: THREE.Vector3, outTgt: THREE.Vector3) {
  const t = range(p, 0, ORBIT_END);
  // Start high overhead, descend to the front three-quarter view during the first half
  const descend = smooth(range(t, 0, 0.55));
  const radius = lerp(0.4, KEYS[0].pos[2], descend);
  const height = lerp(7.2, KEYS[0].pos[1], descend);
  outPos.set(0, height, radius);
  outTgt.set(0, lerp(0.6, KEYS[0].tgt[1], descend), 0);
}

interface Props {
  progress: ProgressStore;
  /** Horizontal framing shift (film offset) so text and subject don't overlap. */
  framing: number;
}

export function CameraRig({ progress, framing }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const curves = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
    const tgt = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.tgt)), false, "centripetal");
    return { pos, tgt };
  }, []);

  const s = useRef({
    pos: new THREE.Vector3(),
    tgt: new THREE.Vector3(),
    curTgt: new THREE.Vector3(),
    initialised: false,
  });

  useFrame((_, dt) => {
    const p = progress.value;
    const st = s.current;

    if (p <= ORBIT_END) {
      opening(p, st.pos, st.tgt);
    } else {
      let i = 0;
      while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
      const local = range(p, KEYS[i].p, KEYS[i + 1].p);
      const u = (i + local) / (KEYS.length - 1);
      curves.pos.getPoint(u, st.pos);
      curves.tgt.getPoint(u, st.tgt);
    }

    // Portrait screens: same shot, pulled back so the subject fits the narrow frame,
    // and aimed lower so the subject sits in the top half (text lives at the bottom).
    if (aspect < 1) {
      const m = THREE.MathUtils.clamp(0.95 / aspect, 1, 2.2);
      st.pos.sub(st.tgt).multiplyScalar(m).add(st.tgt);
      st.tgt.y -= 0.32 * (m - 1);
      // final shot: lift the bag clear of the CTA block
      st.tgt.y -= 0.55 * smooth(range(p, 0.88, 0.96));
    }

    // Critically-damped follow: smooth even if the scroll jumps, fully reversible.
    if (!st.initialised) {
      camera.position.copy(st.pos);
      st.curTgt.copy(st.tgt);
      st.initialised = true;
    } else {
      // lower rate = silkier glide (scroll scrub already smooths the input)
      const k = 1 - Math.exp(-Math.min(dt, 0.1) * 4.2);
      camera.position.lerp(st.pos, k);
      st.curTgt.lerp(st.tgt, k);
    }
    camera.lookAt(st.curTgt);

    // Shift the subject away from the text column (desktop) — eases out in the overhead shot.
    // ...and centres the shot again for the brand reveal (caption sits under the mark).
    const brandCentre = smooth(range(p, 0.6, 0.64)) * (1 - smooth(range(p, 0.7, 0.74)));
    const f = framing * smooth(range(p, 0.02, 0.12)) * (1 - brandCentre);
    if (Math.abs(camera.filmOffset - f) > 1e-3) {
      camera.filmOffset = f;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
