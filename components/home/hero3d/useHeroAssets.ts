"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { PALETTE, type QualitySettings } from "./sceneConfig";
import {
  createBagTextures,
  createBrandMarkTexture,
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
  brandMark: THREE.MeshStandardMaterial;
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
  const saree = createSareeTextures(quality.textureSize);
  const loomMap = saree.map.clone();
  const loomOrm = saree.orm.clone();
  for (const t of [loomMap, loomOrm]) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
  }
  const brandTex = createBrandMarkTexture(serif, sans, quality.textureSize);
  const bag = createBagTextures(serif, sans, Math.min(1024, quality.textureSize));

  const silkParams: THREE.MeshPhysicalMaterialParameters = {
    roughness: 1,
    metalness: 1,
    sheen: 1,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color("#ff8f8f"),
    side: THREE.DoubleSide,
  };

  const a: Omit<HeroAssets, "disposables"> = {
    wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.02 }),
    woodDark: new THREE.MeshStandardMaterial({ map: woodTex, color: "#8a6650", roughness: 0.7 }),
    metal: new THREE.MeshStandardMaterial({ color: "#b8afa5", metalness: 0.85, roughness: 0.3 }),
    brass: new THREE.MeshStandardMaterial({ color: PALETTE.antiqueGold, metalness: 0.9, roughness: 0.28 }),
    yarn: new THREE.MeshStandardMaterial({ color: "#9b1629", roughness: 0.42, emissive: "#22030a" }),
    silk: new THREE.MeshPhysicalMaterial({ ...silkParams, map: saree.map, roughnessMap: saree.orm, metalnessMap: saree.orm }),
    loomSilk: new THREE.MeshPhysicalMaterial({ ...silkParams, map: loomMap, roughnessMap: loomOrm, metalnessMap: loomOrm }),
    brandMark: new THREE.MeshStandardMaterial({
      map: brandTex,
      color: "#f2d48e",
      emissive: "#3a2508",
      metalness: 0.75,
      roughness: 0.32,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    bagFront: new THREE.MeshStandardMaterial({ map: bag.map, roughnessMap: bag.orm, metalnessMap: bag.orm, roughness: 1, metalness: 1 }),
    bagBody: new THREE.MeshStandardMaterial({ color: PALETTE.deepMaroon, roughness: 0.86, metalness: 0 }),
    bagInner: new THREE.MeshStandardMaterial({ color: "#2b0a12", roughness: 0.95 }),
    handle: new THREE.MeshStandardMaterial({ color: PALETTE.antiqueGold, metalness: 0.75, roughness: 0.35 }),
    tissue: new THREE.MeshStandardMaterial({ color: "#efe2c4", roughness: 0.75, metalness: 0.15, side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ color: "#1b110d", roughness: 0.92, metalness: 0 }),
  };

  const textures = [woodTex, saree.map, saree.orm, loomMap, loomOrm, brandTex, bag.map, bag.orm];
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
