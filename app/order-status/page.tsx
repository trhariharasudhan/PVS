import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderStatusLookup } from "@/components/custom-order/OrderStatusLookup";
import { getI18n } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.orderStatus.title, description: t.meta.orderStatus.description, robots: { index: false, follow: true } };
}

export default function OrderStatusPage() {
  const { t } = getI18n();
  return (
    <div className="bg-ivory-50 bg-weave min-h-[70vh]">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{t.status.eyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl font-medium leading-[1] text-heritage-brown-950">{t.status.title}</h1>
        <p className="mt-5 text-heritage-brown-700">
          {t.status.intro}
        </p>
        <Suspense>
          <OrderStatusLookup />
        </Suspense>
      </section>
    </div>
  );
}
