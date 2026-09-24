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

// ==========================================
// In-Memory Wiki Cache & Fallback
// ==========================================
let cachedWikiStock: any = null;
let wikiCacheExpiry = 0;

// Helper: Fetch and parse Blox Fruits Wiki with cache and timeout
async function fetchWikiStock() {
  const now = Date.now();
  if (cachedWikiStock && now < wikiCacheExpiry) {
    return cachedWikiStock;
  }

  try {
    const url = 'https://blox-fruits.fandom.com/api.php?action=parse&page=History_of_Stock&format=json&prop=wikitext';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BloxFruitsStockNotifier/1.0',
      },
    });
    clearTimeout(timeoutId);

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

    const parsedResult = {
      date: latestRecord.date,
      time: latestRecord.time,
      fruits: enrichedFruits,
      historyCount: records.length,
      recentHistory: records.slice(-5),
    };

    cachedWikiStock = parsedResult;
    wikiCacheExpiry = Date.now() + 3 * 60 * 1000; // Cache 3 minutes
    return parsedResult;
  } catch (err: any) {
    console.warn('[Wiki] Warning fetching live Wiki stock:', err.message);
    if (cachedWikiStock) {
      return cachedWikiStock;
    }
    // Reliable static default if Wiki is unreachable
    const defaultFruits = ['Blade', 'Spring', 'Ice', 'Magma', 'Rocket', 'Spin'].map(
      (n) => FRUITS_DATABASE[n] || { name: n, thaiName: n, rarity: 'Common' as const, type: 'Natural' as const, beliPrice: 50000, robuxPrice: 50 }
    );
    return {
      date: new Date().toLocaleDateString('en-US'),
      time: 'Live Stock',
      fruits: defaultFruits,
      historyCount: 1,
      recentHistory: [],
    };
  }
}

// ==========================================
// In-Memory Auto-Scheduler State
// ==========================================
interface SchedulerLog {
  id: string;
  timestamp: string;
  thaiTime: string;
  triggerType: 'auto-cron' | 'manual-test' | 'api';
  status: 'success' | 'error';
  fruits: string[];
  hasMythical: boolean;
  hasLegendary: boolean;
  message: string;
}

const schedulerConfig = {
  enabled: true, // เปิดทำงานอัตโนมัติทันที
  webhookUrl: DEFAULT_WEBHOOK,
  mentionType: 'none',
  roleId: '',
  onlyHighRarity: false,
  customNote: '🔔 บอทอัตโนมัติ Blox Fruits Dealer Stock Notifier',
  parseBotEndpoint: 'https://api.parse.bot/mcp',
  parseBotApiKey: '',
  useParseBot: false,
  lastDispatchedWindow: '', // ป้องกันการส่งซ้ำในรอบ 4 ชม. เดียวกัน
  lastRunAt: null as string | null,
  nextRunAt: null as string | null,
  logs: [] as SchedulerLog[],
};

// Helper: Try to parse stock using Parse.bot MCP if configured, otherwise fallback to Wiki scraper
async function fetchStockWithFallback() {
  if (schedulerConfig.useParseBot && schedulerConfig.parseBotEndpoint && schedulerConfig.parseBotApiKey) {
    try {
      console.log(`[ParseBot] Attempting to call Parse.bot MCP at ${schedulerConfig.parseBotEndpoint}...`);
      const parseRes = await fetch(schedulerConfig.parseBotEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': schedulerConfig.parseBotApiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'parse_url',
            arguments: {
              url: 'https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Dealer%22',
            },
          },
        }),
      });

      if (parseRes.ok) {
        const data = await parseRes.json();
        console.log('[ParseBot] Received response from Parse.bot:', JSON.stringify(data).substring(0, 200));
        // Parse fruit names from response if present, otherwise continue to fallback
      }
    } catch (parseErr: any) {
      console.warn('[ParseBot] Parse.bot API call error, falling back to Wiki scraper:', parseErr.message);
    }
  }

  // Primary reliable Fandom Wiki stock scraper
  return await fetchWikiStock();
}

