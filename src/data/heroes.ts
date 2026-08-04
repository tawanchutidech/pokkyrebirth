// Hero catalog organized by tier. Order: Hot → Awake → Legend++ →
// Legend+(7K) → Legend+ → Legend → Rare. Tier 0 (Hot) has no static roster
// of its own — which heroes count as Hot is per-guild data from
// hero-tier-list.html (see js/hero-tier-list.js and
// functions/hero-tier-list/data.js), overlaid at render time by
// castle.js/counter.js rather than baked in here.
export const HERO_TIERS = [
  { tier: 0, label: "HOT", folder: null, names: [] },
  {
    tier: 1, label: "Awake", folder: "Awake",
    names: [
      "ซิลเวสตา Awake", "สกัลด์ Awake", "ออร์ก้า Awake", "เคลมิส Awake",
      "เดลโลนส์ Awake", "เฮฟเว่นเนีย Awake", "เฮเลเนีย Awake", "เอริส Awake", "ลูดี้ Awake",
      "ซอรัน Awake",
    ],
  },
  {
    tier: 2, label: "Legend++", folder: "Legend++",
    names: ["มิเลีย", "จูริ", "โรซี่", "เกลิดัส", "ไพร์"],
  },
  {
    tier: 3, label: "Legend+ (7K)", folder: "Legend+/7K",
    names: ["คริส", "วาเนสซา", "ลูดี้", "เจฟ", "สไปค์", "ราเชล", "ไอลีน"],
  },
  {
    tier: 4, label: "Legend+", folder: "Legend+",
    names: [
      "ซิลเวสตา", "สกัลด์", "ออร์ก้า", "เคลมิส", "เดลโลนส์",
      "เรกินเลฟ", "เมลคีร์", "เอลิเซีย", "เอซ", "เฟรยา", "เพลตัน", "ไคล์",
      "โอม๊ก", "ไรอัน", "แรนด์กริด", "แทโอ", "โคลท์", "แร็ดกริด",
      "บิสกิต", "บรันซ์ & บรันเซล", "พาลานอส", "พยัคฆ์เมฆา", "ซุนหงอคง", "เอริส",
      "นาจา", "ธรูด", "อากีลา", "ออร์ลี่", "ยอนฮี", "มิสต์", "ลิโป้",
      "ริน", "ซองจินอู", "คาร์ม่า", "คางุระ", "คิริเอล", "คาร์ล เฮรอน",
    ],
  },
  {
    tier: 5, label: "Legend", folder: "Legend",
    names: [
      "ทากะ", "ซีค", "บาลิสต้า", "น็อกซ์", "กวนอู", "ชาแฮอิน", "ชานซะเลอร์",
      "ลุค", "รีน่า", "อลิส", "ลูลี่", "พีดัม", "ปาสตาล", "ยูชิน", "มิโฮะ",
      "เบลลีก้า", "เนีย", "เอมิเลีย", "เสี่ยวเฉียว", "เซอิน", "อารากอน",
      "เตียวเสี้ยน", "เดซี่", "แทอู๊ด", "เอสปาด้า", "ไป่เจียว", "ไป่หลง",
    ],
  },
  {
    tier: 6, label: "Rare", folder: "Rare",
    names: [
      "คาริน", "คารอน", "คลีโอ", "จูพี้", "จิน", "จูล่ง", "ซาร่า", "ซิลเวีย",
      "ยูจินโฮ", "ยูริ", "ยูอิ", "ลาเนีย", "ลี", "ลีโอ", "ลูซี่", "วิคตอเรีย",
      "สนิปเปอร์", "หลิงหลิง", "อสุรา", "อีจูฮี", "อีวาน", "เจน", "เซร่า",
      "เบน", "เมย์", "เรย์", "เสี่ยว", "เฟิงเยี่ยน", "เฮฟเว่นเนีย", "เฮเลเนีย",
      "เอเรียล", "แคทตี้", "แบล็กโรส", "แรคคูน", "โคลอี้", "โจ๊กเกอร์",
      "โซอี", "โนโฮ", "โฮกิ้น",
    ],
  },
];

