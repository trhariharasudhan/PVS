"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BAG } from "../sceneConfig";
import { lerp, sceneT, smoother, step, type ProgressStore } from "../math";
import type { HeroAssets } from "../useHeroAssets";
import { useDisposable } from "../useDisposable";

/**
 * Premium PVS shopping bag (procedural, replaceable by a GLB later).
 * Deep maroon matte paper, gold PVS SILKS branding (vector text texture), gold rope handles.
 * Origin = bottom centre of the bag.
 */

const W = BAG.width;
const HB = BAG.height;
const D = BAG.depth;
const T = 0.008; // paper thickness

interface Props {
  progress: ProgressStore;
  assets: HeroAssets;
}

export function ShoppingBag({ progress, assets: a }: Props) {
  const root = useRef<THREE.Group>(null);
  const front = useRef<THREE.Mesh>(null);
  const back = useRef<THREE.Mesh>(null);
  const sides = useRef<(THREE.Mesh | null)[]>([]);
  const handleF = useRef<THREE.Group>(null);
  const handleB = useRef<THREE.Group>(null);
  const tissue = useRef<THREE.Group>(null);

  const res = useDisposable(
    () => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.2, 0, 0),
        new THREE.Vector3(-0.19, 0.17, 0),
        new THREE.Vector3(-0.1, 0.28, 0),
        new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(0.1, 0.28, 0),
        new THREE.Vector3(0.19, 0.17, 0),
        new THREE.Vector3(0.2, 0, 0),
      ]);
      // Twisted cord: two strands spiralling around the handle path (reads as real rope up close)
      const strand = (phase: number) => {
        const pts: THREE.Vector3[] = [];
        const N = 160;
        const frames = curve.computeFrenetFrames(N, false);
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const c = curve.getPointAt(u);
          const a = u * Math.PI * 2 * 14 + phase;
          const r = 0.0055;
          pts.push(c.clone().addScaledVector(frames.normals[i], Math.cos(a) * r).addScaledVector(frames.binormals[i], Math.sin(a) * r));
        }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.0062, 8, false);
      };
      const handleGeo = strand(0);
      const handleGeo2 = strand(Math.PI);
      const tissueGeo = new THREE.PlaneGeometry(0.55, 0.32, 10, 6);
      const tp = tissueGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < tp.count; i++) {
        const x = tp.getX(i);
        const y = tp.getY(i);
        tp.setZ(i, Math.sin(x * 9) * 0.02 + (y > 0 ? Math.sin(x * 23) * 0.015 : 0));
        tp.setY(i, y + (y > 0 ? Math.cos(x * 7) * 0.03 : 0));
      }
      tissueGeo.computeVertexNormals();
      // Box faces: +x, -x, +y, -y, +z, -z
      const frontMats = [a.bagBody, a.bagBody, a.bagBody, a.bagBody, a.bagFront, a.bagInner];
      const backMats = [a.bagBody, a.bagBody, a.bagBody, a.bagBody, a.bagInner, a.bagBody];
      return { handleGeo, handleGeo2, tissueGeo, frontMats, backMats };
    },
    [a],
    (r) => [r.handleGeo, r.handleGeo2, r.tissueGeo],
  );

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const p = progress.value;
    const tP = sceneT(p, "packaging");
    const tF = sceneT(p, "final");
    g.visible = p > 0.74;
    if (!g.visible) return;

    // Slide in from the right, settle facing camera
    const enter = smoother(step(tP, 0.12, 0.45));
    const [bx, by, bz] = BAG.position;
    g.position.set(lerp(bx + 3.2, bx, enter), by, bz);
    // Final: slow presentation turn + a very subtle idle sway
    const sway = Math.sin(state.clock.elapsedTime * 0.5) * 0.03 * tF;
    g.rotation.y = lerp(-0.7, -0.18, enter) + lerp(0, 0.5, smoother(tF)) + sway;

    // Packaging opens: gusset expands from flat-folded to full depth
    const open = smoother(step(tP, 0.35, 0.6));
    const dz = lerp(0.06, 1, open) * (D / 2);
    if (front.current) front.current.position.z = dz;
    if (back.current) back.current.position.z = -dz;
    sides.current.forEach((s) => s && (s.scale.z = (dz * 2) / D));

    // Handles rise once the saree is inside
    const lift = smoother(step(tP, 0.92, 1));
    if (handleF.current) {
      handleF.current.position.z = dz + 0.004;
      handleF.current.rotation.x = lerp(Math.PI * 0.92, 0, lift);
    }
    if (handleB.current) {
      handleB.current.position.z = -dz - 0.004;
      handleB.current.rotation.x = lerp(-Math.PI * 0.92, 0, lift);
    }

    // Tissue paper puffs up at the top
    if (tissue.current) {
      const t = smoother(step(tP, 0.88, 1));
      tissue.current.visible = t > 0.01;
      tissue.current.scale.set(1, Math.max(t, 0.001), 1);
    }
  });

  const handle = (ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[0, HB, 0]}>
      <mesh geometry={res.handleGeo} material={a.handle} castShadow />
      <mesh geometry={res.handleGeo2} material={a.handle} castShadow />
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, -0.025, 0]} rotation={[Math.PI / 2, 0, 0]} material={a.brass}>
          <torusGeometry args={[0.014, 0.005, 8, 16]} />
        </mesh>
      ))}
    </group>
  );

  return (
    <group ref={root} visible={false}>
      <mesh ref={front} position={[0, HB / 2, D / 2]} material={res.frontMats} castShadow receiveShadow>
        <boxGeometry args={[W, HB, T]} />
        {/* turned-in top hem (real paper bags fold the top edge inwards) */}
        <mesh position={[0, HB / 2 - 0.022, -T]} material={a.bagInner}>
          <boxGeometry args={[W - 0.012, 0.044, T]} />
        </mesh>
      </mesh>
      <mesh ref={back} position={[0, HB / 2, -D / 2]} material={res.backMats} castShadow receiveShadow>
        <boxGeometry args={[W, HB, T]} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <mesh key={s} ref={(m) => { sides.current[i] = m; }} position={[(s * W) / 2, HB / 2, 0]} material={a.bagBody} castShadow>
          <boxGeometry args={[T, HB, D]} />
        </mesh>
      ))}
      <mesh position={[0, T / 2, 0]} material={a.bagInner} receiveShadow>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {handle(handleF)}
      {handle(handleB)}
      <group ref={tissue} position={[0, HB - 0.1, 0]} scale={0.72} visible={false}>
        <mesh geometry={res.tissueGeo} material={a.tissue} position={[-0.14, 0.14, 0.04]} rotation={[0, 0.25, 0.12]} />
        <mesh geometry={res.tissueGeo} material={a.tissue} position={[0.16, 0.12, -0.03]} rotation={[0, -0.3, -0.1]} />
        <mesh geometry={res.tissueGeo} material={a.brass} position={[0.02, 0.1, 0]} rotation={[0, 0.05, 0.03]} scale={[0.7, 0.7, 1]} />
      </group>
    </group>
  );
}
