"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { LOOM, type QualitySettings } from "../sceneConfig";
import { lerp, range, sceneT, smooth, step, type ProgressStore } from "../math";
import type { HeroAssets } from "../useHeroAssets";
import { useDisposable } from "../useDisposable";
import { WarpThreads, type WarpState } from "./WarpThreads";
import { Jacquard, type MechState } from "./Jacquard";
import { borderCount, isBorderThread, threadX } from "../jacquard";

/**
 * Procedural traditional handloom (fly-shuttle frame loom).
 *
 * MODULAR / REPLACEABLE: this is a code-built model. When a Blender GLB is ready,
 * replace <LoomFrame/> with the GLB and keep the animated parts (shafts, batten,
 * shuttle, beams) — they are driven only by refs in useFrame below.
 */

const PICKS = 16; // weft picks shown across the weaving scene
const X_POST = LOOM.width / 2;
const Z_BACK = -1.1;
const Z_FRONT = 1.05;
const [PIVOT_X, PIVOT_Y, PIVOT_Z] = LOOM.battenPivot;
const PULLEY_X = 0.32;

interface BeamProps {
  size: [number, number, number];
  position: [number, number, number];
  material: THREE.Material;
  rotation?: [number, number, number];
}
function Beam({ size, position, material, rotation }: BeamProps) {
  return (
    <RoundedBox args={size} radius={Math.min(...size) * 0.18} smoothness={3} position={position} rotation={rotation} castShadow receiveShadow material={material} />
  );
}

