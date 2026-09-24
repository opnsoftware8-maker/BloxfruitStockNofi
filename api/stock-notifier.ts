import type { VercelRequest, VercelResponse } from '@vercel/node';

// ข้อมูลอ้างอิงผลไม้ (ราคา, เกรด, ภาษาไทย)
const FRUIT_INFO: Record<string, { thaiName: string; rarity: string; beli: string; robux: string; emoji: string }> = {
  Rocket: { thaiName: 'จรวด', rarity: 'Common', beli: '$5,000', robux: 'R$ 50', emoji: '🚀' },
  Spin: { thaiName: 'คอปเตอร์', rarity: 'Common', beli: '$7,500', robux: 'R$ 75', emoji: '🌀' },
  Blade: { thaiName: 'แยกส่วน (Chop)', rarity: 'Common', beli: '$30,000', robux: 'R$ 100', emoji: '🗡️' },
  Spring: { thaiName: 'สปริง', rarity: 'Common', beli: '$60,000', robux: 'R$ 180', emoji: '➰' },
  Bomb: { thaiName: 'ระเบิด', rarity: 'Common', beli: '$80,000', robux: 'R$ 220', emoji: '💣' },
  Smoke: { thaiName: 'ควัน', rarity: 'Common', beli: '$100,000', robux: 'R$ 250', emoji: '💨' },
  Spike: { thaiName: 'หนาม', rarity: 'Uncommon', beli: '$180,000', robux: 'R$ 380', emoji: '🌵' },
  Flame: { thaiName: 'ไฟ', rarity: 'Uncommon', beli: '$250,000', robux: 'R$ 550', emoji: '🔥' },
  Eagle: { thaiName: 'นกอินทรี (Falcon)', rarity: 'Uncommon', beli: '$300,000', robux: 'R$ 650', emoji: '🦅' },
  Ice: { thaiName: 'น้ำแข็ง', rarity: 'Uncommon', beli: '$350,000', robux: 'R$ 750', emoji: '❄️' },
  Sand: { thaiName: 'ทราย', rarity: 'Uncommon', beli: '$420,000', robux: 'R$ 850', emoji: '⏳' },
  Dark: { thaiName: 'มืด', rarity: 'Uncommon', beli: '$500,000', robux: 'R$ 950', emoji: '🌑' },
  Diamond: { thaiName: 'เพชร', rarity: 'Uncommon', beli: '$600,000', robux: 'R$ 1,000', emoji: '💎' },
  Light: { thaiName: 'แสง', rarity: 'Rare', beli: '$650,000', robux: 'R$ 1,100', emoji: '⚡' },
  Rubber: { thaiName: 'ยาง', rarity: 'Rare', beli: '$750,000', robux: 'R$ 1,200', emoji: '👒' },
  Ghost: { thaiName: 'ผี (โกสต์)', rarity: 'Rare', beli: '$940,000', robux: 'R$ 1,275', emoji: '👻' },
  Magma: { thaiName: 'แม็กม่า', rarity: 'Rare', beli: '$850,000', robux: 'R$ 1,300', emoji: '🌋' },
  Quake: { thaiName: 'สั่นสะเทือน', rarity: 'Legendary', beli: '$1,000,000', robux: 'R$ 1,500', emoji: '🌊' },
  Buddha: { thaiName: 'พระ (บุดด้า)', rarity: 'Legendary', beli: '$1,200,000', robux: 'R$ 1,650', emoji: '🧘' },
  Love: { thaiName: 'ความรัก', rarity: 'Legendary', beli: '$1,300,000', robux: 'R$ 1,700', emoji: '💖' },
  Spider: { thaiName: 'ใยแมงมุม', rarity: 'Legendary', beli: '$1,500,000', robux: 'R$ 1,800', emoji: '🕸️' },
  Sound: { thaiName: 'เสียง', rarity: 'Legendary', beli: '$1,700,000', robux: 'R$ 1,900', emoji: '🎵' },
  Phoenix: { thaiName: 'ฟีนิกซ์', rarity: 'Legendary', beli: '$1,800,000', robux: 'R$ 2,000', emoji: '🔥' },
  Portal: { thaiName: 'ประตู', rarity: 'Legendary', beli: '$1,900,000', robux: 'R$ 2,000', emoji: '🚪' },
  Lightning: { thaiName: 'สายฟ้า (Rumble)', rarity: 'Legendary', beli: '$2,100,000', robux: 'R$ 2,100', emoji: '⚡' },
  Pain: { thaiName: 'ความเจ็บปวด (Paw)', rarity: 'Legendary', beli: '$2,300,000', robux: 'R$ 2,200', emoji: '🐾' },
  Blizzard: { thaiName: 'พายุหิมะ', rarity: 'Legendary', beli: '$2,400,000', robux: 'R$ 2,250', emoji: '🌨️' },
  Gravity: { thaiName: 'แรงโน้มถ่วง', rarity: 'Mythical', beli: '$2,500,000', robux: 'R$ 2,300', emoji: '🌌' },
  Mammoth: { thaiName: 'แมมมอธ', rarity: 'Mythical', beli: '$2,700,000', robux: 'R$ 2,350', emoji: '🦣' },
  'T-Rex': { thaiName: 'ทีเร็กซ์', rarity: 'Mythical', beli: '$2,700,000', robux: 'R$ 2,350', emoji: '🦖' },
  Dough: { thaiName: 'โมจิ', rarity: 'Mythical', beli: '$2,800,000', robux: 'R$ 2,400', emoji: '🍩' },
  Shadow: { thaiName: 'เงา', rarity: 'Mythical', beli: '$2,900,000', robux: 'R$ 2,425', emoji: '🦇' },
  Venom: { thaiName: 'พิษ', rarity: 'Mythical', beli: '$3,000,000', robux: 'R$ 2,450', emoji: '🐍' },
  Control: { thaiName: 'คอนโทรล', rarity: 'Mythical', beli: '$3,200,000', robux: 'R$ 2,500', emoji: '🎮' },
  Gas: { thaiName: 'แก๊ส', rarity: 'Mythical', beli: '$3,400,000', robux: 'R$ 2,500', emoji: '🧪' },
  Spirit: { thaiName: 'วิญญาณ', rarity: 'Mythical', beli: '$3,400,000', robux: 'R$ 2,550', emoji: '👻' },
  Leopard: { thaiName: 'เสือดาว', rarity: 'Mythical', beli: '$5,000,000', robux: 'R$ 3,000', emoji: '🐆' },
  Yeti: { thaiName: 'เยติ', rarity: 'Mythical', beli: '$6,000,000', robux: 'R$ 3,500', emoji: '❄️' },
  Kitsune: { thaiName: 'คิทสึเนะ (จิ้งจอก 9 หาง)', rarity: 'Mythical', beli: '$8,000,000', robux: 'R$ 4,000', emoji: '🦊' },
  Dragon: { thaiName: 'มังกร', rarity: 'Mythical', beli: '$10,000,000', robux: 'R$ 5,000', emoji: '🐉' },
  Creation: { thaiName: 'การสร้าง', rarity: 'Mythical', beli: '$3,800,000', robux: 'R$ 2,600', emoji: '✨' },
};

