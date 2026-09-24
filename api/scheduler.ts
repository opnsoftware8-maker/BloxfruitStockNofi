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

  return res.status(200).json({
    success: true,
    data: {
      enabled: true,
      webhookUrl: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ',
      mentionType: 'none',
      roleId: '',
      onlyHighRarity: false,
      customNote: '🔔 บอทอัตโนมัติ Blox Fruits Dealer Stock Notifier',
      lastRunAt: null,
      nextRunAt: nextResetDate.toISOString(),
      nextResetThai: `${String(thaiNextHour).padStart(2, '0')}:00 น.`,
      countdownText: `${diffHours} ชม. ${diffMinutes} นาที`,
      logs: [],
    },
  });
}
