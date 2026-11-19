"use client";

import { useEffect, useRef } from "react";
import { FOLD, FOLD_STEPS, SCENES } from "./sceneConfig";
import type { ProgressStore } from "./math";

/**
 * Live checklist of PVS's seven folding steps, shown under the packing copy.
 * The step being performed in the 3D scene lights up; finished steps get a tick.
 * Reads the shared progress store in a rAF loop and writes classes directly (no re-renders).
 */
export function FoldSteps({ progress, labels }: { progress: ProgressStore; labels: readonly string[] }) {
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let last = "";
    const [a, b] = SCENES.packaging;
    const tick = () => {
      const tP = (progress.value - a) / (b - a);
      let state = "";
      FOLD_STEPS.forEach((id) => {
        const [s, e] = FOLD[id];
        state += tP >= e ? "d" : tP >= s ? "a" : "n";
      });
      if (state !== last) {
        last = state;
        items.current.forEach((li, i) => {
          if (!li) return;
          li.dataset.state = state[i] === "d" ? "done" : state[i] === "a" ? "active" : "next";
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <ol className="fold-steps mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] sm:text-[13px] max-w-md">
      {labels.map((label, i) => (
        <li
          key={i}
          ref={(el) => {
            items.current[i] = el;
          }}
          data-state="next"
          className="group flex items-center gap-2 text-ivory-200/45 transition-colors duration-300 data-[state=active]:text-gold-200 data-[state=done]:text-ivory-200/80"
        >
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-semibold transition-colors group-data-[state=active]:bg-gold-400 group-data-[state=active]:text-[#140c0a] group-data-[state=active]:border-gold-400">
            <span className="group-data-[state=done]:hidden">{i + 1}</span>
            <span className="hidden group-data-[state=done]:inline" aria-hidden="true">✓</span>
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
