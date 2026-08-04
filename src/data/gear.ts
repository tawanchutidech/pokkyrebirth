export const RING_FILENAMES = [
  "แหวนแห่งการคืนชีพระดับสูง", "แหวนแห่งการคืนชีพ", "แหวนแห่งการคืนชีพเก่า",
  "แหวนอมตะระดับสูง", "แหวนอมตะ", "แหวนอมตะเก่า",
  "แหวนแห่งอำนาจระดับสูง", "แหวนแห่งอำนาจ", "แหวนแห่งอำนาจเก่า",
  "แหวนแห่งพลังกายใจระดับสูง", "แหวนกำแพงเหล็กระดับสูง", "แหวนแห่งสุขภาพระดับสูง",
  "แหวนช่วงชิงปราสาทระดับสูง", "แหวนแห่งการปราบปรามระดับสูง", "แหวนแห่งการทำลายล้างระดับสูง", "แหวนเลือดนักสู้ระดับสูง",
  "แหวนเดธ", "แหวนขจัดบัพ", "แหวนตาบอด", "แหวนติดพิษ", "แหวนน้ำแข็ง", "แหวนสตั๊น", "แหวนหลับไหล",
  "แหวนอัมพาต", "แหวนเร่งเทิร์น", "แหวนเลือดไหล",
  "แหวนใบ้",
  "แหวนไฟช๊อต", "แหวนไฟเผา",
  "แหวนคริ", "แหวนจุดอ่อน",
  "แหวนดาเมจ",
  "แหวนต้าน", "แหวนบล๊อค", "แหวนป้องกัน",
  "แหวนเข้าเป้า"
];

export const EQUIPMENT_SET_FILENAMES = [
  "นักฆ่า", "นายประตู", "ผู้บัญชาการ", "ผู้ปรับสมดุล",
  "ผู้พิทักษ์", "ผู้ล้างแค้น", "ผู้ไล่ล่า", "หมอผี", "อัศวินศักดิ์สิทธิ", "ยำ"
];

export type GearItem = { id: string; name: string; img: string };

export const RINGS: GearItem[] = RING_FILENAMES.map((name) => ({
  id: name,
  name,
  img: `/public/ring/${name}.webp`,
}));

export const EQUIPMENT_SETS: GearItem[] = EQUIPMENT_SET_FILENAMES.map((name) => ({
  id: name,
  name,
  img: `/public/equipment-set/${name}.webp`,
}));

export const RING_ALIASES: Record<string, string[]> = {
  "แหวนอมตะระดับสูง":          ["ซอมบี้"],
  "แหวนอมตะ":                   ["ซอมบี้"],
  "แหวนอมตะเก่า":               ["ซอมบี้"],
  "แหวนแห่งการคืนชีพระดับสูง": ["ตายเกิด", "ชุบ"],
  "แหวนแห่งการคืนชีพ":         ["ตายเกิด", "ชุบ"],
  "แหวนแห่งการคืนชีพเก่า":     ["ตายเกิด", "ชุบ"],
};

export function ringMatchesQuery(ring: GearItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (ring.name.toLowerCase().includes(q)) return true;
  return (RING_ALIASES[ring.id] || []).some((alias) => alias.toLowerCase().includes(q));
}

export function getRing(id: string): GearItem | null {
  return RINGS.find((r) => r.id === id) || null;
}

export function getEquipmentSet(id: string): GearItem | null {
  return EQUIPMENT_SETS.find((s) => s.id === id) || null;
}
