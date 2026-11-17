"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, type QualitySettings } from "./sceneConfig";
import type { ProgressStore } from "./math";
import { CameraRig } from "./CameraRig";
import { useHeroAssets } from "./useHeroAssets";
import { Loom } from "./models/Loom";
import { Saree } from "./models/Saree";
import { ShoppingBag } from "./models/ShoppingBag";

interface Props {
  progress: ProgressStore;
  quality: QualitySettings;
  /** Render only while the hero is on screen. */
  active: boolean;
  /** Horizontal framing shift for the camera (see CameraRig). */
  framing: number;
  onReady: () => void;
  onFatal: (reason: string) => void;
}

function Scene({ progress, quality, framing, onReady }: Omit<Props, "active" | "onFatal">) {
  const assets = useHeroAssets(quality);

  useEffect(() => {
    if (assets) onReady();
  }, [assets, onReady]);

  return (
    <>
      <color attach="background" args={[PALETTE.background]} />
      <fog attach="fog" args={[PALETTE.background, 7.5, 17]} />

      {/* Warm, directional "workshop" lighting */}
      <hemisphereLight args={["#ffe6c7", "#2a1610", 0.45]} />
      <directionalLight
        position={[3.5, 5.2, 4]}
        intensity={2.3}
        color="#ffd6a3"
        castShadow={quality.shadows}
        shadow-mapSize={[quality.tier === "high" ? 2048 : 1024, quality.tier === "high" ? 2048 : 1024]}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
        shadow-camera-near={1}
        shadow-camera-far={15}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight position={[-4, 3.6, -3]} angle={0.6} penumbra={0.85} intensity={28} color={PALETTE.antiqueGold} distance={14} />
      <pointLight position={[0, 2.2, 4.2]} intensity={5} color="#ffb48a" distance={10} />
      {/* Soft front key for the bag / brand reveal */}
      <spotLight position={[-1.2, 2.6, 5]} angle={0.5} penumbra={1} intensity={14} color="#fff0d8" distance={12} />

      {/* Local studio reflections for silk & zari (no network HDR) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffe2b8" position={[0, 5, -2]} scale={[8, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} color="#ffd29a" position={[-5, 2, 1]} scale={[3, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.0} color={PALETTE.antiqueGold} position={[5, 1.5, 2]} scale={[3, 3, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 2, 6]} scale={2} />
      </Environment>

      {assets && (
        <>
          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={assets.floor}>
            <circleGeometry args={[12, 64]} />
          </mesh>
          <Loom progress={progress} quality={quality} assets={assets} />
          <Saree progress={progress} quality={quality} assets={assets} />
          <ShoppingBag progress={progress} assets={assets} />
        </>
      )}

      <CameraRig progress={progress} framing={framing} />
    </>
  );
}

/** Reports WebGL context loss to the parent so it can fall back to the static hero. */
function ContextGuard({ onFatal }: { onFatal: Props["onFatal"] }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onFatal("webgl-context-lost");
    };
    el.addEventListener("webglcontextlost", lost);
    return () => el.removeEventListener("webglcontextlost", lost);
  }, [gl, onFatal]);
  return null;
}

export default function HeroCanvas({ progress, quality, active, framing, onReady, onFatal }: Props) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={quality.dpr}
      shadows={quality.shadows ? "soft" : false}
      camera={{ fov: 38, near: 0.05, far: 60, position: [0, 7.2, 0.4] }}
      gl={{
        antialias: quality.tier !== "low",
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      aria-hidden="true"
    >
      <ContextGuard onFatal={onFatal} />
      <Suspense fallback={null}>
        <Scene progress={progress} quality={quality} framing={framing} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
