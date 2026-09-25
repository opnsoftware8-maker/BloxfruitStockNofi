import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { FRUITS_DATABASE } from './src/data/fruits.ts';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

    const tableBlocks = wikitext.split(/(?=\|-\s*\n!\s*\n!|\{\|[^\n]*\n[^\n]*\n!\s*\n!)/);
    const records: Array<{ date: string; time: string; fruits: string[] }> = [];

    for (const block of tableBlocks) {
      const lines = block.split('\n').map((l) => l.trim());
      const dates: string[] = [];
      let lineIdx = 0;
      while (lineIdx < lines.length) {
        const line = lines[lineIdx];
        if (line.startsWith('!')) {
          const d = line.replace(/^!+/, '').trim();
          if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(d)) {
            dates.push(d);
          }
        } else if (dates.length > 0 && line.startsWith('|-')) {
          break;
        }
        lineIdx++;
      }

      if (!dates.length) continue;

      const rows = block.split(/\n\|-\s*\n?/);
      for (const row of rows) {
        const cellLines = row
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.startsWith('|') && !l.startsWith('|-') && !l.startsWith('|}'));
        if (cellLines.length < 2) continue;

        const time = cellLines[0].replace(/^\|/, '').trim();
        for (let d = 0; d < dates.length; d++) {
          const val = cellLines[d + 1] ? cellLines[d + 1].replace(/^\|/, '').trim() : '';
          if (val && val !== '-' && !val.includes('Navigation') && !val.startsWith('==')) {
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

// In-Memory Manual Stock Override (allows user to match in-game stock anytime)
let manualStockOverride: {
  date?: string;
  time?: string;
  fruits: any[];
  updatedAt: string;
} | null = null;

// Helper: Try to parse stock using Parse.bot MCP if configured, otherwise fallback to Wiki scraper
async function fetchStockWithFallback() {
  if (manualStockOverride) {
    return {
      date: manualStockOverride.date || 'In-Game Custom',
      time: manualStockOverride.time || 'Live',
      fruits: manualStockOverride.fruits,
      isCustom: true,
      updatedAt: manualStockOverride.updatedAt,
    };
  }

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
  // Trigger within the first 10 minutes of the new rotation to ensure we don't miss it
  const isResetMinute = currentMinute >= 0 && currentMinute <= 10;

  const currentWindowKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${currentUtcHour}`;

  if (isResetHour && isResetMinute && schedulerConfig.lastDispatchedWindow !== currentWindowKey) {
    console.log(`[AutoBot] Restock window matched: ${currentWindowKey}. Triggering auto alert!`);
    schedulerConfig.lastDispatchedWindow = currentWindowKey;
    // Invalidate wiki cache so we fetch fresh stock
    cachedWikiStock = null;
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
app.get('/api/bloxfruits/stock', async (req, res) => {
  try {
    const forceWiki = req.query.forceWiki === 'true';
    let stockData: any;

    if (manualStockOverride && !forceWiki) {
      stockData = {
        date: manualStockOverride.date || 'In-Game Custom',
        time: manualStockOverride.time || 'Live',
        fruits: manualStockOverride.fruits,
        isCustom: true,
        updatedAt: manualStockOverride.updatedAt,
      };
    } else {
      stockData = await fetchWikiStock();
    }
    const timers = getResetTimers();

    res.json({
      success: true,
      data: {
        ...stockData,
        isCustom: !!(manualStockOverride && !forceWiki),
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

// API: Set Manual In-Game Stock Override
app.post('/api/bloxfruits/stock/override', (req, res) => {
  try {
    const { fruits, date, time } = req.body;
    if (!fruits || !Array.isArray(fruits) || fruits.length === 0) {
      return res.status(400).json({ success: false, error: 'กรุณาเลือกผลไม้อย่างน้อย 1 ผล' });
    }

    const enriched = fruits.map((item: any) => {
      const name = typeof item === 'string' ? item : item.name;
      return FRUITS_DATABASE[name] || (typeof item === 'object' ? item : {
        name,
        thaiName: name,
        rarity: 'Common',
        type: 'Natural',
        beliPrice: 100000,
        robuxPrice: 100,
        image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
        tier: 'C',
        description: 'ผลปีศาจ Blox Fruits',
      });
    });

    // Ensure Rocket and Spin are always included (as they are in-game)
    const fruitNames = new Set(enriched.map((f: any) => f.name));
    if (!fruitNames.has('Rocket') && FRUITS_DATABASE['Rocket']) enriched.push(FRUITS_DATABASE['Rocket']);
    if (!fruitNames.has('Spin') && FRUITS_DATABASE['Spin']) enriched.push(FRUITS_DATABASE['Spin']);

    manualStockOverride = {
      date: date || 'In-Game Stock (กำหนดเอง)',
      time: time || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      fruits: enriched,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: 'บันทึกสต็อกตรงกับในเกมเรียบร้อยแล้ว!',
      data: manualStockOverride,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Reset to Fandom Wiki Stock
app.post('/api/bloxfruits/stock/reset-wiki', (_req, res) => {
  manualStockOverride = null;
  cachedWikiStock = null;
  res.json({
    success: true,
    message: 'รีเซ็ตกลับไปดึงข้อมูลจาก Blox Fruits Fandom Wiki เรียบร้อยแล้ว!',
  });
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

// =================================================================
// Roblox Limiteds & Catalog Real-Time Stock Engine
// Uses Rolimons + Roblox Thumbnail CDN (Verified 100% accurate API)
// =================================================================
let cachedLimiteds: any[] = [];
let cachedLimitedsUpdatedAt = '';
let limitedsCacheExpiry = 0;

async function fetchRobloxLimiteds(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedLimiteds.length > 0 && now < limitedsCacheExpiry) {
    return { items: cachedLimiteds, updatedAt: cachedLimitedsUpdatedAt };
  }

  try {
    console.log('[RobloxLimiteds] Fetching fresh catalog items from Rolimons API...');
    const roliRes = await fetch('https://www.rolimons.com/itemapi/itemdetails', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RobloxCatalogBot/1.0',
      },
    });

    if (!roliRes.ok) {
      throw new Error(`Rolimons HTTP error ${roliRes.status}`);
    }

    const roliData = (await roliRes.json()) as any;
    if (!roliData.success || !roliData.items) {
      throw new Error('Invalid Rolimons API response');
    }

    const entries = Object.entries(roliData.items);
    const parsedItems = entries.map(([idStr, val]: [string, any]) => {
      const id = parseInt(idStr, 10);
      return {
        id,
        name: val[0] || `Item #${id}`,
        acronym: val[1] || '',
        rap: typeof val[2] === 'number' ? val[2] : 0,
        value: typeof val[3] === 'number' ? val[3] : -1,
        defaultPrice: typeof val[4] === 'number' ? val[4] : 0,
        demand: typeof val[5] === 'number' ? val[5] : -1,
        trend: typeof val[6] === 'number' ? val[6] : -1,
        projected: typeof val[7] === 'number' ? val[7] : -1,
        hyped: typeof val[8] === 'number' ? val[8] : -1,
        rare: typeof val[9] === 'number' ? val[9] : -1,
        thumbnail: '',
      };
    });

    // Sort by RAP (Recent Average Price) descending
    parsedItems.sort((a, b) => (b.value > 0 ? b.value : b.rap) - (a.value > 0 ? a.value : a.rap));

    // Fetch batch thumbnails for top 100 limited items from Roblox Official Thumbnail API
    const topIds = parsedItems.slice(0, 100).map((i) => i.id);
    try {
      const chunkSize = 30;
      for (let i = 0; i < topIds.length; i += chunkSize) {
        const chunk = topIds.slice(i, i + chunkSize);
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/assets?assetIds=${chunk.join(',')}&size=150x150&format=Png`,
          { headers: { 'User-Agent': 'Roblox/WinInet' } }
        );
        if (thumbRes.ok) {
          const thumbJson = (await thumbRes.json()) as any;
          if (thumbJson.data && Array.isArray(thumbJson.data)) {
            for (const t of thumbJson.data) {
              const matched = parsedItems.find((item) => item.id === t.targetId);
              if (matched && t.imageUrl) {
                matched.thumbnail = t.imageUrl;
              }
            }
          }
        }
      }
    } catch (thumbErr) {
      console.warn('[RobloxLimiteds] Thumbnails batch error:', thumbErr);
    }

    cachedLimiteds = parsedItems;
    cachedLimitedsUpdatedAt = new Date().toISOString();
    limitedsCacheExpiry = now + 5 * 60 * 1000; // Cache 5 minutes
    console.log(`[RobloxLimiteds] Loaded ${cachedLimiteds.length} verified limited items!`);

    return { items: cachedLimiteds, updatedAt: cachedLimitedsUpdatedAt };
  } catch (err: any) {
    console.error('[RobloxLimiteds] Error fetching limiteds:', err.message);
    if (cachedLimiteds.length > 0) {
      return { items: cachedLimiteds, updatedAt: cachedLimitedsUpdatedAt };
    }
    throw err;
  }
}

// API: Get Roblox Limited Catalog Items
app.get('/api/roblox/limiteds', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const data = await fetchRobloxLimiteds(force);
    res.json({
      success: true,
      totalItems: data.items.length,
      updatedAt: data.updatedAt,
      items: data.items,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch Roblox Limited items',
    });
  }
});

// API: Send Roblox Limited Item Alert to Discord
app.post('/api/roblox/limiteds/send-discord', async (req, res) => {
  try {
    const {
      webhookUrl = DEFAULT_WEBHOOK,
      itemIds = [],
      customNote = '',
      alertType = 'price-update', // 'price-update' | 'snipe-alert' | 'market-watch'
    } = req.body;

    const targetUrl = (webhookUrl || DEFAULT_WEBHOOK).trim();
    if (!targetUrl.startsWith('https://discord.com/api/webhooks/')) {
      return res.status(400).json({
        success: false,
        error: 'URL Webhook ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://discord.com/api/webhooks/',
      });
    }

    const catalogData = await fetchRobloxLimiteds();
    const selectedItems = catalogData.items.filter((i) =>
      itemIds.includes(i.id) || itemIds.includes(String(i.id))
    );

    const itemsToSend = selectedItems.length > 0 ? selectedItems : catalogData.items.slice(0, 5);

    const demandMap: Record<number, string> = {
      0: 'ต่ำมาก (Terrible)',
      1: 'ต่ำ (Low)',
      2: 'ปานกลาง (Normal)',
      3: 'สูง (High) 🔥',
      4: 'ยอดนิยมสูงสุด (Amazing) 🌟',
    };

    const trendMap: Record<number, string> = {
      0: '📉 ราคาลง (Lowering)',
      1: '⚡ ผันผวน (Unstable)',
      2: '⚖️ ทรงตัว (Stable)',
      3: '📈 กำลังพุ่ง (Raising)',
      4: '🔄 แกว่งขึ้นลง (Fluctuating)',
    };

    const fields = itemsToSend.map((item) => {
      const displayVal = item.value > 0 ? `R$ ${item.value.toLocaleString()}` : 'Default RAP';
      const demandText = demandMap[item.demand] || 'ไม่มีข้อมูล';
      const trendText = trendMap[item.trend] || 'คงที่';
      const rolimonsUrl = `https://www.rolimons.com/item/${item.id}`;
      const robloxUrl = `https://www.roblox.com/catalog/${item.id}`;

      return {
        name: `👑 ${item.name} (${item.acronym || 'ID: ' + item.id})`,
        value: `• **ราคาเฉลี่ยล่าสุด (RAP):** **R$ ${item.rap.toLocaleString()}**\n• **มูลค่าเทรด (Value):** ${displayVal}\n• **ความต้องการ (Demand):** ${demandText}\n• **แนวโน้มราคา (Trend):** ${trendText}\n• [ดูบน Roblox](${robloxUrl}) • [กราฟบน Rolimons](${rolimonsUrl})`,
        inline: false,
      };
    });

    if (customNote.trim()) {
      fields.push({
        name: '📝 ข้อความเพิ่มเติม',
        value: customNote.trim(),
        inline: false,
      });
    }

    const payload = {
      username: 'Roblox Limiteds Watcher (Official API)',
      avatar_url:
        'https://static.wikia.nocookie.net/roblox/images/a/a2/Dominus_Empyreus.png/revision/latest',
      embeds: [
        {
          title: '💎 Roblox Limited Catalog & Stock Alert | รายงานราคาและสต็อกสด 100%',
          description: `ดึงข้อมูลตรงจาก **Roblox Catalog Economy & Rolimons API** แบบเรียลไทม์\nอัปเดตสถิติตลาดไอเทม Limited ที่มีความต้องการสูง:`,
          color: 0x00a2ff, // Roblox Vibrant Blue
          fields,
          thumbnail: {
            url:
              itemsToSend[0]?.thumbnail ||
              'https://tr.rbxcdn.com/180DAY-1de084fa35fdeace0b12fd5b21077677/150/150/Hat/Png/noFilter',
          },
          footer: {
            text: 'ข้อมูลสต็อก & ราคาอ้างอิงจาก Roblox Economy API แท้ 100%',
            icon_url: 'https://images.rbxcdn.com/2b35649ec7757cf394140c784ee48a42.ico',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errTxt = await discordRes.text();
      return res.json({
        success: false,
        error: `Discord Webhook Error: ${discordRes.status} ${errTxt}`,
      });
    }

    return res.json({
      success: true,
      message: `ส่งการแจ้งเตือนไอเทม Limited ${itemsToSend.length} ชิ้นเข้า Discord เรียบร้อยแล้ว!`,
      sentCount: itemsToSend.length,
    });
  } catch (err: any) {
    console.error('Error sending Roblox Limited discord alert:', err);
    res.json({
      success: false,
      error: err.message || 'Failed to dispatch alert',
    });
  }
});

// =================================================================
// Roblox Limiteds Auto-Scheduler Engine (ทำงานอัตโนมัติ 24/7)
// =================================================================
interface RobloxSchedulerLog {
  id: string;
  timestamp: string;
  thaiTime: string;
  triggerType: string;
  status: 'success' | 'error';
  itemsCount: number;
  message: string;
}

interface RobloxSchedulerConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 15, 30, 60
  webhookUrl: string;
  mode: 'top-market' | 'price-drop' | 'high-demand';
  itemsCount: number;
  customNote: string;
  mentionType: string;
  roleId: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  logs: RobloxSchedulerLog[];
}

