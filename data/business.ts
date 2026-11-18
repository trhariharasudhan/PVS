/**
 * PVS business content: ordering options, customer problems we solve, and the founder story.
 *
 * TRUTH POLICY
 * ------------
 * Anything marked `confirmed: false` is a placeholder waiting for the owner's answer.
 * Unconfirmed facts are shown ONLY in development (or when NEXT_PUBLIC_SHOW_DRAFT_CONTENT=true)
 * with a visible "TO CONFIRM" badge, and are hidden in production builds.
 * Never flip `confirmed` to true without the owner's confirmation.
 */

export const SHOW_DRAFT_CONTENT =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DRAFT_CONTENT === "true";

export interface Fact<T = string> {
  value: T;
  confirmed: boolean;
  /** What we still need to ask (shown to the owner in draft mode). */
  ask?: string;
}

export const visible = <T,>(f: Fact<T>) => f.confirmed || SHOW_DRAFT_CONTENT;

/* ------------------------------------------------------------------ */
/* Founder journey (About page)                                        */
/* ------------------------------------------------------------------ */

export interface Milestone {
  year: Fact<string>;
  title: string;
  body: Fact<string>;
}

export const FOUNDER = {
  name: { value: "Sathish Kumar", confirmed: true } as Fact,
  learnedFrom: {
    value: "Learned the craft of silk weaving hands-on, one loom at a time.",
    confirmed: false,
    ask: "How did Sathish Kumar learn weaving? (family / worked under a master weaver / self-taught)",
  } as Fact,
  startYear: { value: "20XX", confirmed: false, ask: "Which year did PVS start?" } as Fact,
};

export const MILESTONES: Milestone[] = [
  {
    year: { value: "20XX", confirmed: false, ask: "Year he started" },
    title: "One weaver, one loom",
    body: {
      value: "Sathish Kumar begins weaving on a single loom in Panjakalipatti, learning every step from warp to finished saree.",
      confirmed: false,
      ask: "Confirm the starting story",
    },
  },
  {
    year: { value: "20XX", confirmed: false, ask: "Year of first expansion" },
    title: "More looms, more hands",
    body: {
      value: "Growing demand from local saree shops brings additional looms and skilled weavers into the workshop.",
      confirmed: false,
      ask: "When and how many looms / weavers?",
    },
  },
  {
    year: { value: "20XX", confirmed: false, ask: "Year wholesale supply began" },
    title: "Supplying retailers",
    body: {
      value: "PVS becomes a regular manufacturing partner for boutiques and saree retailers.",
      confirmed: false,
      ask: "Confirm wholesale history",
    },
  },
  {
    year: { value: "Today", confirmed: true },
    title: "Weaving for families directly",
    body: {
      value: "Alongside wholesale, PVS now weaves made-to-order sarees for families and individual customers — your colours, your design, from our looms.",
      confirmed: true,
    },
  },
];

export const WORKSHOP_FACTS: { label: string; fact: Fact }[] = [
  { label: "Years of weaving", fact: { value: "XX+", confirmed: false, ask: "How many years?" } },
  { label: "Looms in our workshop", fact: { value: "XX", confirmed: false, ask: "How many looms (handloom / power loom)?" } },
  { label: "Skilled weavers", fact: { value: "XX", confirmed: false, ask: "How many weavers work with PVS?" } },
];

/* ------------------------------------------------------------------ */
/* Ordering                                                            */
/* ------------------------------------------------------------------ */

export const ORDER_TERMS = {
  retailMinimum: { value: "1 saree", confirmed: false, ask: "Minimum order for families (is 1 saree OK?)" } as Fact,
  wholesaleMinimum: { value: "To be discussed", confirmed: false, ask: "Minimum order quantity for retailers" } as Fact,
  leadTime: { value: "Usually 2–6 weeks, depending on design", confirmed: false, ask: "Typical making time" } as Fact,
  advance: { value: "Advance confirmed with quotation", confirmed: false, ask: "Advance payment terms" } as Fact,
};

export const SAREE_TYPES = [
  "Wedding / bridal pattu saree",
  "Traditional pattu saree",
  "Soft silk saree",
  "Silk cotton saree",
  "Festive / function saree",
  "Uniform / group order",
  "Something else (describe below)",
];

export const OCCASIONS = ["Wedding", "Engagement", "Festival", "Temple / pooja", "Gift", "Store stock", "Other"];

/**
 * Material options a customer can REQUEST. PVS confirms feasibility and price on the quotation;
 * these are standard industry options, not a claim that every one is in stock.
 */
export const SILK_TYPES: { id: string; label: string; help: string; fixedPercent?: number }[] = [
  { id: "pure-mulberry", label: "Pure mulberry silk", help: "100% silk warp and weft. Richest drape and lustre.", fixedPercent: 100 },
  { id: "soft-silk", label: "Soft silk", help: "Lighter, softer silk. Easy to wear all day.", fixedPercent: 100 },
  { id: "silk-cotton", label: "Silk cotton", help: "Silk blended with cotton. Breathable and lighter on the budget." },
  { id: "art-silk-blend", label: "Art silk / blend", help: "Silk-look fibres blended for an affordable option." },
  { id: "not-sure", label: "Not sure — please advise", help: "Tell us the occasion and budget; we'll suggest the right silk." },
];

export const ZARI_TYPES: { id: string; label: string; help: string; tone: string }[] = [
  { id: "pure", label: "Pure zari", help: "Silver thread with gold coating. Highest value; holds resale value.", tone: "#C9A24E" },
  { id: "tested", label: "Tested / half-fine zari", help: "Copper with silver & gold plating. Durable and widely used.", tone: "#D8B25C" },
  { id: "silver", label: "Silver-look zari", help: "Silver-toned zari for a contemporary finish.", tone: "#C8C8CC" },
  { id: "thread", label: "No zari (silk thread work)", help: "Motifs in contrasting silk thread only.", tone: "" },
  { id: "not-sure", label: "Not sure — please advise", help: "We'll explain the difference and price for each.", tone: "#D8B25C" },
];

export const BORDER_STYLES = ["Temple (kovil) border", "Plain zari border", "Contrast korvai-style border", "Small butta border", "Borderless / minimal", "As per my design"];

export const BUDGET_RANGES = ["Under ₹5,000", "₹5,000 – ₹10,000", "₹10,000 – ₹20,000", "₹20,000 – ₹40,000", "Above ₹40,000", "Discuss with me"];

/* ------------------------------------------------------------------ */
/* Customer problems → how PVS solves them (home + how-we-weave)       */
/* ------------------------------------------------------------------ */

export const PROBLEMS_WE_SOLVE = [
  {
    problem: "“Is this really pure silk?”",
    solution: "Every order gets a written spec: silk type, silk %, zari type. What we write is what we weave.",
  },
  {
    problem: "Confusing zari grades",
    solution: "We explain pure, tested and silver-look zari in plain words before you decide — and the price of each.",
  },
  {
    problem: "The colour came out different",
    solution: "Choose exact colours online, then approve a photo or colour swatch before weaving starts.",
  },
  {
    problem: "“I can't explain the design I want”",
    solution: "Upload a photo, sketch or screenshot. We'll tell you honestly what can be woven and how.",
  },
  {
    problem: "No updates, missed dates",
    solution: "A reference code to track your order, plus progress photos from the loom on WhatsApp.",
  },
  {
    problem: "Middlemen markup",
    solution: "You order directly from the weaving unit in Salem district — no showroom margin in between.",
  },
];
