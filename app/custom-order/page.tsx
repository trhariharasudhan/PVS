import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderBuilder } from "@/components/custom-order/OrderBuilder";
import { WaysToOrder } from "@/components/sections/WaysToOrder";
import { PaymentTerms } from "@/components/sections/PaymentTerms";
import { KovilBorder } from "@/components/ui/Ornament";
import { getI18n } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.customOrder.title, description: t.meta.customOrder.description, alternates: { canonical: "/custom-order" } };
}

export default function CustomOrderPage() {
  const { t } = getI18n();
  return (
    <div className="bg-ivory-50 bg-weave">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{t.order.eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
          {t.order.titleA} <span className="italic text-silk-red-700">{t.order.titleB}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">
          {t.order.intro}
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Suspense>
          <OrderBuilder />
        </Suspense>
        <PaymentTerms className="mt-16" />
      </section>

      <section className="bg-heritage-brown-950 py-20">
        <KovilBorder className="w-full h-3 text-gold-500/40 -mt-20 mb-16" count={80} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl text-ivory-50">{t.ways.otherWays}</h2>
          <div className="mt-8">
            <WaysToOrder dark showDesignCard={false} />
          </div>
        </div>
      </section>
    </div>
  );
}
