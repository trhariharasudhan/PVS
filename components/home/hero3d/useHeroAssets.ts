"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { PALETTE, type QualitySettings } from "./sceneConfig";
import {
  createBagTextures,
  createStudioFloorTexture,
  createSareeTextures,
  createWoodTexture,
  ensureFonts,
  resolveFontFamily,
} from "./textures";

export interface HeroAssets {
  wood: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  yarn: THREE.MeshStandardMaterial;
  /** Saree silk for the detached presentation cloth. */
  silk: THREE.MeshPhysicalMaterial;
  /** Same silk, texture rotated so zari borders run along the loom (warp direction). */
  loomSilk: THREE.MeshPhysicalMaterial;
  /** Saree box: lid top carries the PVS mark, body is maroon board, inside is ivory. */
  boxLid: THREE.MeshStandardMaterial;
  boxBody: THREE.MeshStandardMaterial;
  boxInner: THREE.MeshStandardMaterial;
  bagFront: THREE.MeshStandardMaterial;
  bagBody: THREE.MeshStandardMaterial;
  bagInner: THREE.MeshStandardMaterial;
  handle: THREE.MeshStandardMaterial;
  tissue: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  /** Every disposable GPU resource, for cleanup. */
  disposables: { dispose: () => void }[];
}

function build(quality: QualitySettings, serif: string, sans: string): HeroAssets {
  const woodTex = createWoodTexture(512);
  const saree = createSareeTextures(quality.textureSize, undefined, serif, sans);
  const loomMap = saree.map.clone();
  const loomOrm = saree.orm.clone();
  for (const t of [loomMap, loomOrm]) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
  }
  const floorTex = createStudioFloorTexture(1024);
  const bag = createBagTextures(serif, sans, Math.min(1024, quality.textureSize));

  const silkParams: THREE.MeshPhysicalMaterialParameters = {
    roughness: 1,
    metalness: 1,
    sheen: 0.8,
    sheenRoughness: 0.42,
    sheenColor: new THREE.Color("#ffc7a0"),
    side: THREE.DoubleSide,
  };

  const a: Omit<HeroAssets, "disposables"> = {
    wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.02 }),
    woodDark: new THREE.MeshStandardMaterial({ map: woodTex, color: "#8a6650", roughness: 0.7 }),
    metal: new THREE.MeshStandardMaterial({ color: "#b8afa5", metalness: 0.85, roughness: 0.3 }),
    brass: new THREE.MeshStandardMaterial({ color: PALETTE.antiqueGold, metalness: 0.9, roughness: 0.28 }),
    yarn: new THREE.MeshStandardMaterial({ color: "#9b1629", roughness: 0.42, emissive: "#22030a" }),
    silk: new THREE.MeshPhysicalMaterial({ ...silkParams, map: saree.map, roughnessMap: saree.orm, metalnessMap: saree.orm }),
    // on the loom the cloth is seen close and at grazing angles under the key light: less sheen
    loomSilk: new THREE.MeshPhysicalMaterial({ ...silkParams, sheen: 0.35, envMapIntensity: 0.7, map: loomMap, roughnessMap: loomOrm, metalnessMap: loomOrm }),
    boxLid: new THREE.MeshStandardMaterial({ map: bag.map, roughnessMap: bag.orm, metalnessMap: bag.orm, roughness: 1, metalness: 1 }),
    boxBody: new THREE.MeshStandardMaterial({ color: "#5a1424", roughness: 0.7, metalness: 0.05 }),
    boxInner: new THREE.MeshStandardMaterial({ color: "#efe4cc", roughness: 0.85 }),
    bagFront: new THREE.MeshStandardMaterial({ map: bag.map, roughnessMap: bag.orm, metalnessMap: bag.orm, roughness: 1, metalness: 1 }),
    bagBody: new THREE.MeshStandardMaterial({ color: PALETTE.deepMaroon, roughness: 0.86, metalness: 0 }),
    bagInner: new THREE.MeshStandardMaterial({ color: "#2b0a12", roughness: 0.95 }),
    handle: new THREE.MeshStandardMaterial({ color: PALETTE.antiqueGold, metalness: 0.75, roughness: 0.35 }),
    tissue: new THREE.MeshStandardMaterial({ color: "#efe2c4", roughness: 0.75, metalness: 0.15, side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.82, metalness: 0 }),
  };

  const textures = [woodTex, saree.map, saree.orm, loomMap, loomOrm, floorTex, bag.map, bag.orm];
  return { ...a, disposables: [...Object.values(a), ...textures] };
}

/**
 * Creates the hero's textures and materials once the brand fonts are loaded.
 * Returns null while preparing. Disposes everything on unmount.
 */
export function useHeroAssets(quality: QualitySettings): HeroAssets | null {
  const [assets, setAssets] = useState<HeroAssets | null>(null);

  useEffect(() => {
    let cancelled = false;
    let built: HeroAssets | null = null;
    const serif = resolveFontFamily("--font-serif", "Georgia, serif");
    const sans = resolveFontFamily("--font-sans", "Arial, sans-serif");
    ensureFonts(serif, sans).then(() => {
      if (cancelled) return;
      built = build(quality, serif, sans);
      setAssets(built);
    });
    return () => {
      cancelled = true;
      built?.disposables.forEach((d) => d.dispose());
    };
  }, [quality]);

  return assets;
}
