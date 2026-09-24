export interface RobloxLimitedItem {
  id: number;
  name: string;
  acronym: string;
  rap: number; // Recent Average Price
  value: number; // Rolimons Trading Value (-1 if not assigned)
  defaultPrice: number; // Best price / original
  demand: number; // 0: Terrible, 1: Low, 2: Normal, 3: High, 4: Amazing
  trend: number; // 0: Lowering, 1: Unstable, 2: Stable, 3: Raising, 4: Fluctuating
  projected: number; // 1 if projected/inflated, -1 otherwise
  hyped: number; // 1 if hyped, -1 otherwise
  rare: number; // 1 if rare, -1 otherwise
  thumbnail?: string;
  salesCount?: number;
}

export interface RobloxLimitedsResponse {
  success: boolean;
  totalItems: number;
  updatedAt: string;
  items: RobloxLimitedItem[];
}

export const DEMAND_LABELS: Record<number, { label: string; color: string }> = {
  [-1]: { label: 'ไม่มีข้อมูล', color: 'text-zinc-500' },
  0: { label: 'ต่ำมาก (Terrible)', color: 'text-rose-500' },
  1: { label: 'ต่ำ (Low)', color: 'text-orange-400' },
  2: { label: 'ปานกลาง (Normal)', color: 'text-amber-400' },
  3: { label: 'สูง (High) 🔥', color: 'text-emerald-400' },
  4: { label: 'ยอดนิยมสูงสุด (Amazing) 🌟', color: 'text-fuchsia-400 font-bold' },
};

export const TREND_LABELS: Record<number, { label: string; color: string }> = {
  [-1]: { label: 'คงที่', color: 'text-zinc-400' },
  0: { label: '📉 ราคาลดลง (Lowering)', color: 'text-rose-400' },
  1: { label: '⚡ ผันผวน (Unstable)', color: 'text-amber-400' },
  2: { label: '⚖️ ทรงตัว (Stable)', color: 'text-sky-400' },
  3: { label: '📈 กำลังพุ่ง (Raising)', color: 'text-emerald-400 font-bold' },
  4: { label: '🔄 สวิงขึ้นลง (Fluctuating)', color: 'text-purple-400' },
};