// ดึงข้อมูลและแปลงข้อมูลจาก Blox Fruits Fandom Wiki API
async function fetchLatestStockFromWiki(): Promise<{ date: string; time: string; fruits: string[] }> {
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

    if (response.ok) {
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

      if (records.length > 0) {
        const latest = records[records.length - 1];
        const allFruits = Array.from(new Set([...latest.fruits, 'Rocket', 'Spin']));
        return {
          date: latest.date,
          time: latest.time,
          fruits: allFruits,
        };
      }
    }
  } catch (err: any) {
    console.warn('Wiki fetch error:', err.message);
  }

  return {
    date: 'Current Rotation',
    time: 'Live',
    fruits: ['Magma', 'Quake', 'Spider', 'Rocket', 'Spin'],
  };
}

function getNextResetInfo() {
  const now = new Date();
  const currentUtcHour = now.getUTCHours();
  const nextUtcHour = (Math.floor(currentUtcHour / 4) + 1) * 4;

  const nextResetDate = new Date(now);
  nextResetDate.setUTCHours(nextUtcHour, 0, 0, 0);

  const diffMs = nextResetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const thaiNextHour = (nextResetDate.getUTCHours() + 7) % 24;
  const thaiFormatted = `${String(thaiNextHour).padStart(2, '0')}:00 น.`;

  return {
    thaiFormatted,
    countdown: `${diffHours} ชั่วโมง ${diffMinutes} นาที`,
    timestampSec: Math.floor(nextResetDate.getTime() / 1000),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always set CORS & JSON headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const webhookUrl =
    process.env.DISCORD_WEBHOOK_URL ||
    (req.body && req.body.webhookUrl) ||
    (req.query.webhook as string) ||
    'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ';

  try {
    const stock = await fetchLatestStockFromWiki();
    const nextReset = getNextResetInfo();

    const grouped: Record<string, string[]> = {
      Mythical: [],
      Legendary: [],
      Rare: [],
      Uncommon: [],
      Common: [],
    };

    let hasMythical = false;
    let hasLegendary = false;

    for (const fruitName of stock.fruits) {
      const info = FRUIT_INFO[fruitName];
      const rarity = info?.rarity || 'Common';
      const thai = info?.thaiName ? ` (${info.thaiName})` : '';
      const emoji = info?.emoji || '🍉';
      const price = info ? ` — ${info.beli} | ${info.robux}` : '';

      if (rarity === 'Mythical') hasMythical = true;
      if (rarity === 'Legendary') hasLegendary = true;

      grouped[rarity].push(`${emoji} **${fruitName}**${thai}${price}`);
    }

    let embedColor = 0x3498db;
    if (hasMythical) embedColor = 0xe74c3c;
    else if (hasLegendary) embedColor = 0x9b59b6;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
    if (grouped.Mythical.length > 0) {
      fields.push({ name: '🔥 ระดับ Mythical (ผลเทพ/มายา)', value: grouped.Mythical.join('\n'), inline: false });
    }
    if (grouped.Legendary.length > 0) {
      fields.push({ name: '✨ ระดับ Legendary (ผลตำนาน)', value: grouped.Legendary.join('\n'), inline: false });
    }
    if (grouped.Rare.length > 0) {
      fields.push({ name: '💎 ระดับ Rare (ผลหายาก)', value: grouped.Rare.join('\n'), inline: false });
    }
    if (grouped.Uncommon.length > 0) {
      fields.push({ name: '🌿 ระดับ Uncommon (ผลธรรมดาคัดพิเศษ)', value: grouped.Uncommon.join('\n'), inline: false });
    }
    if (grouped.Common.length > 0) {
      fields.push({ name: '📦 ระดับ Common (ผลทั่วไป / ขายประจำ)', value: grouped.Common.join('\n'), inline: false });
    }

    fields.push({
      name: '⏰ เวลารีเซ็ตสต็อกรอบถัดไป',
      value: `• **เวลาไทย:** ${nextReset.thaiFormatted}\n• **นับถอยหลัง:** อีกประมาณ ${nextReset.countdown}\n• **Discord Timestamp:** <t:${nextReset.timestampSec}:R>`,
      inline: false,
    });

    const payload = {
      content: hasMythical ? '🚨 **[ALERT] มีผล Mythical เข้าสต็อก Blox Fruits Dealer ตอนนี้!**' : undefined,
      username: 'Blox Fruits Fruit Dealer',
      avatar_url: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
      embeds: [
        {
          title: '🍉 Blox Fruits Stock Update | อัปเดตสต็อกผลไม้ปัจจุบัน',
          description: `🛒 **คนขายผลปีศาจ (Blox Fruit Dealer)** มีผลไม้พร้อมขายในรอบนี้:\n*(บันทึกรอบ ${stock.date} เวลา ${stock.time})*`,
          color: embedColor,
          fields,
          footer: {
            text: 'Blox Fruits Stock Notifier • ข้อมูลอ้างอิงจาก Blox Fruits Fandom Wiki',
            icon_url: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/6f/Magma_Fruit.png/revision/latest',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'ส่งข้อความแจ้งเตือนไปยัง Discord Webhook เรียบร้อยแล้ว!',
      fruitsCount: stock.fruits.length,
      hasMythical,
      hasLegendary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(200).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
}