/** Static wooden frame + fixed fittings. */
function LoomFrame({ a }: { a: HeroAssets }) {
  const bolts = useMemo(() => {
    const out: [number, number, number][] = [];
    for (const x of [-X_POST - 0.048, X_POST + 0.048])
      for (const z of [Z_BACK, Z_FRONT])
        for (const y of [0.25, 1.82]) out.push([x, y, z]);
    return out;
  }, []);

  return (
    <group>
      {/* Posts */}
      {[-X_POST, X_POST].map((x) =>
        [Z_BACK, Z_FRONT].map((z) => <Beam key={`${x}${z}`} size={[0.09, 1.9, 0.09]} position={[x, 0.95, z]} material={a.wood} />),
      )}
      {/* Side rails (top + bottom) */}
      {[-X_POST, X_POST].map((x) => (
        <group key={`rail${x}`}>
          <Beam size={[0.08, 0.08, 2.3]} position={[x, 1.82, -0.025]} material={a.wood} />
          <Beam size={[0.08, 0.09, 2.3]} position={[x, 0.25, -0.025]} material={a.wood} />
          {/* diagonal brace */}
          <Beam size={[0.05, 0.05, 1.25]} position={[x, 1.05, -0.62]} rotation={[0.95, 0, 0]} material={a.woodDark} />
        </group>
      ))}
      {/* Top cross beams */}
      <Beam size={[LOOM.width + 0.16, 0.09, 0.09]} position={[0, 1.88, -0.15]} material={a.wood} />
      <Beam size={[LOOM.width + 0.16, 0.08, 0.08]} position={[0, 1.88, PIVOT_Z]} material={a.wood} />
      {/* Bottom stretchers */}
      <Beam size={[LOOM.width, 0.07, 0.07]} position={[0, 0.12, Z_BACK]} material={a.woodDark} />
      <Beam size={[LOOM.width, 0.07, 0.07]} position={[0, 0.12, Z_FRONT]} material={a.woodDark} />
      {/* Breast beam (cloth passes over this) */}
      <Beam size={[LOOM.width, 0.07, 0.1]} position={[0, LOOM.warpY - 0.04, LOOM.breastBeamZ]} material={a.wood} />
      {/* Back rest / warp beam supports */}
      <Beam size={[LOOM.width, 0.06, 0.08]} position={[0, LOOM.warpY - 0.035, LOOM.backBeamZ - 0.02]} material={a.wood} />
      {/* Heddle pulleys on the top beam */}
      {[-PULLEY_X, PULLEY_X].map((x) => (
        <group key={`pul${x}`} position={[x, 1.8, -0.15]}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow material={a.brass}>
            <torusGeometry args={[0.045, 0.012, 10, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={a.metal}>
            <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
          </mesh>
        </group>
      ))}
      {/* Shuttle boxes at each side of the race board */}
      {[-1, 1].map((s) => (
        <Beam key={`box${s}`} size={[0.2, 0.07, 0.11]} position={[s * 1.0, 0.86, 0.33]} material={a.woodDark} />
      ))}
      {/* Iron bolts */}
      {bolts.map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} material={a.metal}>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 10]} />
        </mesh>
      ))}
      {/* Weaver's bench */}
      <group position={[0, 0, 1.65]}>
        <Beam size={[1.1, 0.06, 0.32]} position={[0, 0.56, 0]} material={a.wood} />
        {[-0.45, 0.45].map((x) =>
          [-0.11, 0.11].map((z) => <Beam key={`leg${x}${z}`} size={[0.05, 0.53, 0.05]} position={[x, 0.265, z]} material={a.woodDark} />),
        )}
      </group>
      {/* Pirn (bobbin) stand at the side */}
      <group position={[X_POST + 0.45, 0, 0.6]}>
        <Beam size={[0.32, 0.04, 0.32]} position={[0, 0.02, 0]} material={a.woodDark} />
        <Beam size={[0.05, 0.7, 0.05]} position={[0, 0.37, 0]} material={a.wood} />
        <Beam size={[0.3, 0.035, 0.12]} position={[0, 0.72, 0]} material={a.wood} />
        {[-0.1, -0.035, 0.035, 0.1].map((x) => (
          <group key={`pirn${x}`} position={[x, 0.8, 0]}>
            <mesh material={a.woodDark}>
              <cylinderGeometry args={[0.006, 0.006, 0.16, 6]} />
            </mesh>
            <mesh castShadow material={a.yarn}>
              <cylinderGeometry args={[0.022, 0.03, 0.1, 16]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

interface LoomProps {
  progress: ProgressStore;
  quality: QualitySettings;
  assets: HeroAssets;
}

export function Loom({ progress, quality, assets: a }: LoomProps) {
  const root = useRef<THREE.Group>(null);
  const shaftA = useRef<THREE.Group>(null);
  const shaftB = useRef<THREE.Group>(null);
  const batten = useRef<THREE.Group>(null);
  const shuttle = useRef<THREE.Group>(null);
  const treadleA = useRef<THREE.Group>(null);
  const treadleB = useRef<THREE.Group>(null);
  const clothBeam = useRef<THREE.Group>(null);
  const clothWrap = useRef<THREE.Mesh>(null);
  const warpWrap = useRef<THREE.Mesh>(null);
  const fabricTop = useRef<THREE.Mesh>(null);
  const fabricFront = useRef<THREE.Mesh>(null);
  const weft = useRef<THREE.Mesh>(null);
  const cords = useRef<(THREE.Mesh | null)[]>([]);
  const warpState = useRef<WarpState>({ reveal: 0, shed: 0, fellZ: LOOM.fellStartZ, pick: 0 });
  const mech = useRef<MechState>({ pick: 0, advance: 0, shed: 0, weaving: false });
  const handle = useRef<THREE.Group>(null);
  const pickers = useRef<(THREE.Mesh | null)[]>([]);
  const pickCords = useRef<(THREE.Mesh | null)[]>([]);

  // Ground shafts carry only the body threads; the borders belong to the jacquard.
  const nBorder = borderCount(quality.warpThreads);
  const perShaft = Math.ceil((quality.warpThreads - 2 * nBorder) / 2);
  const shaftHalfW = Math.abs(threadX(nBorder, quality.warpThreads)) + 0.04;

  // Static instanced heddle wires (one per warp thread, split across two shafts) and reed dents.
  const inst = useDisposable(
    () => {
      const heddleGeo = new THREE.CylinderGeometry(0.0016, 0.0016, 0.3, 4);
      const dentGeo = new THREE.BoxGeometry(0.0025, 0.17, 0.012);
      const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
      const unitPlane = new THREE.PlaneGeometry(1, 1, 1, 1);
      return { heddleGeo, dentGeo, unitCyl, unitPlane };
    },
    [],
    (r) => [r.heddleGeo, r.dentGeo, r.unitCyl, r.unitPlane],
  );

  const setupHeddles = (mesh: THREE.InstancedMesh | null, parity: number) => {
    if (!mesh || mesh.userData.ready) return;
    const m = new THREE.Matrix4();
    let k = 0;
    for (let i = parity; i < quality.warpThreads; i += 2) {
      if (isBorderThread(i, quality.warpThreads)) continue;
      m.makeTranslation(threadX(i, quality.warpThreads), 0, 0);
      mesh.setMatrixAt(k++, m);
    }
    mesh.count = k;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.ready = true;
  };

  const DENTS = quality.tier === "low" ? 70 : 140;
  const setupDents = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh || mesh.userData.ready) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < DENTS; i++) {
      const x = -0.85 + ((i + 0.5) / DENTS) * 1.7;
      m.makeTranslation(x, 0, 0);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.ready = true;
  };

  // Scratch vectors for cords
  const v = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), d: new THREE.Vector3(), q: new THREE.Quaternion(), up: new THREE.Vector3(0, 1, 0) }), []);
  const setCord = (mesh: THREE.Mesh | null | undefined, from: THREE.Vector3, to: THREE.Vector3, r = 0.004) => {
    if (!mesh) return;
    v.d.subVectors(to, from);
    const len = v.d.length();
    mesh.position.addVectors(from, to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(v.up, v.d.divideScalar(Math.max(len, 1e-5)));
    mesh.scale.set(r, len, r);
  };

  useFrame((state) => {
    const p = progress.value;
    const g = root.current;
    if (!g) return;

    // Leave the stage once the saree has been presented.
    const exit = step(sceneT(p, "saree"), 0.2, 0.85);
    g.position.set(0, -0.15 * exit, -4.2 * exit);
    g.visible = p < 0.66;
    if (!g.visible) return;

    const tThreads = sceneT(p, "threads");
    const tWeave = sceneT(p, "weaving");
    const time = state.clock.elapsedTime;

    // ---- Weaving cycle (driven by scroll, so it reverses naturally) ----
    const pick = tWeave * PICKS;
    const pickIdx = Math.min(PICKS - 1, Math.floor(pick));
    const frac = tWeave >= 1 ? 1 : pick - Math.floor(pick);
    const weaving = tWeave > 0 && tWeave < 1;
    const sign = pickIdx % 2 === 0 ? 1 : -1;
    const shedOpen = weaving ? Math.sin(Math.PI * Math.min(1, frac / 0.82)) : 0;
    // tiny idle "breathing" so the loom never looks frozen mid-scene
    const idle = weaving ? 0 : Math.sin(time * 1.3) * 0.004 * smooth(tThreads);
    const shed = sign * LOOM.shedOpen * shedOpen + idle;

    // Ground shafts: even body threads on shaft A, odd on shaft B (plain weave)
    if (shaftA.current) shaftA.current.position.y = shed;
    if (shaftB.current) shaftB.current.position.y = -shed;
    const shedAmt = LOOM.shedOpen * shedOpen + Math.abs(idle);
    mech.current.pick = weaving ? pickIdx : 0;
    mech.current.advance = weaving || tWeave >= 1 ? tWeave * PICKS : 0;
    mech.current.shed = weaving ? LOOM.shedOpen * shedOpen : 0;
    mech.current.weaving = weaving;

    // Treadles: one pressed per pick
    const press = 0.16 * shedOpen;
    if (treadleA.current) treadleA.current.rotation.x = sign > 0 ? press : 0.02;
    if (treadleB.current) treadleB.current.rotation.x = sign < 0 ? press : 0.02;

    // Fell line and beater (reed) beat-up
    const fellZ = lerp(LOOM.fellStartZ, LOOM.fellEndZ, tWeave);
    const beat = weaving ? Math.sin(Math.PI * range(frac, 0.72, 1)) : 0;
    const reedZ = lerp(LOOM.reedRestZ, fellZ - 0.02, beat);
    const theta = -Math.asin((reedZ - PIVOT_Z) / LOOM.battenLength);
    if (batten.current) batten.current.rotation.x = theta;

    // Shuttle flies through the shed between beats
    const dir = sign;
    const fly = smooth(range(frac, 0.1, 0.68));
    const sx = weaving ? lerp(-dir * 1.0, dir * 1.0, fly) : tWeave >= 1 ? (PICKS % 2 === 0 ? -1 : 1) : -1.0;
    if (shuttle.current) shuttle.current.position.x = sx;

    // Weft trailing behind the shuttle
    if (weft.current) {
      const start = -dir * LOOM.warpWidth / 2;
      const end = THREE.MathUtils.clamp(sx, -LOOM.warpWidth / 2, LOOM.warpWidth / 2);
      const len = Math.abs(end - start);
      weft.current.visible = weaving && frac > 0.1 && frac < 0.9 && len > 0.01;
      weft.current.position.set((start + end) / 2, LOOM.warpY + 0.002, fellZ - 0.03 - (1 - beat) * 0.12);
      weft.current.scale.set(0.0035, Math.max(len, 0.001), 0.0035);
    }

    // Warp threads
    warpState.current.reveal = tThreads;
    warpState.current.shed = shedAmt;
    warpState.current.pick = weaving ? pickIdx : 0;
    warpState.current.fellZ = fellZ;

    // Fly-shuttle: the weaver jerks the picking handle toward the throw direction;
    // the picker on the starting side strikes the shuttle out of its box.
    const strike = weaving ? Math.sin(Math.PI * range(frac, 0.04, 0.26)) : 0;
    if (handle.current) {
      handle.current.position.x = dir * 0.3 * strike;
      handle.current.rotation.z = -dir * 0.35 * strike;
    }
    const startSide = -dir; // shuttle starts on this side
    for (let k = 0; k < 2; k++) {
      const side = k === 0 ? -1 : 1;
      const pk = pickers.current[k];
      if (pk) pk.position.x = side * (1.08 - (side === startSide ? 0.1 * strike : 0));
      v.a.set(side * (1.08 - (side === startSide ? 0.1 * strike : 0)), 0.92, 0.33);
      v.b.set(handle.current ? handle.current.position.x : 0, 1.3, 0.42);
      setCord(pickCords.current[k], v.a, v.b, 0.0025);
    }

    // Warp beam fills with red yarn during thread preparation
    if (warpWrap.current) {
      const s = step(tThreads, 0, 0.6);
      warpWrap.current.visible = s > 0.001;
      const r = 0.74 + 0.26 * s; // grows radially from the bare beam
      warpWrap.current.scale.set(r, 1, r);
    }

    // Woven cloth emerges: across to the breast beam, then down to the cloth beam
    const grow = step(tWeave, 0.02, 0.45);
    const down = step(tWeave, 0.4, 0.7);
    if (fabricTop.current) {
      const front = lerp(fellZ, LOOM.breastBeamZ + 0.04, grow);
      const len = Math.max(0.0001, front - fellZ);
      fabricTop.current.visible = tWeave > 0.02;
      fabricTop.current.position.set(0, LOOM.warpY + 0.004, (fellZ + front) / 2);
      fabricTop.current.scale.set(LOOM.warpWidth, len, 1);
      const m = a.loomSilk.map;
      if (m) {
        // texture is rotated 90°, so repeat.x runs along the warp
        m.repeat.set(len / 3.0, 1);
        m.offset.set(-tWeave * 0.6, 0);
        a.loomSilk.roughnessMap?.repeat.copy(m.repeat);
        a.loomSilk.roughnessMap?.offset.copy(m.offset);
      }
    }
    if (fabricFront.current) {
      const top = LOOM.warpY - 0.02;
      const bottom = lerp(top, LOOM.clothBeamY + 0.06, down);
      const h = Math.max(0.0001, top - bottom);
      fabricFront.current.visible = down > 0.001;
      fabricFront.current.position.set(0, (top + bottom) / 2, LOOM.breastBeamZ + 0.055);
      fabricFront.current.scale.set(LOOM.warpWidth, h, 1);
    }

    // Take-up: cloth beam turns and its roll grows
    if (clothBeam.current) clothBeam.current.rotation.x = -tWeave * 9;
    if (clothWrap.current) {
      const s = step(tWeave, 0.6, 1);
      clothWrap.current.visible = s > 0.001 || p >= 0.4;
      const r = 1 + 0.45 * s;
      clothWrap.current.scale.set(r, 1, r);
    }

    // Heddle cords: shaft top → pulleys, shaft bottom → treadles
    const shaftTopY = LOOM.warpY + 0.17;
    const shaftBotY = LOOM.warpY - 0.17;
    const cs = cords.current;
    for (let k = 0; k < 2; k++) {
      const off = k === 0 ? shed : -shed;
      const z = k === 0 ? -0.2 : -0.1;
      for (let j = 0; j < 2; j++) {
        const x = j === 0 ? -PULLEY_X : PULLEY_X;
        v.a.set(x, shaftTopY + off, z);
        v.b.set(x, 1.76, -0.15);
        setCord(cs[k * 4 + j], v.a, v.b);
        v.a.set(x * 0.5, shaftBotY + off, z);
        const tr = k === 0 ? (sign > 0 ? press : 0.02) : sign < 0 ? press : 0.02;
        v.b.set(k === 0 ? -0.15 : 0.15, 0.1 - Math.sin(tr) * 0.45, -0.15);
        setCord(cs[k * 4 + 2 + j], v.a, v.b);
      }
    }
  });

  const shaft = (ref: React.RefObject<THREE.Group>, z: number, parity: number) => (
    <group position={[0, 0, z]}>
      <group ref={ref}>
        <group position={[0, LOOM.warpY, 0]}>
          {[0.17, -0.17].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow material={a.woodDark}>
              <boxGeometry args={[shaftHalfW * 2, 0.025, 0.02]} />
            </mesh>
          ))}
          {[-shaftHalfW, shaftHalfW].map((x) => (
            <mesh key={x} position={[x, 0, 0]} material={a.woodDark}>
              <boxGeometry args={[0.02, 0.36, 0.02]} />
            </mesh>
          ))}
          <instancedMesh
            ref={(m) => setupHeddles(m, parity)}
            args={[inst.heddleGeo, a.metal, perShaft]}
            frustumCulled={false}
          />
        </group>
      </group>
    </group>
  );

  return (
    <group ref={root}>
      <LoomFrame a={a} />

      {/* Warp beam (back) with yarn wrap */}
      <group position={[0, LOOM.warpY - 0.1, LOOM.backBeamZ]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={a.wood}>
          <cylinderGeometry args={[0.07, 0.07, LOOM.width + 0.1, 24]} />
        </mesh>
        <mesh ref={warpWrap} rotation={[0, 0, Math.PI / 2]} material={a.yarn}>
          <cylinderGeometry args={[0.095, 0.095, LOOM.warpWidth, 32]} />
        </mesh>
      </group>

      {/* Heddle shafts (two, moving in opposition) */}
      {shaft(shaftA, -0.2, 0)}
      {shaft(shaftB, -0.1, 1)}

      {/* Warp threads */}
      <WarpThreads count={quality.warpThreads} state={warpState} />

      {/* Border jacquards: punch cards, harness cords, lingoes */}
      <Jacquard assets={a} warpThreads={quality.warpThreads} mech={mech} />

      {/* Fly-shuttle picking handle, pickers and cords */}
      <group ref={handle} position={[0, 1.3, 0.42]}>
        <mesh position={[0, -0.06, 0]} material={a.wood} castShadow>
          <cylinderGeometry args={[0.014, 0.018, 0.13, 10]} />
        </mesh>
      </group>
      {[0, 1].map((k) => (
        <mesh key={`picker${k}`} ref={(m) => { pickers.current[k] = m; }} position={[k === 0 ? -1.08 : 1.08, 0.9, 0.33]} material={a.woodDark}>
          <boxGeometry args={[0.05, 0.04, 0.06]} />
        </mesh>
      ))}
      {[0, 1].map((k) => (
        <mesh key={`pcord${k}`} ref={(m) => { pickCords.current[k] = m; }} geometry={inst.unitCyl} material={a.handle} />
      ))}

      {/* Batten / beater hanging from the overhead pivot */}
      <group ref={batten} position={[PIVOT_X, PIVOT_Y, PIVOT_Z]}>
        {[-0.95, 0.95].map((x) => (
          <mesh key={x} position={[x, -0.47, 0]} castShadow material={a.wood}>
            <boxGeometry args={[0.05, 0.94, 0.05]} />
          </mesh>
        ))}
        {/* reed: top cap, race board, metal dents */}
        <mesh position={[0, -0.76, 0]} castShadow material={a.wood}>
          <boxGeometry args={[1.95, 0.05, 0.06]} />
        </mesh>
        <mesh position={[0, -0.965, 0.03]} castShadow receiveShadow material={a.wood}>
          <boxGeometry args={[1.95, 0.035, 0.12]} />
        </mesh>
        <instancedMesh ref={setupDents} args={[inst.dentGeo, a.metal, DENTS]} position={[0, -0.86, 0]} frustumCulled={false} />
        {/* Shuttle rides on the race board */}
        <group ref={shuttle} position={[-1.0, -0.93, 0.045]}>
          <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.75]} castShadow material={a.woodDark}>
            <capsuleGeometry args={[0.022, 0.2, 6, 14]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.13, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]} material={a.brass}>
              <coneGeometry args={[0.016, 0.05, 12]} />
            </mesh>
          ))}
          <mesh position={[0, 0.012, 0]} rotation={[0, 0, Math.PI / 2]} material={a.yarn}>
            <cylinderGeometry args={[0.012, 0.012, 0.13, 12]} />
          </mesh>
        </group>
      </group>

      {/* Weft thread trailing the shuttle (unit cylinder, scaled each frame) */}
      <mesh ref={weft} rotation={[0, 0, Math.PI / 2]} geometry={inst.unitCyl} material={a.yarn} visible={false} />

      {/* Woven cloth on the loom */}
      <mesh ref={fabricTop} rotation={[-Math.PI / 2, 0, 0]} geometry={inst.unitPlane} material={a.loomSilk} receiveShadow visible={false} />
      <mesh ref={fabricFront} geometry={inst.unitPlane} material={a.loomSilk} visible={false} />

      {/* Cloth beam (take-up roller) */}
      <group position={[0, LOOM.clothBeamY, LOOM.breastBeamZ - 0.03]}>
        <group ref={clothBeam}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={a.wood}>
            <cylinderGeometry args={[0.065, 0.065, LOOM.width + 0.1, 24]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (LOOM.width / 2 + 0.08), 0, 0]} rotation={[0, 0, Math.PI / 2]} material={a.metal}>
              <torusGeometry args={[0.07, 0.012, 8, 20]} />
            </mesh>
          ))}
        </group>
        <mesh ref={clothWrap} rotation={[0, 0, Math.PI / 2]} material={a.loomSilk} visible={false}>
          <cylinderGeometry args={[0.075, 0.075, LOOM.warpWidth, 32]} />
        </mesh>
      </group>

      {/* Treadles (hinged at the back) */}
      {[
        { ref: treadleA, x: -0.15 },
        { ref: treadleB, x: 0.15 },
      ].map(({ ref, x }) => (
        <group key={x} ref={ref} position={[x, 0.1, -0.6]}>
          <mesh position={[0, 0, 0.7]} castShadow material={a.woodDark}>
            <boxGeometry args={[0.1, 0.035, 1.4]} />
          </mesh>
        </group>
      ))}

      {/* Heddle cords (4 per shaft) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} ref={(m) => { cords.current[i] = m; }} geometry={inst.unitCyl} material={a.handle} />
      ))}
    </group>
  );
}
