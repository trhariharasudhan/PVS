"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { QualitySettings } from "../sceneConfig";
import { useDisposable } from "../useDisposable";

/**
 * Silk dust drifting through the key light — the small thing that makes a studio feel real.
 * Each mote wanders on its own slow Lissajous path; the cloud is regenerated never, only moved.
 */
const AREA = { x: 5, y: 3.2, z: 4.5, cx: 0.2, cy: 1.5, cz: 0.6 };

export function DustMotes({ quality }: { quality: QualitySettings }) {
  const points = useRef<THREE.Points>(null);
  const count = quality.tier === "high" ? 260 : quality.tier === "medium" ? 160 : 70;

  const res = useDisposable(
    () => {
      const rnd = (() => {
        let s = 99;
        return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      })();
      const base = new Float32Array(count * 3);
      const seed = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        base[i * 3] = AREA.cx + (rnd() - 0.5) * AREA.x;
        base[i * 3 + 1] = AREA.cy + (rnd() - 0.5) * AREA.y;
        base[i * 3 + 2] = AREA.cz + (rnd() - 0.5) * AREA.z;
        seed[i * 3] = rnd() * 10;
        seed[i * 3 + 1] = 0.08 + rnd() * 0.12;
        seed[i * 3 + 2] = rnd() * 10;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
      // soft round sprite
      const c = document.createElement("canvas");
      c.width = c.height = 32;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, "rgba(255,236,200,1)");
      g.addColorStop(0.4, "rgba(255,226,180,0.45)");
      g.addColorStop(1, "rgba(255,220,170,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 32, 32);
      const tex = new THREE.CanvasTexture(c);
      const mat = new THREE.PointsMaterial({
        size: 0.022,
        map: tex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      return { geo, mat, tex, base, seed };
    },
    [count],
    (r) => [r.geo, r.mat, r.tex],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = res.geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const { base, seed } = res;
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      const sp = seed[k + 1];
      arr[k] = base[k] + Math.sin(t * sp + seed[k]) * 0.18;
      // slow fall, wrapping back to the top
      let y = base[k + 1] - ((t * sp * 0.12) % AREA.y);
      if (y < AREA.cy - AREA.y / 2) y += AREA.y;
      arr[k + 1] = y + Math.sin(t * sp * 1.7 + seed[k + 2]) * 0.05;
      arr[k + 2] = base[k + 2] + Math.cos(t * sp * 0.8 + seed[k + 2]) * 0.14;
    }
    pos.needsUpdate = true;
  });

  return <points ref={points} geometry={res.geo} material={res.mat} frustumCulled={false} />;
}
