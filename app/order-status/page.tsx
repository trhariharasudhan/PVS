import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderStatusLookup } from "@/components/custom-order/OrderStatusLookup";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the progress of your PVS custom saree order with your reference code and phone number.",
  robots: { index: false, follow: true },
};

export default function OrderStatusPage() {
  return (
    <div className="bg-ivory-50 bg-weave min-h-[70vh]">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">Track your order</p>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl font-medium leading-[1] text-heritage-brown-950">Where is my saree?</h1>
        <p className="mt-5 text-heritage-brown-700">
          Enter the reference code you received (like <span className="font-mono">PVS-7KQ2MX</span>) and the phone number you used.
        </p>
        <Suspense>
          <OrderStatusLookup />
        </Suspense>
      </section>
    </div>
  );
}