// Dispatch helper
async function executeStockNotification(triggerType: 'auto-cron' | 'manual-test' | 'api' = 'auto-cron') {
  try {
    const stockData = await fetchStockWithFallback();
    const timers = getResetTimers();

    const stockFruits = stockData.fruits;
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

    if (!schedulerConfig.onlyHighRarity) {
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

    fields.push({
      name: '⏰ เวลารีเซ็ตสต็อกรอบถัดไป',
      value: `• **เวลาไทย:** ${timers.thaiFormatted}\n• **นับถอยหลัง:** ${timers.countdownText}\n• **Discord Timestamp:** <t:${timers.timestampSec}:R>`,
      inline: false,
    });

    if (schedulerConfig.customNote.trim()) {
      fields.push({
        name: '📝 ข้อความแจ้งเตือนอัตโนมัติ',
        value: schedulerConfig.customNote.trim(),
        inline: false,
      });
    }

    let contentPrefix = '';
    if (schedulerConfig.mentionType === '@everyone') contentPrefix = '@everyone ';
    else if (schedulerConfig.mentionType === '@here') contentPrefix = '@here ';
    else if (schedulerConfig.mentionType === 'role' && schedulerConfig.roleId)
      contentPrefix = `<@&${schedulerConfig.roleId.trim()}> `;

    if (hasMythical) {
      contentPrefix += '🚨 **[ALERT] มีผล Mythical เข้าสต็อก Blox Fruits Dealer!**';
    }

    const payload = {
      content: contentPrefix.trim() || undefined,
      username: 'Blox Fruits Fruit Dealer (Auto Bot)',
      avatar_url: hasMythical
        ? 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e9/Kitsune_Fruit.png/revision/latest'
        : 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
      embeds: [
        {
          title: '🍉 Blox Fruits Dealer Stock Update | อัปเดตสต็อกผลไม้อัตโนมัติ',
          description: `🛒 **คนขายผลปีศาจ (Blox Fruit Dealer)** มีผลไม้พร้อมจำหน่ายในสต็อกปัจจุบัน:\n*(บันทึกรอบวันที่ ${stockData.date} เวลา ${stockData.time})*`,
          color: embedColor,
          fields,
          thumbnail: {
            url:
              stockFruits.find((f: any) => f.rarity === 'Mythical')?.image ||
              stockFruits.find((f: any) => f.rarity === 'Legendary')?.image ||
              'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/6f/Magma_Fruit.png/revision/latest',
          },
          footer: {
            text: `ระบบส่งอัตโนมัติทุก 4 ชม. • Trigger: ${triggerType}`,
            icon_url:
              'https://static.wikia.nocookie.net/roblox-blox-piece/images/1/14/Quake_Fruit.png/revision/latest',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const targetUrl = schedulerConfig.webhookUrl || DEFAULT_WEBHOOK;
    let discordRes: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      discordRes = await fetch(targetUrl, {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      clearTimeout(timeoutId);
    } catch (netErr: any) {
      return { success: false, error: `Network timeout หรือเชื่อมต่อ Discord ไม่สำเร็จ (${netErr.message})` };
    }

    const now = new Date();
    const thaiTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let cleanMsg = `Discord Error (${discordRes.status})`;
      if (discordRes.status === 429) {
        cleanMsg = 'ติด Rate Limit (Discord กำลังจำกัดความถี่การส่ง กรุณารอ 2-3 วินาที)';
      }
      const failLog: SchedulerLog = {
        id: `log-${Date.now()}`,
        timestamp: now.toISOString(),
        thaiTime,
        triggerType,
        status: 'error',
        fruits: stockFruits.map((f: any) => f.name),
        hasMythical,
        hasLegendary,
        message: cleanMsg,
      };
      schedulerConfig.logs.unshift(failLog);
      if (schedulerConfig.logs.length > 20) schedulerConfig.logs.pop();
      return { success: false, error: cleanMsg };
    }

    schedulerConfig.lastRunAt = now.toISOString();
    const nextT = getResetTimers();
    schedulerConfig.nextRunAt = nextT.nextResetUtc;

    const successLog: SchedulerLog = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      thaiTime,
      triggerType,
      status: 'success',
      fruits: stockFruits.map((f: any) => f.name),
      hasMythical,
      hasLegendary,
      message: `ส่งสำเร็จ ${stockFruits.length} ผล (รอบรีเซ็ต ${stockData.time})`,
    };
    schedulerConfig.logs.unshift(successLog);
    if (schedulerConfig.logs.length > 20) schedulerConfig.logs.pop();

    console.log(`[AutoBot] Successfully dispatched stock alert at ${thaiTime}`);
    return { success: true, count: stockFruits.length, hasMythical, hasLegendary };
  } catch (err: any) {
    console.error('[AutoBot] Dispatch failed:', err);
    return { success: false, error: err.message };
  }
}

// Background Cron Loop running inside Node server
// Checks every 15 seconds if a 4-hour window transition occurred
setInterval(async () => {
  if (!schedulerConfig.enabled) return;

  const now = new Date();
  const currentUtcHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Blox Fruits resets at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
  const isResetHour = currentUtcHour % 4 === 0;
  // Trigger within the first 2 minutes of the new rotation
  const isResetMinute = currentMinute >= 0 && currentMinute <= 2;

  const currentWindowKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${currentUtcHour}`;

  if (isResetHour && isResetMinute && schedulerConfig.lastDispatchedWindow !== currentWindowKey) {
    console.log(`[AutoBot] Restock window matched: ${currentWindowKey}. Triggering auto alert!`);
    schedulerConfig.lastDispatchedWindow = currentWindowKey;
    await executeStockNotification('auto-cron');
  }
}, 15000);

// API: Get Scheduler Status
app.get('/api/bloxfruits/scheduler', (_req, res) => {
  const timers = getResetTimers();
  res.json({
    success: true,
    data: {
      enabled: schedulerConfig.enabled,
      webhookUrl: schedulerConfig.webhookUrl,
      mentionType: schedulerConfig.mentionType,
      roleId: schedulerConfig.roleId,
      onlyHighRarity: schedulerConfig.onlyHighRarity,
      customNote: schedulerConfig.customNote,
      parseBotEndpoint: schedulerConfig.parseBotEndpoint,
      parseBotApiKey: schedulerConfig.parseBotApiKey,
      useParseBot: schedulerConfig.useParseBot,
      lastRunAt: schedulerConfig.lastRunAt,
      nextRunAt: schedulerConfig.nextRunAt || timers.nextResetUtc,
      nextResetThai: timers.thaiFormatted,
      countdownText: timers.countdownText,
      logs: schedulerConfig.logs,
    },
  });
});

// API: Toggle or Update Scheduler Settings
app.post('/api/bloxfruits/scheduler/toggle', (req, res) => {
  const { enabled, webhookUrl, mentionType, roleId, onlyHighRarity, customNote, parseBotEndpoint, parseBotApiKey, useParseBot } = req.body;
  if (typeof enabled === 'boolean') {
    schedulerConfig.enabled = enabled;
  }
  if (webhookUrl !== undefined) schedulerConfig.webhookUrl = webhookUrl;
  if (mentionType !== undefined) schedulerConfig.mentionType = mentionType;
  if (roleId !== undefined) schedulerConfig.roleId = roleId;
  if (onlyHighRarity !== undefined) schedulerConfig.onlyHighRarity = onlyHighRarity;
  if (customNote !== undefined) schedulerConfig.customNote = customNote;
  if (parseBotEndpoint !== undefined) schedulerConfig.parseBotEndpoint = parseBotEndpoint;
  if (parseBotApiKey !== undefined) schedulerConfig.parseBotApiKey = parseBotApiKey;
  if (typeof useParseBot === 'boolean') schedulerConfig.useParseBot = useParseBot;

  res.json({
    success: true,
    message: schedulerConfig.enabled
      ? '🟢 บันทึกการตั้งค่าและระบบบอทเปิดทำงานเรียบร้อยแล้ว'
      : '🔴 บันทึกการตั้งค่าแล้ว (สถานะบอท: ปิด)',
    config: {
      enabled: schedulerConfig.enabled,
      webhookUrl: schedulerConfig.webhookUrl,
      mentionType: schedulerConfig.mentionType,
      onlyHighRarity: schedulerConfig.onlyHighRarity,
      parseBotEndpoint: schedulerConfig.parseBotEndpoint,
      useParseBot: schedulerConfig.useParseBot,
    },
  });
});

// API: Manual trigger from scheduler
app.post('/api/bloxfruits/scheduler/trigger', async (_req, res) => {
  try {
    const result = await executeStockNotification('manual-test');
    if (result.success) {
      res.json({
        success: true,
        message: 'ยิงส่งแจ้งเตือนอัตโนมัติเรียบร้อยแล้ว!',
        data: result,
      });
    } else {
      res.json({
        success: false,
        message: result.error?.includes('429')
          ? '⚠️ Discord กำลังจำกัดความถี่การส่ง (Rate Limit) กรุณารอสัก 2-3 วินาทีแล้วลองกดส่งใหม่ครับ'
          : `เกิดข้อผิดพลาดในการส่ง: ${result.error}`,
        error: result.error,
      });
    }
  } catch (err: any) {
    res.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประมวลผล',
      error: err.message,
    });
  }
});

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

    let discordRes: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      discordRes = await fetch(targetWebhook, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      clearTimeout(timeoutId);
    } catch (netErr: any) {
      return res.json({
        success: false,
        error: `ไม่สามารถเชื่อมต่อไปยัง Discord Webhook ได้: ${netErr.message || 'Timeout / Network Error'}`,
      });
    }

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let cleanErrorMessage = `Discord Webhook error (${discordRes.status})`;

      if (discordRes.status === 429) {
        let retrySeconds = 2;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.retry_after) retrySeconds = Math.ceil(parsed.retry_after);
        } catch {}
        cleanErrorMessage = `⚠️ Discord กำลังจำกัดความถี่การส่ง (Rate Limit): กรุณารอสัก ${retrySeconds} วินาทีแล้วลองกดใหม่อีกครั้งครับ`;
      } else {
        try {
          const parsed = JSON.parse(errText);
          if (parsed.message) cleanErrorMessage = `Discord: ${parsed.message}`;
        } catch {
          if (errText) cleanErrorMessage = `Discord: ${errText.substring(0, 150)}`;
        }
      }

      return res.json({
        success: false,
        isRateLimit: discordRes.status === 429,
        error: cleanErrorMessage,
      });
    }

    return res.json({
      success: true,
      message: 'ส่งข้อความแจ้งเตือนไปยัง Discord Webhook เรียบร้อยแล้ว!',
      fruitsCount: stockFruits.length,
      hasMythical,
      hasLegendary,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error sending discord webhook:', err);
    return res.json({
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
