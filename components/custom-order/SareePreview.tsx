"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Hand, RectangleHorizontal } from "lucide-react";
import type { SareeDesign } from "@/lib/saree/render";
import { SareeFlat } from "@/components/saree/SareeFlat";
import { canRun3d } from "@/lib/device";
import { useI18n } from "@/i18n/I18nProvider";

const SareeDrape3D = dynamic(() => import("@/components/saree/SareeDrape3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-ivory-100" />,
});

/**
 * Live preview of the customer's choices.
 *  - 3D: the saree hanging on a display rod (drag to turn) — only on capable devices
 *  - Flat: the whole saree laid out, borders, body and pallu visible at once
 * Always labelled as an illustration, never presented as a photo.
 */
export function SareePreview({ design, className = "" }: { design: SareeDesign; className?: string }) {
  const { t } = useI18n();
  const [can3d, setCan3d] = useState(false);
  const [view, setView] = useState<"3d" | "flat">("flat");

  useEffect(() => {
    const ok = canRun3d();
    setCan3d(ok);
    if (ok) setView("3d");
  }, []);

  const btn = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? "bg-heritage-brown-950 text-gold-300" : "text-heritage-brown-800 hover:text-silk-red-700"
    }`;

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-2xl border border-heritage-brown-100 bg-[#f4ecdd]">
        {view === "3d" && can3d ? (
          <div className="aspect-[5/4]">
            <SareeDrape3D design={design} label={t.common.illustration} />
            <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-heritage-brown-950/70 px-3 py-1 text-[11px] text-ivory-50">
              <Hand className="w-3.5 h-3.5" aria-hidden="true" /> {t.order.dragHint}
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            <SareeFlat design={design} variant="full" className="h-40 sm:h-48" label={t.common.illustration} />
            <SareeFlat design={design} variant="fold" className="h-56" label={t.common.illustration} />
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {can3d && (
          <div role="group" aria-label={t.order.previewTitle} className="inline-flex rounded-full border border-heritage-brown-100 bg-white p-0.5">
            <button type="button" aria-pressed={view === "3d"} onClick={() => setView("3d")} className={btn(view === "3d")}>
              <Box className="w-3.5 h-3.5" aria-hidden="true" /> {t.order.view3d}
            </button>
            <button type="button" aria-pressed={view === "flat"} onClick={() => setView("flat")} className={btn(view === "flat")}>
              <RectangleHorizontal className="w-3.5 h-3.5" aria-hidden="true" /> {t.order.viewFlat}
            </button>
          </div>
        )}
        <p className="text-[11px] text-heritage-brown-600">{t.common.illustration}</p>
      </div>
    </div>
  );
}
