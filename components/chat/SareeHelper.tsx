"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { getWhatsAppLink } from "@/config/site";
import { KB, STARTERS, findAnswer, type KbEntry } from "@/lib/chat/knowledge";
import { useI18n } from "@/i18n/I18nProvider";

type Msg = { from: "me" | "bot"; text: string; entry?: KbEntry; handoff?: boolean };

/**
 * Small saree helper chat. Answers come only from PVS's written guide (lib/chat/knowledge.ts);
 * anything else is handed to a person on WhatsApp — it never makes up prices or dates.
 * Also hosts the WhatsApp shortcut, so the corner has one tidy stack of buttons.
 */
export function SareeHelper() {
  const { t, locale } = useI18n();
  const c = t.chat;
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Hidden during the 3D story (it has its own controls); shown after the first screen elsewhere.
    const onScroll = () => {
      const story = document.querySelector<HTMLElement>("[data-hero-story]");
      if (story && story.offsetHeight > 0) {
        const end = story.offsetTop + story.offsetHeight - window.innerHeight;
        setVisible(window.scrollY >= end);
      } else setVisible(window.scrollY > window.innerHeight * 0.4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = (q: string, entry?: KbEntry | null) => {
    const found = entry ?? findAnswer(q);
    setMsgs((m) => [
      ...m,
      { from: "me", text: q },
      found ? { from: "bot", text: found.a[locale], entry: found } : { from: "bot", text: c.noAnswer, handoff: true },
    ]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setText("");
    ask(q);
  };

  const lastQuestion = [...msgs].reverse().find((m) => m.from === "me")?.text ?? "";
  const starters = STARTERS.map((id) => KB.find((k) => k.id === id)).filter(Boolean) as KbEntry[];

  return (
    <>
      {/* Launchers */}
      <div
        className={`fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 transition-all duration-500 ${
          visible || open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex items-center gap-2 rounded-full bg-gold-500 hover:bg-gold-400 text-heritage-brown-950 pl-4 pr-5 h-12 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] text-sm font-semibold"
            aria-haspopup="dialog"
            tabIndex={visible ? 0 : -1}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" /> {c.launcher}
          </button>
        )}
        <a
          href={getWhatsAppLink(t.common.whatsappHello)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.common.chatWhatsapp}
          tabIndex={visible ? 0 : -1}
          className="h-14 w-14 rounded-full bg-heritage-brown-950 text-gold-300 border border-gold-400/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] flex items-center justify-center hover:bg-silk-red-700 transition-colors"
        >
          <MessageCircle className="w-6 h-6" aria-hidden="true" />
        </a>
      </div>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={c.title}
          className="fixed z-50 bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[380px] h-[min(620px,88svh)] flex flex-col rounded-t-3xl sm:rounded-3xl bg-ivory-50 border border-heritage-brown-100 shadow-[0_30px_80px_-30px_rgba(43,24,18,0.7)] overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 bg-heritage-brown-950 text-ivory-50 px-5 py-4">
            <div>
              <p className="font-serif text-xl">{c.title}</p>
              <p className="mt-0.5 text-[11px] text-ivory-300 leading-snug">{c.subtitle}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/10" aria-label={t.common.closeMenu}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white border border-heritage-brown-100 px-4 py-3 text-sm text-heritage-brown-900">{c.hello}</div>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {starters.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => ask(e.q[locale], e)}
                    className="rounded-full border border-gold-400/70 bg-gold-50 px-3 py-1.5 text-xs font-medium text-heritage-brown-900 hover:bg-gold-100"
                  >
                    {e.q[locale]}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) =>
              m.from === "me" ? (
                <div key={i} className="ml-auto max-w-[85%] w-fit rounded-2xl rounded-tr-sm bg-silk-red-700 text-ivory-50 px-4 py-2.5 text-sm">
                  {m.text}
                </div>
              ) : (
                <div key={i} className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white border border-heritage-brown-100 px-4 py-3 text-sm text-heritage-brown-900 leading-relaxed">
                  <p>{m.text}</p>
                  {m.entry?.link && (
                    <Link href={m.entry.link.href} onClick={() => setOpen(false)} className="mt-2 inline-block text-xs font-semibold text-silk-red-700 underline">
                      {m.entry.link.label[locale]} →
                    </Link>
                  )}
                  {m.handoff && (
                    <a
                      href={getWhatsAppLink(`${t.common.whatsappHello}\n${lastQuestion}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-silk-red-700 underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t.common.sendOnWhatsapp}
                    </a>
                  )}
                </div>
              ),
            )}
            {msgs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {KB.filter((e) => !msgs.some((m) => m.entry?.id === e.id))
                  .slice(0, 3)
                  .map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => ask(e.q[locale], e)}
                      className="rounded-full border border-heritage-brown-200 bg-white px-3 py-1.5 text-[11px] text-heritage-brown-800 hover:border-gold-500"
                    >
                      {e.q[locale]}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-heritage-brown-100 bg-white p-3 flex gap-2">
            <label htmlFor="pvs-chat-input" className="sr-only">
              {c.placeholder}
            </label>
            <input
              ref={inputRef}
              id="pvs-chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={c.placeholder}
              maxLength={300}
              autoComplete="off"
              className="flex-1 rounded-full border border-heritage-brown-200 px-4 py-2.5 text-sm focus:border-silk-red-600 focus:outline-none focus:ring-2 focus:ring-silk-red-600/20"
            />
            <button type="submit" className="h-10 w-10 shrink-0 rounded-full bg-silk-red-700 text-ivory-50 flex items-center justify-center hover:bg-heritage-brown-950" aria-label={c.send}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
