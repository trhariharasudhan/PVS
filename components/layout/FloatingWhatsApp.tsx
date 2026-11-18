"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getWhatsAppLink } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";

/** Quiet floating WhatsApp button; appears after the first screen of scrolling. */
export function FloatingWhatsApp() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={getWhatsAppLink(t.common.whatsappHello)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.common.chatWhatsapp}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-heritage-brown-950 text-gold-300 border border-gold-400/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-500 hover:bg-silk-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <MessageCircle className="w-6 h-6" aria-hidden="true" />
    </a>
  );
}
