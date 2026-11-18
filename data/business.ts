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

/**
 * Option ids. Labels live in the dictionaries (i18n/dictionaries/*.ts → options.*), so the
 * same id shows in Tamil or English. Orders are stored with the ENGLISH label so PVS staff
 * always read one language in the admin.
 */
export const SAREE_TYPE_IDS = ["wedding", "traditional", "soft", "silkCotton", "festive", "group", "other"] as const;
export const OCCASION_IDS = ["wedding", "engagement", "festival", "temple", "gift", "stock", "other"] as const;
export const BUDGET_IDS = ["u5", "r5_10", "r10_20", "r20_40", "o40", "discuss"] as const;

/**
 * Material options a customer can REQUEST. PVS confirms feasibility and price on the quotation;
 * these are standard industry options, not a claim that every one is in stock.
 */
export const SILK_OPTIONS = [
  { id: "pureMulberry", fixedPercent: 100 },
  { id: "softSilk", fixedPercent: 100 },
  { id: "silkCotton" },
  { id: "artSilk" },
  { id: "notSure" },
] as const satisfies readonly { id: string; fixedPercent?: number }[];

export const ZARI_OPTIONS = [
  { id: "pure", tone: "gold" },
  { id: "tested", tone: "gold" },
  { id: "silver", tone: "silver" },
  { id: "antique", tone: "antique" },
  { id: "thread", tone: "none" },
  { id: "notSure", tone: "gold" },
] as const;

/** Traditional colour names customers use, with the hex we preview. */
export const SWATCHES = [
  { id: "arakku", hex: "#7A1022" },
  { id: "kumkumam", hex: "#B3122E" },
  { id: "rani", hex: "#C2185B" },
  { id: "onion", hex: "#E7A1A8" },
  { id: "manjal", hex: "#E9B21B" },
  { id: "mustard", hex: "#C48A12" },
  { id: "kili", hex: "#5DA130" },
  { id: "bottle", hex: "#0F4D3A" },
  { id: "mayilKazhuthu", hex: "#0E6E73" },
  { id: "peacockBlue", hex: "#0B4F8A" },
  { id: "royal", hex: "#23338F" },
  { id: "midnight", hex: "#121B3D" },
  { id: "vadamalli", hex: "#5B1E5E" },
  { id: "lavender", hex: "#9C86C4" },
  { id: "offWhite", hex: "#F2E8D5" },
  { id: "black", hex: "#141113" },
] as const;
