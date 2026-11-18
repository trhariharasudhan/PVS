import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderBuilder } from "@/components/custom-order/OrderBuilder";
import { WaysToOrder } from "@/components/sections/WaysToOrder";
import { KovilBorder } from "@/components/ui/Ornament";

export const metadata: Metadata = {
  title: "Custom Silk Saree Order — Your Colours, Your Design",
  description:
    "Order a silk saree woven to your design: upload a photo, choose body, border and pallu colours, silk type, silk percentage and zari. Made to order by PVS in Salem district.",
  alternates: { canonical: "/custom-order" },
};

export default function CustomOrderPage() {
  return (
    <div className="bg-ivory-50 bg-weave">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">Custom order</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
          Design the saree. <span className="italic text-silk-red-700">We&apos;ll weave it.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">
          No ready stock, no compromises — every PVS saree is woven to order. Share your design and choices below, and we&apos;ll confirm
          feasibility, materials and price before anything goes on the loom.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Suspense>
          <OrderBuilder />
        </Suspense>
      </section>

      <section className="bg-heritage-brown-950 py-20">
        <KovilBorder className="w-full h-3 text-gold-500/40 -mt-20 mb-16" count={80} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl text-ivory-50">Other ways to order</h2>
          <div className="mt-8">
            <WaysToOrder dark showDesignCard={false} />
          </div>
        </div>
      </section>
    </div>
  );
}
