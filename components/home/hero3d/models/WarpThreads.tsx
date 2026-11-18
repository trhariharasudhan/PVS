"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOOM } from "../sceneConfig";
import { clamp01 } from "../math";
import { useDisposable } from "../useDisposable";
import { isBorderThread, liftSign, threadX } from "../jacquard";

export interface WarpState {
  /** 0..1 reveal of threads (thread preparation scene). */
  reveal: number;
  /** Shed opening (≥0) at the heddles; each thread goes up or down by its lift sign. */
  shed: number;
  /** Current weft pick (selects which threads are lifted). */
  pick: number;
  /** Current fell line Z (front end of the warp). */
  fellZ: number;
}

interface Props {
  count: number;
  /** Mutable state written by the parent Loom every frame. */
  state: React.MutableRefObject<WarpState>;
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Instanced warp threads. Each thread is two segments: back beam → heddle → fell.
 * Body threads alternate (ground shafts); border threads follow the jacquard pattern.
 * Two draw calls total, regardless of thread count.
 */
export function WarpThreads({ count, state }: Props) {
  const segRef = useRef<THREE.InstancedMesh>(null);
  const last = useRef({ reveal: -1, shed: 99, fellZ: 99, pick: -1 });

  const res = useDisposable(
    () => {
      const geo = new THREE.CylinderGeometry(0.0032, 0.0032, 1, 5, 1, true);
      const mat = new THREE.MeshStandardMaterial({
        color: "#a3172b",
        roughness: 0.38,
        metalness: 0.05,
        emissive: "#2a0308",
      });
      // per-thread reveal delay: centre outwards, like threads being drawn in
      const delays = Array.from({ length: count }, (_, i) => (Math.abs(i - (count - 1) / 2) / (count / 2)) * 0.55);
      return { geo, mat, delays };
    },
    [count],
    (r) => [r.geo, r.mat],
  );

  const tmp = useRef({
    m: new THREE.Matrix4(),
    q: new THREE.Quaternion(),
    s: new THREE.Vector3(),
    p: new THREE.Vector3(),
    a: new THREE.Vector3(),
    b: new THREE.Vector3(),
    d: new THREE.Vector3(),
  });

  useFrame(() => {
    const mesh = segRef.current;
    if (!mesh) return;
    const { reveal, shed, fellZ, pick } = state.current;
    const l = last.current;
    // Skip work when nothing moved (scroll idle).
    if (
      pick === l.pick &&
      Math.abs(reveal - l.reveal) < 1e-5 &&
      Math.abs(shed - l.shed) < 1e-5 &&
      Math.abs(fellZ - l.fellZ) < 1e-5
    )
      return;
    l.reveal = reveal;
    l.shed = shed;
    l.fellZ = fellZ;
    l.pick = pick;

    const { m, q, s, p, a, b, d } = tmp.current;
    const y = LOOM.warpY;

    const setSeg = (idx: number, from: THREE.Vector3, to: THREE.Vector3) => {
      d.subVectors(to, from);
      const len = d.length();
      if (len < 1e-4) {
        m.makeScale(0, 0, 0);
        mesh.setMatrixAt(idx, m);
        return;
      }
      p.addVectors(from, to).multiplyScalar(0.5);
      q.setFromUnitVectors(UP, d.divideScalar(len));
      s.set(1, len, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(idx, m);
    };

    for (let i = 0; i < count; i++) {
      const x = threadX(i, count);
      const sign = liftSign(i, count, pick);
      const B = a.set(x, y, LOOM.backBeamZ);
      const Hy = y + shed * sign;
      // border threads pass through the jacquard harness, body threads through the ground shafts
      const HZ = isBorderThread(i, count) ? LOOM.harnessZ : LOOM.heddleZ;
      const t = clamp01((reveal - res.delays[i]) / 0.45);

      // path lengths
      const L1 = Math.hypot(HZ - LOOM.backBeamZ, Hy - y);
      const L2 = Math.hypot(fellZ - HZ, y - Hy);
      const sLen = t * (L1 + L2);

      // segment 1: back beam → heddle
      const f1 = Math.min(1, sLen / L1);
      b.set(x, y + (Hy - y) * f1, LOOM.backBeamZ + (HZ - LOOM.backBeamZ) * f1);
      setSeg(i * 2, B, b);

      // segment 2: heddle → fell
      const f2 = sLen > L1 ? Math.min(1, (sLen - L1) / L2) : 0;
      const H = a.set(x, Hy, HZ);
      b.set(x, Hy + (y - Hy) * f2, HZ + (fellZ - HZ) * f2);
      setSeg(i * 2 + 1, H, b);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={segRef}
      args={[res.geo, res.mat, count * 2]}
      frustumCulled={false}
      castShadow={false}
      receiveShadow
    />
  );
}
