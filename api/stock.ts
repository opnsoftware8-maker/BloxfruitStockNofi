import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const now = new Date();
  const currentUtcHour = now.getUTCHours();
  const nextUtcHour = (Math.floor(currentUtcHour / 4) + 1) * 4;

  const nextResetDate = new Date(now);
  nextResetDate.setUTCHours(nextUtcHour, 0, 0, 0);

  const diffMs = nextResetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const thaiNextHour = (nextResetDate.getUTCHours() + 7) % 24;

  // Simple default stock response for Vercel
  const defaultFruits = [
    { name: 'Rocket', thaiName: 'จรวด', rarity: 'Common', type: 'Natural', beliPrice: 5000, robuxPrice: 50, tier: 'D' },
    { name: 'Spin', thaiName: 'คอปเตอร์', rarity: 'Common', type: 'Natural', beliPrice: 7500, robuxPrice: 75, tier: 'D' },
    { name: 'Blade', thaiName: 'แยกส่วน (Chop)', rarity: 'Common', type: 'Natural', beliPrice: 30000, robuxPrice: 100, tier: 'C' },
    { name: 'Spring', thaiName: 'สปริง', rarity: 'Common', type: 'Natural', beliPrice: 60000, robuxPrice: 180, tier: 'C' },
    { name: 'Ice', thaiName: 'น้ำแข็ง', rarity: 'Uncommon', type: 'Elemental', beliPrice: 350000, robuxPrice: 750, tier: 'A' },
    { name: 'Magma', thaiName: 'แม็กม่า', rarity: 'Rare', type: 'Elemental', beliPrice: 850000, robuxPrice: 1300, tier: 'S' },
  ];

  return res.status(200).json({
    success: true,
    data: {
      date: 'Live Rotation',
      time: 'Live',
      fruits: defaultFruits,
      resetTimers: {
        nextResetUtc: nextResetDate.toISOString(),
        diffMs,
        diffHours,
        diffMinutes,
        diffSeconds: 0,
        thaiNextHour,
        thaiFormatted: `${String(thaiNextHour).padStart(2, '0')}:00 น.`,
        countdownText: `${diffHours} ชม. ${diffMinutes} นาที`,
        timestampSec: Math.floor(nextResetDate.getTime() / 1000),
      },
    },
  });
}
