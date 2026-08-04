export const PET_FILENAMES = [
  "ครี", "คารัม", "จีฟ", "ดอจ", "มิค", "ยอนจี", "ยู", "รีเชล",
  "ลู", "อีรีน", "เจโอ", "เดลโล่", "เมลแปร์โรว์", "เอริ", "โยรัง", "ไพค์", "วินดี้"
];

export type Pet = { id: string; name: string; img: string };

export const PETS: Pet[] = PET_FILENAMES.map((name) => ({
  id: name,
  name,
  img: `/public/pet/${name}.webp`,
}));

export function getPet(id: string): Pet | null {
  return PETS.find((p) => p.id === id) || null;
}
