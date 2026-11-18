import type { Fact } from "@/data/business";

/**
 * Visible only for unconfirmed facts in draft mode (dev). Tells the owner exactly what to confirm.
 * In production, unconfirmed facts are not rendered at all (see `visible()` in data/business.ts).
 */
export function DraftBadge({ fact }: { fact: Fact<unknown> }) {
  if (fact.confirmed) return null;
  return (
    <span
      title={fact.ask ?? "To confirm with PVS"}
      className="inline-flex items-center rounded-full bg-amber-100 border border-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-amber-900 align-middle"
    >
      To confirm{fact.ask ? `: ${fact.ask}` : ""}
    </span>
  );
}