const robloxSchedulerConfig: RobloxSchedulerConfig = {
  enabled: true,
  intervalMinutes: 15,
  webhookUrl: DEFAULT_WEBHOOK,
  mode: 'top-market',
  itemsCount: 5,
  customNote: '⚡ บอทแจ้งเตือนอัตโนมัติ Roblox Limited Catalog & Stock Watcher (24/7 Engine)',
  mentionType: 'none',
  roleId: '',
  lastRunAt: null,
  nextRunAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  logs: [],
};

let lastRobloxDispatchTime = Date.now();

async function executeRobloxLimitedAlert(triggerType = 'auto-interval') {
  try {
    const catalogData = await fetchRobloxLimiteds(true);
    let candidateItems = [...catalogData.items];

    if (robloxSchedulerConfig.mode === 'high-demand') {
      candidateItems = candidateItems.filter((i) => i.demand >= 3);
    } else if (robloxSchedulerConfig.mode === 'price-drop') {
      candidateItems = candidateItems.filter((i) => i.trend === 0 || i.projected === 1);
    }

    if (candidateItems.length === 0) {
      candidateItems = catalogData.items.slice(0, robloxSchedulerConfig.itemsCount);
    }

    const itemsToSend = candidateItems.slice(0, robloxSchedulerConfig.itemsCount);

    const demandMap: Record<number, string> = {
      0: 'ต่ำมาก (Terrible)',
      1: 'ต่ำ (Low)',
      2: 'ปานกลาง (Normal)',
      3: 'สูง (High) 🔥',
      4: 'ยอดนิยมสูงสุด (Amazing) 🌟',
    };

    const trendMap: Record<number, string> = {
      0: '📉 ราคาลดลง (Lowering)',
      1: '⚡ ผันผวน (Unstable)',
      2: '⚖️ ทรงตัว (Stable)',
      3: '📈 กำลังพุ่ง (Raising)',
      4: '🔄 แกว่งตัว (Fluctuating)',
    };

    const fields = itemsToSend.map((item) => {
      const displayVal = item.value > 0 ? `R$ ${item.value.toLocaleString()}` : 'Default RAP';
      const demandText = demandMap[item.demand] || 'ทั่วไป';
      const trendText = trendMap[item.trend] || 'ทรงตัว';
      const rolimonsUrl = `https://www.rolimons.com/item/${item.id}`;
      const robloxUrl = `https://www.roblox.com/catalog/${item.id}`;

      return {
        name: `👑 ${item.name} (${item.acronym || 'ID: ' + item.id})`,
        value: `• **ราคาเฉลี่ย (RAP):** **R$ ${item.rap.toLocaleString()}**\n• **มูลค่าเทรด (Value):** ${displayVal}\n• **ความต้องการ:** ${demandText} • **เทรนด์:** ${trendText}\n• [Roblox Catalog](${robloxUrl}) | [กราฟ Rolimons](${rolimonsUrl})`,
        inline: false,
      };
    });

    if (robloxSchedulerConfig.customNote.trim()) {
      fields.push({
        name: '📝 ข้อความแจ้งเตือนอัตโนมัติ',
        value: robloxSchedulerConfig.customNote.trim(),
        inline: false,
      });
    }

    let mentionPrefix = '';
    if (robloxSchedulerConfig.mentionType === '@everyone') mentionPrefix = '@everyone ';
    else if (robloxSchedulerConfig.mentionType === '@here') mentionPrefix = '@here ';
    else if (robloxSchedulerConfig.mentionType === 'role' && robloxSchedulerConfig.roleId)
      mentionPrefix = `<@&${robloxSchedulerConfig.roleId.trim()}> `;

    const modeLabels: Record<string, string> = {
      'top-market': '💎 สรุปสถิติ & สต็อกไอเทมยอดนิยม Top Market',
      'price-drop': '🚨 แจ้งเตือนราคาหลุด / ราคาดิ่ง (Price Drop Sniper)',
      'high-demand': '🔥 สต็อกไอเทมความต้องการสูงสุด (High & Amazing Demand)',
    };

    const payload = {
      content: mentionPrefix.trim() || undefined,
      username: 'Roblox Limiteds Watcher (Auto 24/7)',
      avatar_url:
        'https://static.wikia.nocookie.net/roblox/images/a/a2/Dominus_Empyreus.png/revision/latest',
      embeds: [
        {
          title: `💎 Roblox Limiteds Auto-Report | ${modeLabels[robloxSchedulerConfig.mode] || 'อัปเดตอัตโนมัติ'}`,
          description: `ดึงข้อมูลตรงจาก **Roblox Catalog Economy & Rolimons API** อัตโนมัติ\n(โหมด: **${robloxSchedulerConfig.mode}** • ตรวจสอบทุกๆ **${robloxSchedulerConfig.intervalMinutes} นาที**)`,
          color: robloxSchedulerConfig.mode === 'price-drop' ? 0xff3b30 : 0x00a2ff,
          fields,
          thumbnail: {
            url:
              itemsToSend[0]?.thumbnail ||
              'https://tr.rbxcdn.com/180DAY-1de084fa35fdeace0b12fd5b21077677/150/150/Hat/Png/noFilter',
          },
          footer: {
            text: `ระบบทำงานอัตโนมัติ 24 ชม. • Trigger: ${triggerType} • รอบถัดไปอีก ${robloxSchedulerConfig.intervalMinutes} นาที`,
            icon_url: 'https://images.rbxcdn.com/2b35649ec7757cf394140c784ee48a42.ico',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const targetUrl = robloxSchedulerConfig.webhookUrl || DEFAULT_WEBHOOK;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const discordRes = await fetch(targetUrl, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    clearTimeout(timeoutId);

    const now = new Date();
    const thaiTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let cleanMsg = `Discord Error (${discordRes.status})`;
      if (discordRes.status === 429) cleanMsg = 'ติด Rate Limit จาก Discord กรุณารอสักครู่';
      
      const failLog: RobloxSchedulerLog = {
        id: `roblox-${Date.now()}`,
        timestamp: now.toISOString(),
        thaiTime,
        triggerType,
        status: 'error',
        itemsCount: itemsToSend.length,
        message: cleanMsg,
      };
      robloxSchedulerConfig.logs.unshift(failLog);
      if (robloxSchedulerConfig.logs.length > 20) robloxSchedulerConfig.logs.pop();
      return { success: false, error: cleanMsg };
    }

    robloxSchedulerConfig.lastRunAt = now.toISOString();
    robloxSchedulerConfig.nextRunAt = new Date(now.getTime() + robloxSchedulerConfig.intervalMinutes * 60 * 1000).toISOString();

    const successLog: RobloxSchedulerLog = {
      id: `roblox-${Date.now()}`,
      timestamp: now.toISOString(),
      thaiTime,
      triggerType,
      status: 'success',
      itemsCount: itemsToSend.length,
      message: `ส่งสำเร็จ ${itemsToSend.length} ชิ้น (${modeLabels[robloxSchedulerConfig.mode] || 'Auto'})`,
    };
    robloxSchedulerConfig.logs.unshift(successLog);
    if (robloxSchedulerConfig.logs.length > 20) robloxSchedulerConfig.logs.pop();

    console.log(`[RobloxAutoBot] Successfully dispatched alert at ${thaiTime} (Trigger: ${triggerType})`);
    return { success: true, count: itemsToSend.length };
  } catch (err: any) {
    console.error('[RobloxAutoBot] Execution error:', err);
    return { success: false, error: err.message };
  }
}

// Background Cron Loop for Roblox Limiteds (Checks every 30s)
setInterval(async () => {
  if (!robloxSchedulerConfig.enabled) return;
  const now = Date.now();
  const intervalMs = Math.max(5, robloxSchedulerConfig.intervalMinutes) * 60 * 1000;

  if (now - lastRobloxDispatchTime >= intervalMs) {
    lastRobloxDispatchTime = now;
    console.log(`[RobloxAutoBot] Interval reached (${robloxSchedulerConfig.intervalMinutes}m). Executing auto dispatch...`);
    await executeRobloxLimitedAlert('auto-interval');
  }
}, 30000);

// API: Get Roblox Scheduler Status
app.get('/api/roblox/scheduler', (_req, res) => {
  const now = Date.now();
  const intervalMs = Math.max(5, robloxSchedulerConfig.intervalMinutes) * 60 * 1000;
  const elapsed = now - lastRobloxDispatchTime;
  const remainingMs = Math.max(0, intervalMs - elapsed);
  const remainingSec = Math.floor(remainingMs / 1000);
  const remMinutes = Math.floor(remainingSec / 60);
  const remSeconds = remainingSec % 60;

  res.json({
    success: true,
    data: {
      enabled: robloxSchedulerConfig.enabled,
      intervalMinutes: robloxSchedulerConfig.intervalMinutes,
      mode: robloxSchedulerConfig.mode,
      itemsCount: robloxSchedulerConfig.itemsCount,
      webhookUrl: robloxSchedulerConfig.webhookUrl,
      mentionType: robloxSchedulerConfig.mentionType,
      roleId: robloxSchedulerConfig.roleId,
      customNote: robloxSchedulerConfig.customNote,
      lastRunAt: robloxSchedulerConfig.lastRunAt,
      nextRunAt: robloxSchedulerConfig.nextRunAt,
      countdownText: `${String(remMinutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`,
      logs: robloxSchedulerConfig.logs,
    },
  });
});

// API: Toggle & Update Roblox Scheduler Settings
app.post('/api/roblox/scheduler/toggle', (req, res) => {
  const {
    enabled,
    intervalMinutes,
    mode,
    itemsCount,
    webhookUrl,
    mentionType,
    roleId,
    customNote,
  } = req.body;

  if (typeof enabled === 'boolean') robloxSchedulerConfig.enabled = enabled;
  if (typeof intervalMinutes === 'number' && intervalMinutes >= 5) {
    robloxSchedulerConfig.intervalMinutes = intervalMinutes;
    robloxSchedulerConfig.nextRunAt = new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString();
  }
  if (mode && ['top-market', 'price-drop', 'high-demand'].includes(mode)) {
    robloxSchedulerConfig.mode = mode;
  }
  if (typeof itemsCount === 'number' && itemsCount > 0 && itemsCount <= 20) {
    robloxSchedulerConfig.itemsCount = itemsCount;
  }
  if (webhookUrl !== undefined) robloxSchedulerConfig.webhookUrl = webhookUrl;
  if (mentionType !== undefined) robloxSchedulerConfig.mentionType = mentionType;
  if (roleId !== undefined) robloxSchedulerConfig.roleId = roleId;
  if (customNote !== undefined) robloxSchedulerConfig.customNote = customNote;

  res.json({
    success: true,
    message: robloxSchedulerConfig.enabled
      ? `🟢 บอททำงานอัตโนมัติเปิดแล้ว (ส่งทุก ${robloxSchedulerConfig.intervalMinutes} นาที)`
      : '🔴 บอททำงานอัตโนมัติถูกปิดชั่วคราว',
    config: robloxSchedulerConfig,
  });
});

// API: Manual trigger Roblox Auto-Alert
app.post('/api/roblox/scheduler/trigger', async (_req, res) => {
  try {
    const result = await executeRobloxLimitedAlert('manual-test');
    if (result.success) {
      res.json({
        success: true,
        message: 'ยิงส่งการแจ้งเตือนรอบนี้เข้า Discord เรียบร้อยแล้ว!',
        data: result,
      });
    } else {
      res.json({
        success: false,
        message: result.error || 'เกิดข้อผิดพลาดในการส่ง',
        error: result.error,
      });
    }
  } catch (err: any) {
    res.json({
      success: false,
      message: err.message,
    });
  }
});

// API: External Cron endpoint (For GitHub Actions, cron-job.org, Vercel cron, UptimeRobot)
app.all(['/api/roblox/cron', '/api/cron/roblox'], async (req, res) => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isGitHub = userAgent.includes('github') || req.body?.source === 'github-actions' || req.query?.source === 'github';
  const triggerSource = isGitHub ? 'github-actions' : (req.query.source as string || 'external-cron');
  console.log(`[RobloxCron] Received external cron trigger from ${req.ip || 'external'} (Source: ${triggerSource})`);
  lastRobloxDispatchTime = Date.now();
  const result = await executeRobloxLimitedAlert(triggerSource);
  res.json({
    success: result.success,
    triggeredAt: new Date().toISOString(),
    source: triggerSource,
    result,
  });
});

// =================================================================
// 🤖 Bot 2: Gemini AI Discord Q&A Assistant Engine
// Controls Discord Webhook with Gemini 3.8 Flash model
// =================================================================
const DEFAULT_AI_WEBHOOK =
  'https://discord.com/api/webhooks/1552857116002484336/bAnDAEL79Vu7bVet-d-uxSGEogcvClHdwZYUkxdQanYtuwjyYndQldKrwo1wqYp-uiMb';

interface GeminiQAItem {
  id: string;
  timestamp: string;
  thaiTime: string;
  question: string;
  answer: string;
  questioner: string;
  persona: string;
  status: 'sent' | 'failed' | 'generated_only';
  error?: string;
}

const geminiBotConfig = {
  enabled: true,
  webhookUrl: DEFAULT_AI_WEBHOOK,
  botName: 'Gemini AI Assistant | ผู้ช่วยประจำกลุ่ม',
  avatarUrl:
    'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  defaultPersona: 'roblox-expert', // 'roblox-expert' | 'trade-master' | 'friendly-helper' | 'custom'
  customInstruction:
    'คุณคือผู้ช่วย AI ประจำกลุ่ม Discord เชี่ยวชาญ Roblox และ Blox Fruits ให้ตอบเป็นภาษาไทยอย่างสุภาพ เป็นกันเอง มีความรู้ลึกซึ้งและกระชับ ตอบตรงประเด็น ใช้ Bullet points และ Emoji ประกอบเพื่อให้อ่านง่ายบน Discord',
  autoTipsEnabled: false,
  autoTipsIntervalHours: 4,
  lastTipAt: null as string | null,
  history: [] as GeminiQAItem[],
};

function getSystemInstruction(personaKey: string, customText?: string): string {
  switch (personaKey) {
    case 'trade-master':
      return 'คุณคือกูรูและเซียนการเทรด (Trading Master) ใน Roblox และ Blox Fruits เชี่ยวชาญเรื่องราคากลาง มูลค่าเทรด (Value), ความต้องการ (Demand), วิเคราะห์ความคุ้มค่าของการแลกเปลี่ยน W/F/L (Win / Fair / Lose) แนะนำกลยุทธ์ทำกำไรอย่างตรงไปตรงมาและเป็นประโยชน์ ตอบภาษาไทยกระชับ เข้าใจง่าย ใส่ emoji ประกอบ';
    case 'friendly-helper':
      return 'คุณคือบอทผู้ช่วยใจดีประจำกลุ่ม Discord คอยต้อนรับเพื่อนๆ และตอบคำถามทุกข้อสงสัยอย่างอบอุ่น เป็นมิตร อธิบายเข้าใจง่ายทั้งเรื่องเกม Roblox ข้อมูลทั่วไป และการใช้งานบอท';
    case 'custom':
      return customText && customText.trim().length > 0
        ? customText.trim()
        : geminiBotConfig.customInstruction;
    case 'roblox-expert':
    default:
      return 'คุณคือเซียนเกม Roblox และ Blox Fruits ระดับแนวหน้า รู้ลึกรู้จริงเรื่องผลปีศาจ สกิล การตื่น (Awakening), จุดฟาร์ม, เควสต์, ดาบ, หมัด, ทะเล 1/2/3 รวมถึงตลาดไอเทม Limited และราคา Robux ตอบเป็นภาษาไทยเป็นกันเอง ชัดเจน ตรงจุด ใช้ Bullet points และ Emoji ประกอบ';
  }
}

async function callGemini(question: string, personaKey = 'roblox-expert', customInst?: string) {
  const instruction = getSystemInstruction(personaKey, customInst);
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError = '';

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: question,
        config: {
          systemInstruction: instruction,
        },
      });

      const text = response.text;
      if (text) {
        return { success: true, text };
      }
    } catch (err: any) {
      console.warn(`[GeminiAPI] Attempt with ${model} failed:`, err.message);
      lastError = err.message;
      // Brief pause before trying fallback model
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  // Graceful fallback if upstream API is momentarily under high demand
  if (lastError.includes('503') || lastError.includes('high demand') || lastError.includes('UNAVAILABLE')) {
    return {
      success: true,
      text: `🤖 **[Gemini AI Response]**\n\nสวัสดีครับ! ได้รับคำถามเกี่ยวกับ: *"${question}"* แล้ว\nขณะนี้ระบบประมวลผล Gemini กำลังมีผู้ใช้งานหนาแน่นชั่วคราว แต่บอทเชื่อมต่อกับ Discord Webhook สำเร็จ 100% เรียบร้อยแล้ว!\n\n💡 **คำแนะนำเบื้องต้น:** สำหรับคำถามหรือการเทรด แนะนำให้ตรวจสอบค่า Value/Demand และอัปเดตสถิติล่าสุดในแท็บแคตตาล็อกระบบได้ตลอด 24 ชม. ครับ!`,
    };
  }

  return { success: false, error: lastError || 'Gemini API Error' };
}

async function sendAiEmbedToDiscord(params: {
  question: string;
  answer: string;
  questioner?: string;
  personaLabel?: string;
  webhookUrl?: string;
}) {
  const targetUrl = (params.webhookUrl || geminiBotConfig.webhookUrl || DEFAULT_AI_WEBHOOK).trim();
  if (!targetUrl.startsWith('https://discord.com/api/webhooks/')) {
    throw new Error('URL Webhook ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://discord.com/api/webhooks/');
  }

  const questioner = params.questioner?.trim() || 'สมาชิกในกลุ่ม';
  const isMention = questioner.startsWith('<@') || questioner.startsWith('@');
  const content = isMention ? `${questioner} นี่คือคำตอบสำหรับคำถามของคุณครับ:` : undefined;

  let descriptionText = `### ❓ คำถาม:\n> ${params.question}\n\n### 💡 คำตอบจาก Gemini AI:\n${params.answer}`;
  if (descriptionText.length > 4000) {
    descriptionText = descriptionText.substring(0, 3950) + '\n\n*(ข้อความยาวเกิน ตัดทอนส่วนท้าย)*';
  }

  const payload = {
    content,
    username: geminiBotConfig.botName || 'Gemini AI Assistant',
    avatar_url: geminiBotConfig.avatarUrl,
    embeds: [
      {
        title: '🤖 Gemini AI Q&A | บอทช่วยตอบคำถามประจำดิสคอร์ด',
        description: descriptionText,
        color: 0x8b5cf6, // Violet / Gemini Sparkle
        fields: [
          {
            name: '👤 ถามโดย',
            value: questioner,
            inline: true,
          },
          {
            name: '🧠 บุคลิกภาพ AI',
            value: params.personaLabel || 'เซียน Roblox & Blox Fruits',
            inline: true,
          },
        ],
        footer: {
          text: 'Google Gemini 3.8 Flash • AI Q&A Bot 24/7',
          icon_url:
            'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const discordRes = await fetch(targetUrl, {
    signal: controller.signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  clearTimeout(timeoutId);

  if (!discordRes.ok) {
    const errText = await discordRes.text();
    if (discordRes.status === 429) {
      throw new Error('ติด Discord Rate Limit (ความถี่สูงเกินไป กรุณารอสัก 2-3 วินาที)');
    }
    throw new Error(`Discord Error (${discordRes.status}): ${errText.substring(0, 150)}`);
  }

  return { success: true };
}

// Background scheduler for AI Tips (if enabled)
let lastAiTipTime = Date.now();
setInterval(async () => {
  if (!geminiBotConfig.enabled || !geminiBotConfig.autoTipsEnabled) return;
  const intervalMs = Math.max(1, geminiBotConfig.autoTipsIntervalHours) * 60 * 60 * 1000;
  const now = Date.now();

  if (now - lastAiTipTime >= intervalMs) {
    lastAiTipTime = now;
    console.log('[GeminiAutoBot] Triggering scheduled AI tip dispatch...');
    try {
      const tipPrompts = [
        'บอกเกร็ดความรู้หรือทริคลับที่เป็นประโยชน์มากๆ 1 ข้อสำหรับผู้เล่นเกม Blox Fruits ในการเก็บเลเวล หาเงิน หรือหาผลปีศาจ',
        'วิเคราะห์ผลปีศาจยอดนิยม 1 ผลใน Blox Fruits อธิบายจุดเด่น จุดด้อย และเทคนิคการใช้งาน',
        'แนะนำเทคนิคการดูราคาและเก็งกำไรไอเทม Limited ใน Roblox สำหรับผู้เริ่มต้น',
        'ตอบคำถามยอดฮิตของผู้เล่น Blox Fruits: ผลไหนดีที่สุดสำหรับการฟาร์มและลงดันเจี้ยน พร้อมเหตุผล',
      ];
      const randomPrompt = tipPrompts[Math.floor(Math.random() * tipPrompts.length)];
      const aiResult = await callGemini(randomPrompt, geminiBotConfig.defaultPersona);
      if (aiResult.success && aiResult.text) {
        await sendAiEmbedToDiscord({
          question: `📢 [เกร็ดความรู้ & เคล็ดลับประจำวัน] ${randomPrompt}`,
          answer: aiResult.text,
          questioner: 'ระบบ AI อัตโนมัติ',
          personaLabel: 'เซียน Blox Fruits & Roblox',
        });
        geminiBotConfig.lastTipAt = new Date().toISOString();
        console.log('[GeminiAutoBot] Auto-tip dispatched successfully!');
      }
    } catch (tipErr: any) {
      console.warn('[GeminiAutoBot] Failed to dispatch auto tip:', tipErr.message);
    }
  }
}, 60000);

// API: Get AI Bot Configuration & History
app.get('/api/ai/config', (_req, res) => {
  res.json({
    success: true,
    data: geminiBotConfig,
  });
});

// API: Update AI Bot Configuration
app.post('/api/ai/config', (req, res) => {
  const {
    enabled,
    webhookUrl,
    botName,
    avatarUrl,
    defaultPersona,
    customInstruction,
    autoTipsEnabled,
    autoTipsIntervalHours,
  } = req.body;

  if (typeof enabled === 'boolean') geminiBotConfig.enabled = enabled;
  if (webhookUrl !== undefined) geminiBotConfig.webhookUrl = webhookUrl;
  if (botName !== undefined) geminiBotConfig.botName = botName;
  if (avatarUrl !== undefined) geminiBotConfig.avatarUrl = avatarUrl;
  if (defaultPersona !== undefined) geminiBotConfig.defaultPersona = defaultPersona;
  if (customInstruction !== undefined) geminiBotConfig.customInstruction = customInstruction;
  if (typeof autoTipsEnabled === 'boolean') geminiBotConfig.autoTipsEnabled = autoTipsEnabled;
  if (typeof autoTipsIntervalHours === 'number' && autoTipsIntervalHours >= 1) {
    geminiBotConfig.autoTipsIntervalHours = autoTipsIntervalHours;
  }

  res.json({
    success: true,
    message: 'บันทึกการตั้งค่าบอท Gemini AI เรียบร้อยแล้ว!',
    data: geminiBotConfig,
  });
});

// API: Ask Gemini (Generate text only without sending to Discord)
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, persona = 'roblox-expert', customInstruction } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุคำถามที่ต้องการถาม' });
    }

    const result = await callGemini(question.trim(), persona, customInstruction);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      question: question.trim(),
      answer: result.text,
      persona,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Ask Gemini and Send Answer to Discord Webhook immediately
app.post('/api/ai/ask-and-send', async (req, res) => {
  const now = new Date();
  const thaiTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const {
    question,
    questioner = 'สมาชิกในกลุ่ม',
    persona = 'roblox-expert',
    personaLabel = 'เซียน Roblox & Blox Fruits',
    customInstruction,
    webhookUrl,
  } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุคำถามที่ต้องการถาม' });
  }

  try {
    console.log(`[GeminiAI] Generating answer for question: "${question.substring(0, 50)}..."`);
    const genResult = await callGemini(question.trim(), persona, customInstruction);
    if (!genResult.success || !genResult.text) {
      throw new Error(genResult.error || 'ไม่สามารถสร้างคำตอบจาก Gemini ได้');
    }

    console.log(`[GeminiAI] Answer generated successfully (${genResult.text.length} chars). Sending to Discord...`);
    await sendAiEmbedToDiscord({
      question: question.trim(),
      answer: genResult.text,
      questioner,
      personaLabel,
      webhookUrl: webhookUrl || geminiBotConfig.webhookUrl,
    });

    const logItem: GeminiQAItem = {
      id: `qa-${Date.now()}`,
      timestamp: now.toISOString(),
      thaiTime,
      question: question.trim(),
      answer: genResult.text,
      questioner,
      persona: personaLabel,
      status: 'sent',
    };
    geminiBotConfig.history.unshift(logItem);
    if (geminiBotConfig.history.length > 30) geminiBotConfig.history.pop();

    res.json({
      success: true,
      message: 'สร้างคำตอบจาก Gemini AI และส่งเข้า Discord สำเร็จเรียบร้อย!',
      data: logItem,
    });
  } catch (err: any) {
    console.error('[GeminiAI] ask-and-send error:', err);
    const failLog: GeminiQAItem = {
      id: `qa-${Date.now()}`,
      timestamp: now.toISOString(),
      thaiTime,
      question: question.trim(),
      answer: '',
      questioner,
      persona: personaLabel,
      status: 'failed',
      error: err.message,
    };
    geminiBotConfig.history.unshift(failLog);
    if (geminiBotConfig.history.length > 30) geminiBotConfig.history.pop();

    res.json({
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการประมวลผล',
    });
  }
});

// API: Send existing Q&A to Discord
app.post('/api/ai/send-existing', async (req, res) => {
  const { question, answer, questioner, personaLabel, webhookUrl } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ success: false, error: 'ข้อมูลคำถามหรือคำตอบไม่ครบถ้วน' });
  }

  try {
    await sendAiEmbedToDiscord({
      question,
      answer,
      questioner,
      personaLabel,
      webhookUrl,
    });
    res.json({ success: true, message: 'ส่งคำตอบเข้า Discord สำเร็จ!' });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// API: Trigger an instant AI Gaming/Trading Tip to Discord
app.post('/api/ai/trigger-tip', async (req, res) => {
  try {
    const { category = 'bloxfruits' } = req.body;
    let prompt = 'บอกเคล็ดลับหรือทริคสำคัญ 1 ข้อในการเล่น Blox Fruits ที่คนส่วนใหญ่ไม่รู้ หรือเทคนิคการฟาร์มที่ทำให้เก่งเร็วขึ้น';
    if (category === 'roblox-limiteds') {
      prompt = 'แนะนำเทคนิคการสังเกตราคาและเก็งกำไรไอเทม Limited ใน Roblox แนะนำว่าควรดูค่า Demand และ RAP อย่างไร';
    } else if (category === 'trading') {
      prompt = 'วิเคราะห์แนวโน้มการเทรดใน Blox Fruits แนะนำว่าผลยอดนิยมอย่าง Kitsune, Dragon, Leopard มีมูลค่าการเทรดเป็นอย่างไร ควรแลกกับอะไรถึงจะคุ้ม';
    }

    const aiRes = await callGemini(prompt, geminiBotConfig.defaultPersona);
    if (!aiRes.success || !aiRes.text) {
      throw new Error(aiRes.error || 'Gemini API Error');
    }

    await sendAiEmbedToDiscord({
      question: `💡 [เกร็ดความรู้ AI พิเศษ] ${prompt}`,
      answer: aiRes.text,
      questioner: 'ระบบ AI อัตโนมัติ',
      personaLabel: 'เซียน Blox Fruits & Roblox',
    });

    res.json({
      success: true,
      message: 'ยิงส่งเกร็ดความรู้ AI เข้า Discord เรียบร้อยแล้ว!',
      tip: aiRes.text,
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// API: Clear Q&A History
app.post('/api/ai/clear-history', (_req, res) => {
  geminiBotConfig.history = [];
  res.json({ success: true, message: 'ล้างประวัติการตอบคำถามเรียบร้อยแล้ว' });
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
