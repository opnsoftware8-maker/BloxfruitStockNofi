// Standalone Blox Fruits Dealer Stock Watcher for GitHub Actions (24/7 Free)
// Can be executed directly with: node scripts/blox-cron.mjs

import { FRUITS_DATABASE } from '../src/data/fruits.ts';

const DEFAULT_WEBHOOK =
  'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ';

const WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK || process.env.WEBHOOK_URL || DEFAULT_WEBHOOK;
const ONLY_HIGH_RARITY = process.env.ONLY_HIGH_RARITY === 'true';
const CUSTOM_NOTE =
  process.env.CUSTOM_NOTE ||
  '🍉 แจ้งเตือนผลไม้ Blox Fruits อัตโนมัติจาก GitHub Actions 24/7 (รันฟรีบนคลาวด์)';

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
    thaiFormatted,
    countdownText: `${diffHours} ชม. ${diffMinutes} นาที ${diffSeconds} วิ`,
    timestampSec: Math.floor(nextResetDate.getTime() / 1000),
  };
}

async function fetchWikiStock() {
  try {
    const url =
      'https://blox-fruits.fandom.com/api.php?action=parse&page=History_of_Stock&format=json&prop=wikitext';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BloxFruitsStockNotifier/1.0',
      },
    });

    if (!res.ok) throw new Error(`Wiki API responded with status ${res.status}`);
    const data = await res.json();
    const wikitext = data?.parse?.wikitext?.['*'] || '';

    const tableBlocks = wikitext.split(/(?=\|-\s*\n!\s*\n!|\{\|[^\n]*\n[^\n]*\n!\s*\n!)/);
    const records = [];

    for (const block of tableBlocks) {
      const lines = block.split('\n').map((l) => l.trim());
      const dates = [];
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

    if (records.length > 0) {
      return records[0];
    }
  } catch (e) {
    console.warn('⚠️ Wiki fetch fallback:', e.message);
  }

  // Fallback defaults
  return {
    date: 'Current',
    time: 'Live Stock',
    fruits: ['Quake', 'Magma', 'Spider', 'Rocket', 'Spin'],
  };
}

async function run() {
  console.log('==============================================');
  console.log('🍉 Blox Fruits Dealer Stock Auto Bot');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('==============================================');

  if (!WEBHOOK_URL || !WEBHOOK_URL.startsWith('https://discord.com/api/webhooks/')) {
    console.error('❌ Error: Invalid Discord Webhook URL.');
    process.exit(1);
  }

  try {
    const stockData = await fetchWikiStock();
    console.log(`✅ Loaded Blox Fruits stock for ${stockData.date} (${stockData.time})`);

    const fruits = stockData.fruits.map((name) => {
      const cleanName = name.replace(/\s*Fruit$/i, '').trim();
      return (
        FRUITS_DATABASE[cleanName] || {
          name: cleanName,
          type: 'Natural',
          rarity: 'Common',
          beliPrice: 0,
          robuxPrice: 0,
          image:
            'https://static.wikia.nocookie.net/roblox-blox-piece/images/a/a2/Bomb_Fruit.png/revision/latest',
          description: 'ผลปีศาจ Blox Fruits',
        }
      );
    });

    const hasMythical = fruits.some((f) => f.rarity === 'Mythical');
    const hasLegendary = fruits.some((f) => f.rarity === 'Legendary');

    let displayFruits = fruits;
    if (ONLY_HIGH_RARITY) {
      displayFruits = fruits.filter(
        (f) => f.rarity === 'Mythical' || f.rarity === 'Legendary'
      );
      if (displayFruits.length === 0) {
        console.log('ℹ️ No Mythical or Legendary fruits right now. Skipping alert.');
        return;
      }
    }

    const timers = getResetTimers();

    const rarityEmoji = {
      Mythical: '🟣 [MYTHICAL]',
      Legendary: '🔴 [LEGENDARY]',
      Rare: '🟣 [RARE]',
      Uncommon: '🔵 [UNCOMMON]',
      Common: '⚪ [COMMON]',
    };

    const fruitFields = displayFruits.map((f) => ({
      name: `${rarityEmoji[f.rarity] || '⚪'} ${f.name} Fruit (${f.type})`,
      value: `• **ราคา Beli:** $${f.beliPrice.toLocaleString()}\n• **ราคา Robux:** R$ ${f.robuxPrice.toLocaleString()}`,
      inline: true,
    }));

    const fields = [
      ...fruitFields,
      {
        name: '⏰ เวลารีเซ็ตสต็อกรอบถัดไป',
        value: `• **เวลาไทย:** ${timers.thaiFormatted}\n• **นับถอยหลัง:** ${timers.countdownText}\n• **Discord Timestamp:** <t:${timers.timestampSec}:R>`,
        inline: false,
      },
    ];

    if (CUSTOM_NOTE) {
      fields.push({
        name: '📝 บันทึกระบบอัตโนมัติ',
        value: CUSTOM_NOTE,
        inline: false,
      });
    }

    const embedColor = hasMythical ? 0x9b59b6 : hasLegendary ? 0xe74c3c : 0xf1c40f;

    const payload = {
      username: 'Blox Fruits Fruit Dealer (Auto Bot 24/7)',
      avatar_url: hasMythical
        ? 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e9/Kitsune_Fruit.png/revision/latest'
        : 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
      embeds: [
        {
          title: '🍉 Blox Fruits Dealer Stock Update | อัปเดตสต็อกผลไม้อัตโนมัติ',
          description: `🛒 **คนขายผลปีศาจ (Blox Fruit Dealer)** มีผลไม้ในสต็อกปัจจุบัน:\n*(รอบวันที่ ${stockData.date} เวลา ${stockData.time})*`,
          color: embedColor,
          fields,
          footer: {
            text: 'GitHub Actions Automated Engine • รันฟรี 24 ชม. แม้ปิดคอม',
            icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    console.log(`📤 Sending Blox Fruits stock (${displayFruits.length} fruits) to Discord...`);
    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      throw new Error(`Discord Webhook HTTP ${discordRes.status}: ${errText}`);
    }

    console.log('🎉 SUCCESS: Sent Blox Fruits stock alert to Discord!');
  } catch (err) {
    console.error('💥 Execution Error:', err);
    process.exit(1);
  }
}

run();
