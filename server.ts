import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { FRUITS_DATABASE } from './src/data/fruits.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

const DEFAULT_WEBHOOK =
  'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ';

// Helper: Calculate next stock reset
function getResetTimers() {
  const now = new Date();
  const currentUtcHour = now.getUTCHours();
  const nextUtcHour = (Math.floor(currentUtcHour / 4) + 1) * 4;

  const nextResetDate = new Date(now);
  nextResetDate.setUTCHours(nextUtcHour, 0, 0, 0);

  const diffMs = Math.max(0, nextResetDate.getTime() - now.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const thaiNextHour = (nextResetDate.getUTCHours() + 7) % 24;
  const thaiFormatted = `${String(thaiNextHour).padStart(2, '0')}:00 น.`;

  return {
    nextResetUtc: nextResetDate.toISOString(),
    thaiFormatted,
    countdownSec: Math.floor(diffMs / 1000),
    countdownText: `${diffHours} ชม. ${diffMinutes} นาที ${diffSeconds} วิ`,
    timestampSec: Math.floor(nextResetDate.getTime() / 1000),
  };
}

// Helper: Fetch and parse Blox Fruits Wiki
async function fetchWikiStock() {
  const url = 'https://blox-fruits.fandom.com/api.php?action=parse&page=History_of_Stock&format=json&prop=wikitext';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BloxFruitsStockNotifier/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Wiki API responded with status ${response.status}`);
  }

  const data = (await response.json()) as any;
  const wikitext: string = data?.parse?.wikitext?.['*'] || '';

  const chunks = wikitext.split(/\n(?=!+\d+\/\d+\/\d+)/);
  const records: Array<{ date: string; time: string; fruits: string[] }> = [];

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim());
    const dates: string[] = [];
    let idx = 0;
    while (idx < lines.length && lines[idx].startsWith('!')) {
      const d = lines[idx].replace(/^!+/, '').trim();
      if (d) dates.push(d);
      idx++;
    }
    if (!dates.length) continue;

    const rowBlocks = chunk.split(/\n\|-\n?/);
    for (const rBlock of rowBlocks) {
      const cellLines = rBlock
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('|') && !l.startsWith('|-') && !l.startsWith('|}'));
      if (cellLines.length < 2) continue;

      const time = cellLines[0].substring(1).trim();
      for (let d = 0; d < dates.length; d++) {
        const val = cellLines[d + 1] ? cellLines[d + 1].substring(1).trim() : '';
        if (val && val !== '-' && !val.includes('Navigation') && !val.includes('{{')) {
          const rawFruits = val
            .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
            .replace(/'{2,}/g, '')
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean);

          if (rawFruits.length > 0) {
            records.push({ date: dates[d], time, fruits: rawFruits });
          }
        }
      }
    }
  }

  let latestRecord = records[records.length - 1];
  if (!latestRecord) {
    latestRecord = {
      date: 'Current Rotation',
      time: '12:00 AM',
      fruits: ['Magma', 'Quake', 'Spider'],
    };
  }

  // Ensure permanent stock fruits (Rocket, Spin) are included
  const enrichedFruitNames = Array.from(new Set([...latestRecord.fruits, 'Rocket', 'Spin']));
  const enrichedFruits = enrichedFruitNames.map((name) => {
    const matched = FRUITS_DATABASE[name] || {
      name,
      thaiName: name,
      rarity: 'Common' as const,
      type: 'Natural' as const,
      beliPrice: 100000,
      robuxPrice: 100,
      image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
      tier: 'C' as const,
      description: 'ผลปีศาจในเกม Blox Fruits',
    };
    return matched;
  });

  return {
    date: latestRecord.date,
    time: latestRecord.time,
    fruits: enrichedFruits,
    historyCount: records.length,
    recentHistory: records.slice(-5),
  };
}

// API: Get Stock
app.get('/api/bloxfruits/stock', async (_req, res) => {
  try {
    const stockData = await fetchWikiStock();
    const timers = getResetTimers();

    res.json({
      success: true,
      data: {
        ...stockData,
        resetTimers: timers,
      },
    });
  } catch (err: any) {
    console.error('Error fetching stock:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch stock from Wiki',
    });
  }
});

// API: Send Discord Webhook
app.post('/api/bloxfruits/send-discord', async (req, res) => {
  try {
    const {
      webhookUrl = DEFAULT_WEBHOOK,
      mentionType = 'none', // 'none' | '@everyone' | '@here' | 'role'
      roleId = '',
      onlyHighRarity = false,
      customNote = '',
      fruitsList = [],
    } = req.body;

    const targetWebhook = (webhookUrl || DEFAULT_WEBHOOK).trim();

    if (!targetWebhook.startsWith('https://discord.com/api/webhooks/')) {
      return res.status(400).json({
        success: false,
        error: 'URL Webhook ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://discord.com/api/webhooks/',
      });
    }

    // Get current stock if not supplied
    let stockFruits = fruitsList;
    let rotationDate = 'Current';
    let rotationTime = 'Live';

    if (!stockFruits || stockFruits.length === 0) {
      const live = await fetchWikiStock();
      stockFruits = live.fruits;
      rotationDate = live.date;
      rotationTime = live.time;
    }

    const timers = getResetTimers();

    // Grouping by rarity
    const grouped: Record<string, any[]> = {
      Mythical: [],
      Legendary: [],
      Rare: [],
      Uncommon: [],
      Common: [],
    };

    let hasMythical = false;
    let hasLegendary = false;

    for (const f of stockFruits) {
      const r = f.rarity || 'Common';
      if (r === 'Mythical') hasMythical = true;
      if (r === 'Legendary') hasLegendary = true;
      if (grouped[r]) grouped[r].push(f);
    }

    // If filtered to high rarity only and none exists, we can still report or filter
    let embedColor = 0x3498db; // Rare (Blue)
    if (hasMythical) embedColor = 0xe74c3c; // Red
    else if (hasLegendary) embedColor = 0x9b59b6; // Purple

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    const formatFruitLine = (f: any) => {
      const priceStr = f.beliPrice
        ? ` — 💰 $${Number(f.beliPrice).toLocaleString()} | 💎 R$ ${f.robuxPrice}`
        : '';
      const awakenBadge = f.awakening ? ' ⚡*(มีร่างตื่น)*' : '';
      return `• **${f.name}** (${f.thaiName})${priceStr}${awakenBadge}`;
    };

    if (grouped.Mythical.length > 0) {
      fields.push({
        name: '🔥 ระดับ Mythical (ผลมายา/เทพ)',
        value: grouped.Mythical.map(formatFruitLine).join('\n'),
        inline: false,
      });
    }

    if (grouped.Legendary.length > 0) {
      fields.push({
        name: '✨ ระดับ Legendary (ผลตำนาน)',
        value: grouped.Legendary.map(formatFruitLine).join('\n'),
        inline: false,
      });
    }

    if (!onlyHighRarity) {
      if (grouped.Rare.length > 0) {
        fields.push({
          name: '💎 ระดับ Rare (ผลหายาก)',
          value: grouped.Rare.map(formatFruitLine).join('\n'),
          inline: false,
        });
      }

      if (grouped.Uncommon.length > 0) {
        fields.push({
          name: '🌿 ระดับ Uncommon (ผลคัดพิเศษ)',
          value: grouped.Uncommon.map(formatFruitLine).join('\n'),
          inline: false,
        });
      }

      if (grouped.Common.length > 0) {
        fields.push({
          name: '📦 ระดับ Common (ผลทั่วไป / ขายประจำ)',
          value: grouped.Common.map(formatFruitLine).join('\n'),
          inline: false,
        });
      }
    }

    // Next reset field
    fields.push({
      name: '⏰ เวลารีเซ็ตสต็อกรอบถัดไป',
      value: `• **เวลาไทย:** ${timers.thaiFormatted}\n• **นับถอยหลัง:** ${timers.countdownText}\n• **Discord Timestamp:** <t:${timers.timestampSec}:R>`,
      inline: false,
    });

    if (customNote.trim()) {
      fields.push({
        name: '📝 ข้อความเพิ่มเติม',
        value: customNote.trim(),
        inline: false,
      });
    }

    // Mention text
    let contentPrefix = '';
    if (mentionType === '@everyone') contentPrefix = '@everyone ';
    else if (mentionType === '@here') contentPrefix = '@here ';
    else if (mentionType === 'role' && roleId) contentPrefix = `<@&${roleId.trim()}> `;

    if (hasMythical) {
      contentPrefix += '🚨 **[ALERT] มีผล Mythical เข้าสต็อก Blox Fruits Dealer!**';
    }

    const payload = {
      content: contentPrefix.trim() || undefined,
      username: 'Blox Fruits Fruit Dealer',
      avatar_url:
        hasMythical
          ? 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e9/Kitsune_Fruit.png/revision/latest'
          : 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
      embeds: [
        {
          title: '🍉 Blox Fruits Dealer Stock Update | อัปเดตสต็อกผลไม้',
          description: `🛒 **คนขายผลปีศาจ (Blox Fruit Dealer)** มีผลไม้พร้อมจำหน่ายในสต็อกปัจจุบัน:\n*(บันทึกรอบวันที่ ${rotationDate} เวลา ${rotationTime})*`,
          color: embedColor,
          fields,
          thumbnail: {
            url:
              stockFruits.find((f: any) => f.rarity === 'Mythical')?.image ||
              stockFruits.find((f: any) => f.rarity === 'Legendary')?.image ||
              'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/6f/Magma_Fruit.png/revision/latest',
          },
          footer: {
            text: 'Blox Fruits Stock Notifier • Vercel Cron Integration',
            icon_url:
              'https://static.wikia.nocookie.net/roblox-blox-piece/images/1/14/Quake_Fruit.png/revision/latest',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordRes = await fetch(targetWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return res.status(discordRes.status).json({
        success: false,
        error: `Discord Webhook error (${discordRes.status}): ${errText}`,
      });
    }

    res.json({
      success: true,
      message: 'ส่งข้อความแจ้งเตือนไปยัง Discord Webhook เรียบร้อยแล้ว!',
      fruitsCount: stockFruits.length,
      hasMythical,
      hasLegendary,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error sending discord webhook:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send Discord webhook',
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
