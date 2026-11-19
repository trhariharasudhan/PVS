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
import { SareeBox } from "./models/SareeBox";
import { DustMotes } from "./models/DustMotes";

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
      <fog attach="fog" args={[PALETTE.background, 9, 20]} />

      {/* Studio lighting: one soft key spot from high front-right (the main, moving shadow),
          a warm rim from behind, a cool-ish fill and a low ambient so blacks keep detail. */}
      <hemisphereLight args={["#ffe9cf", "#24140e", 0.32]} />
      <spotLight
        position={[3.2, 6.2, 4.4]}
        angle={0.62}
        penumbra={0.75}
        intensity={95}
        decay={1.6}
        distance={22}
        color="#ffe0b8"
        castShadow={quality.shadows}
        shadow-mapSize={[quality.tier === "high" ? 2048 : 1024, quality.tier === "high" ? 2048 : 1024]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-near={1.5}
        shadow-camera-far={18}
      />
      {/* rim light from behind-left: outlines the loom posts and the saree edge */}
      <spotLight position={[-4.2, 3.8, -3.6]} angle={0.6} penumbra={0.9} intensity={60} decay={1.6} distance={16} color={PALETTE.antiqueGold} />
      {/* soft fill from the camera side */}
      <spotLight position={[-2.5, 2.4, 6]} angle={0.7} penumbra={1} intensity={22} decay={1.6} distance={14} color="#fff3e2" />

      {/* Local studio reflections for silk & zari (no network HDR) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffe2b8" position={[0, 5, -2]} scale={[8, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} color="#ffd29a" position={[-5, 2, 1]} scale={[3, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.0} color={PALETTE.antiqueGold} position={[5, 1.5, 2]} scale={[3, 3, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 2, 6]} scale={2} />
      </Environment>

      {assets && (
        <>
          {/* Seamless studio floor: warm pool of light, falls off into the dark */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.6]} receiveShadow material={assets.floor}>
            <circleGeometry args={[11, 72]} />
          </mesh>
          <Loom progress={progress} quality={quality} assets={assets} />
          <Saree progress={progress} quality={quality} assets={assets} />
          <SareeBox progress={progress} assets={assets} />
          <ShoppingBag progress={progress} assets={assets} />
          <DustMotes quality={quality} />
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
