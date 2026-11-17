"use client";

import { useCallback, useEffect, useState } from "react";
import { QUALITY, type QualitySettings } from "./sceneConfig";
import { HeroFallback } from "./HeroFallback";
import { HeroScrollStory } from "./HeroScrollStory";

/**
 * Homepage hero entry point.
 *
 * Decides BEFORE first paint (tiny inline script) whether this device gets the 3D
 * scroll story or the static hero, so there is no flash/jump between the two:
 *   - prefers-reduced-motion      → static
 *   - no WebGL                    → static
 *   - data-saver / ≤2 GB / ≤2 CPU → static
 * The static hero is always in the server HTML (SEO + no-JS), hidden by CSS when
 * 3D is chosen. If WebGL later fails (context lost / render error) we fall back.
 */

const DECIDE_SCRIPT = `(function(){try{
var d=document.documentElement,n=navigator;
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var c=n.connection;if(c&&c.saveData)return;
if((n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2))return;
var cv=document.createElement('canvas');var gl=cv.getContext('webgl2')||cv.getContext('webgl');if(!gl)return;
var l=gl.getExtension('WEBGL_lose_context');if(l)l.loseContext();
d.setAttribute('data-hero3d','1');
}catch(e){}})();`;

/** Same checks as DECIDE_SCRIPT, for client-side navigations (inline scripts don't run then). */
function canRun3d(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (n.connection?.saveData) return false;
    if ((n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2)) return false;
    const cv = document.createElement("canvas");
    const gl = (cv.getContext("webgl2") || cv.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function pickQuality(): QualitySettings {
  const w = window.innerWidth;
  if (w < 768) return QUALITY.low;
  if (w < 1280) return QUALITY.medium;
  return QUALITY.high;
}

export function HeroExperience() {
  const [quality, setQuality] = useState<QualitySettings | null>(null);

  const disable3d = useCallback((reason: string) => {
    console.warn(`[PVS hero] falling back to static hero: ${reason}`);
    document.documentElement.removeAttribute("data-hero3d");
    setQuality(null);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-hero3d") !== "1" && canRun3d()) root.setAttribute("data-hero3d", "1");
    if (root.getAttribute("data-hero3d") === "1") setQuality(pickQuality());

    // Respect a reduced-motion change made while the page is open.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      if (mq.matches) disable3d("reduced-motion");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [disable3d]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DECIDE_SCRIPT }} />
      <HeroFallback />
      {quality ? (
        <HeroScrollStory quality={quality} onFatal={disable3d} />
      ) : (
        // Same-size placeholder so 3D visitors never see the static hero flash before hydration.
        <div className="hero-3d-placeholder bg-[#140c0a] h-[100svh]" aria-hidden="true" />
      )}
    </>
  );
}