// Element, keyed by character name (without " Awake" suffix sharing the same
// entry as its Awake form where both exist). Read off the small badge icon
// in the bottom-left corner of each portrait: gold/cross = light, red/sword
// = fire, purple/star = dark, blue/paw = water, brown/shield = ground.
export const HERO_ELEMENTS = {
  light: [
    "เคลมิส Awake", "โรซี่", "เคลมิส", "เพลตัน", "บิสกิต", "ออร์ลี่", "รีน่า",
    "อลิส", "เตียวเสี้ยน", "คาริน", "คารอน", "ซาร่า", "ยูอิ", "ลูซี่", "อีจูฮี", "โคลอี้",
  ],
  fire: [
    "ออร์ก้า Awake", "เดลโลนส์ Awake", "เฮฟเว่นเนีย Awake", "ซอรัน Awake", "ไพร์", "ออร์ก้า", "เดลโลนส์",
    "ไคล์", "ไรอัน", "แรนด์กริด", "แทโอ", "โคลท์", "บรันซ์ & บรันเซล", "พยัคฆ์เมฆา",
    "ลิโป้", "คางุระ", "คาร์ล เฮรอน", "ทากะ", "บาลิสต้า", "ชาแฮอิน", "พีดัม", "เอมิเลีย",
    "เซอิน", "แทอู๊ด", "ไป่หลง", "จูพี้", "จิน", "จูล่ง", "ลีโอ", "สนิปเปอร์", "เจน",
    "เมย์", "เรย์", "เสี่ยว", "เฟิงเยี่ยน", "เฮฟเว่นเนีย", "แคทตี้", "แบล็กโรส", "โซอี", "โฮกิ้น",
  ],
  dark: [
    "เอริส Awake", "เกลิดัส", "คริส", "เจฟ", "สไปค์", "ราเชล", "ไอลีน", "เอลิเซีย",
    "เอซ", "พาลานอส", "ซุนหงอคง", "เอริส", "ธรูด", "มิสต์", "คาร์ม่า", "ซีค", "กวนอู",
    "ชานซะเลอร์", "เนีย", "ไป่เจียว", "ลาเนีย", "วิคตอเรีย", "อสุรา",
  ],
  water: [
    "ซิลเวสตา Awake", "สกัลด์ Awake", "มิเลีย", "จูริ", "วาเนสซา", "ซิลเวสตา", "สกัลด์",
    "เรกินเลฟ", "เมลคีร์", "เฟรยา", "โอม๊ก", "นาจา", "ยอนฮี", "ริน", "ซองจินอู", "คิริเอล",
    "ลูลี่", "ปาสตาล", "ยูชิน", "มิโฮะ", "เบลลีก้า", "เสี่ยวเฉียว", "เดซี่", "เอสปาด้า",
    "คลีโอ", "ซิลเวีย", "ยูริ", "หลิงหลิง", "เซร่า", "เบน", "เอเรียล", "โจ๊กเกอร์", "โนโฮ",
  ],
  ground: [
    "เฮเลเนีย Awake", "ลูดี้ Awake", "ลูดี้", "แร็ดกริด", "อากีลา", "น็อกซ์", "ลุค",
    "อารากอน", "ยูจินโฮ", "ลี", "อีวาน", "เฮเลเนีย", "แรคคูน",
  ],
};
export const HERO_ELEMENT_BY_NAME = Object.fromEntries(
  Object.entries(HERO_ELEMENTS).flatMap(([elem, names]) => names.map((n) => [n, elem]))
);

export const ELEMENTS = [
  { id: "light",  label: "แสง" },
  { id: "fire",   label: "ไฟ" },
  { id: "dark",   label: "มืด" },
  { id: "water",  label: "น้ำ" },
  { id: "ground", label: "ดิน" },
];
export type ElementId = (typeof ELEMENTS)[number]["id"];

export type Hero = {
  id: string;
  name: string;
  tier: number;
  tierLabel: string;
  element: ElementId | null;
  img: string;
};

export const HEROES: Hero[] = HERO_TIERS.flatMap(({ tier, label, folder, names }) =>
  names.map((name) => ({
    id: name,
    name,
    tier,
    tierLabel: label,
    element: (HERO_ELEMENT_BY_NAME[name] as ElementId) || null,
    img: `/public/images/${folder}/${name}.webp`,
  }))
);

export const HERO_BY_ID: Record<string, Hero> = Object.fromEntries(HEROES.map((h) => [h.id, h]));
export const NO_PICTURE = "/public/images/NoPicture.webp";

export const HERO_ALIASES: Record<string, string[]> = {
  "ซุนหงอคง":       ["ลิง"],
  "เกลิดัส":        ["ป๋า"],
  "โรซี่":          ["พระแม่"],
  "ลิโป้":          ["ม้า"],
  "แรนด์กริด":      ["ม้า"],
  "บรันซ์ & บรันเซล": ["แฝด"],
};

export function getHero(id: string): Hero | null {
  return HERO_BY_ID[id] || null;
}

// Hot overlay — see hero-tier-list.html/js/hero-tier-list.js. hotRanks maps
// heroId -> true for the current guild; a hero with an entry there displays
// under the HOT header (tier 0) instead of its normal static tier in
// castle.js/counter.js's picker.
export function heroEffectiveTier(hero: Hero, hotRanks: Record<string, boolean> | null | undefined): number {
  return hotRanks && hotRanks[hero.id] ? 0 : hero.tier;
}

export function heroMatchesQuery(hero: Hero, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (hero.name.toLowerCase().includes(q)) return true;
  return (HERO_ALIASES[hero.id] || []).some((alias) => alias.toLowerCase().includes(q));
}
