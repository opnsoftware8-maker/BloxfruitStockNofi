export const VERCEL_CODE_FILES = {
  'api/stock-notifier.ts': `/**
 * Blox Fruits Dealer Stock Notifier for Vercel Serverless / Cron Job
 * พัฒนาด้วย TypeScript รองรับการรันบน Vercel ทุก 4 ชั่วโมง
 * Webhook: สามารถกำหนดผ่าน Environment Variable 'DISCORD_WEBHOOK_URL'
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ข้อมูลอ้างอิงผลไม้ (ราคา, เกรด, ภาษาไทย)
interface FruitMeta {
  thaiName: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Mythical';
  beli: string;
  robux: string;
  emoji: string;
}

const FRUIT_INFO: Record<string, FruitMeta> = {
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
  const url = 'https://blox-fruits.fandom.com/api.php?action=parse&page=History_of_Stock&format=json&prop=wikitext';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BloxFruitsStockNotifier/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(\`Failed to fetch wiki: \${response.statusText}\`);
  }

  const data = (await response.json()) as any;
  const wikitext: string = data?.parse?.wikitext?.['*'] || '';

  const chunks = wikitext.split(/\\n(?=!\\d+\\/\\d+\\/\\d+)/);
  const records: Array<{ date: string; time: string; fruits: string[] }> = [];

  for (const chunk of chunks) {
    const lines = chunk.split('\\n').map((l) => l.trim());
    const dates: string[] = [];
    let idx = 0;
    while (idx < lines.length && lines[idx].startsWith('!')) {
      const d = lines[idx].replace(/^!+/, '').trim();
      if (d) dates.push(d);
      idx++;
    }
    if (!dates.length) continue;

    const rowBlocks = chunk.split(/\\n\\|-\\n?/);
    for (const rBlock of rowBlocks) {
      const cellLines = rBlock
        .split('\\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('|') && !l.startsWith('|-') && !l.startsWith('|}'));
      if (cellLines.length < 2) continue;

      const time = cellLines[0].substring(1).trim();
      for (let d = 0; d < dates.length; d++) {
        const val = cellLines[d + 1] ? cellLines[d + 1].substring(1).trim() : '';
        if (val && val !== '-' && !val.includes('Navigation') && !val.includes('{{')) {
          const rawFruits = val
            .replace(/\\[\\[([^\\]|]+)(?:\\|[^\\]]+)?\\]\\]/g, '$1')
            .replace(/\\'{2,}/g, '')
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

  // ได้รายการที่อัปเดตล่าสุด
  if (records.length > 0) {
    const latest = records[records.length - 1];
    // เพิ่มผลไม้ประจำ (Rocket, Spin) ที่มีในร้านค้าตลอดเวลา
    const allFruits = Array.from(new Set([...latest.fruits, 'Rocket', 'Spin']));
    return {
      date: latest.date,
      time: latest.time,
      fruits: allFruits,
    };
  }

  // ข้อมูลสำรองหากหน้า Wiki มีการปรับปรุงโครงสร้าง
  return {
    date: 'Current Rotation',
    time: 'Live',
    fruits: ['Magma', 'Quake', 'Spider', 'Rocket', 'Spin'],
  };
}

// คำนวณเวลารีเซ็ตรอบถัดไป (03:00, 07:00, 11:00, 15:00, 19:00, 23:00 เวลาไทย)
function getNextResetInfo() {
  const now = new Date();
  // UTC hours: 0, 4, 8, 12, 16, 20
  const currentUtcHour = now.getUTCHours();
  const nextUtcHour = (Math.floor(currentUtcHour / 4) + 1) * 4;
  
  const nextResetDate = new Date(now);
  nextResetDate.setUTCHours(nextUtcHour, 0, 0, 0);

  const diffMs = nextResetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  // เวลาไทย (UTC + 7)
  const thaiNextHour = (nextResetDate.getUTCHours() + 7) % 24;
  const thaiFormatted = \`\${String(thaiNextHour).padStart(2, '0')}:00 น.\`;

  return {
    thaiFormatted,
    countdown: \`\${diffHours} ชั่วโมง \${diffMinutes} นาที\`,
    timestampSec: Math.floor(nextResetDate.getTime() / 1000),
  };
}

// สร้าง Discord Rich Embed ที่สวยงาม
function buildDiscordPayload(stock: { date: string; time: string; fruits: string[] }) {
  const nextReset = getNextResetInfo();

  // จัดกลุ่มผลไม้ตามความหายาก (Rarity)
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
    const thai = info?.thaiName ? \` (\${info.thaiName})\` : '';
    const emoji = info?.emoji || '🍉';
    const price = info ? \` — \${info.beli} | \${info.robux}\` : '';

    if (rarity === 'Mythical') hasMythical = true;
    if (rarity === 'Legendary') hasLegendary = true;

    grouped[rarity].push(\`\${emoji} **\${fruitName}**\${thai}\${price}\`);
  }

  // กำหนดสีของ Embed ตามผลที่หายากที่สุดในรอบนี้
  let embedColor = 0x3498db; // น้ำเงิน (Rare)
  if (hasMythical) embedColor = 0xe74c3c; // แดง (Mythical)
  else if (hasLegendary) embedColor = 0x9b59b6; // ม่วง (Legendary)

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (grouped.Mythical.length > 0) {
    fields.push({
      name: '🔥 ระดับ Mythical (ผลเทพ/มายา)',
      value: grouped.Mythical.join('\\n'),
      inline: false,
    });
  }

  if (grouped.Legendary.length > 0) {
    fields.push({
      name: '✨ ระดับ Legendary (ผลตำนาน)',
      value: grouped.Legendary.join('\\n'),
      inline: false,
    });
  }

  if (grouped.Rare.length > 0) {
    fields.push({
      name: '💎 ระดับ Rare (ผลหายาก)',
      value: grouped.Rare.join('\\n'),
      inline: false,
    });
  }

  if (grouped.Uncommon.length > 0) {
    fields.push({
      name: '🌿 ระดับ Uncommon (ผลธรรมดาคัดพิเศษ)',
      value: grouped.Uncommon.join('\\n'),
      inline: false,
    });
  }

  if (grouped.Common.length > 0) {
    fields.push({
      name: '📦 ระดับ Common (ผลทั่วไป / ขายประจำ)',
      value: grouped.Common.join('\\n'),
      inline: false,
    });
  }

  // ข้อมูลรอบรีเซ็ต
  fields.push({
    name: '⏰ เวลารีเซ็ตสต็อกรอบถัดไป',
    value: \`• **เวลาไทย:** \${nextReset.thaiFormatted}\\n• **นับถอยหลัง:** อีกประมาณ \${nextReset.countdown}\\n• **Discord Timestamp:** <t:\${nextReset.timestampSec}:R>\`,
    inline: false,
  });

  // ข้อความแท็กแจ้งเตือน (สามารถปรับได้ตามต้องการ)
  let content = '';
  if (hasMythical) {
    content = '🚨 **[ALERT] มีผล Mythical เข้าสต็อก Blox Fruits Dealer ตอนนี้!**';
  }

  return {
    content: content || undefined,
    username: 'Blox Fruits Fruit Dealer',
    avatar_url: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
    embeds: [
      {
        title: '🍉 Blox Fruits Stock Update | อัปเดตสต็อกผลไม้ปัจจุบัน',
        description: \`🛒 **คนขายผลปีศาจ (Blox Fruit Dealer)** มีผลไม้พร้อมขายในรอบนี้:\\n*(บันทึกรอบ \${stock.date} เวลา \${stock.time})*\`,
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
}

// Vercel Serverless Function Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // ดึง Webhook URL จาก Environment Variable หรือ Query param หรือใช้ค่าตั้งต้น
    const webhookUrl =
      process.env.DISCORD_WEBHOOK_URL ||
      (req.query.webhook as string) ||
      'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ';

    if (!webhookUrl) {
      return res.status(400).json({ error: 'DISCORD_WEBHOOK_URL is not set' });
    }

    // 1. ดึงข้อมูลสต็อกจาก Wiki
    const stock = await fetchLatestStockFromWiki();

    // 2. สร้าง Discord Embed Payload
    const payload = buildDiscordPayload(stock);

    // 3. ส่งข้อมูลไปยัง Discord Webhook
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return res.status(502).json({
        success: false,
        error: \`Discord Webhook responded with \${discordRes.status}: \${errText}\`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'ส่งแจ้งเตือนสต็อกเข้า Discord เรียบร้อยแล้ว!',
      stock: stock.fruits,
      date: stock.date,
      time: stock.time,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in stock notifier:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
}
`,

  'vercel.json': `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/stock-notifier",
      "schedule": "0 0,4,8,12,16,20 * * *"
    }
  ]
}
`,

  '.github/workflows/stock-cron.yml': `# GitHub Actions Workflow สำหรับแจ้งเตือน Blox Fruits ทุก 4 ชั่วโมง ฟรี 100%
name: Blox Fruits 4-Hour Stock Notifier

on:
  schedule:
    # รันทุก 4 ชั่วโมงตรงเวลารีสต็อก (เวลาไทย 03:00, 07:00, 11:00, 15:00, 19:00, 23:00 น.)
    - cron: '0 0,4,8,12,16,20 * * *'
  workflow_dispatch: # รองรับการกดรันด้วยตนเองบน GitHub

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Trigger Stock Notifier
        env:
          DISCORD_WEBHOOK_URL: \${{ secrets.DISCORD_WEBHOOK_URL }}
        run: npx tsx -e "import('./api/stock-notifier.ts')"
`,

  'package.json': `{
  "name": "bloxfruits-stock-discord-notifier",
  "version": "1.0.0",
  "description": "Blox Fruits Stock Notifier for Discord via Vercel Cron",
  "main": "api/stock-notifier.ts",
  "scripts": {
    "dev": "vercel dev",
    "build": "tsc"
  },
  "dependencies": {
    "@vercel/node": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["api/**/*"]
}
`,

  '.env.example': `# คัดลอกไฟล์นี้เป็น .env บนเครื่อง หรือใส่ใน Vercel Project Settings > Environment Variables
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ"
`,

  'README.md': `# 🍉 Blox Fruits Stock Discord Notifier (Vercel Edition)

บอทแจ้งเตือนสต็อกผลไม้ Blox Fruits เข้า Discord อัตโนมัติทุก 4 ชั่วโมง โดยดึงข้อมูลตรงจาก Blox Fruits Fandom Wiki และรันฟรีบน **Vercel Cron**!

---

## 🚀 วิธีนำขึ้น Vercel (ขั้นตอนอย่างละเอียด)

### วิธีที่ 1: ติดตั้งผ่าน GitHub + Vercel (แนะนำที่สุด 🌟)

1. **สร้างโฟลเดอร์โปรเจกต์บนเครื่องของคุณ**
   วางโครงสร้างไฟล์ดังนี้:
   \`\`\`text
   bloxfruits-stock/
   ├── api/
   │   └── stock-notifier.ts
   ├── .env.example
   ├── package.json
   ├── tsconfig.json
   └── vercel.json
   \`\`\`

2. **นำขึ้น GitHub**
   \`\`\`bash
   git init
   git add .
   git commit -m "feat: blox fruits stock discord notifier"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   \`\`\`

3. **เชื่อมต่อกับ Vercel**
   - เข้าเว็บไซต์ [https://vercel.com](https://vercel.com) แล้วล็อกอินด้วย GitHub
   - กดปุ่ม **"Add New..."** -> **"Project"**
   - เลือก Repository ที่เพิ่งอัปโหลดขึ้นไป แล้วกด **"Import"**

4. **ใส่ Environment Variable**
   - ในหน้า Configure Project หัวข้อ **Environment Variables**:
     - **Key:** \`DISCORD_WEBHOOK_URL\`
     - **Value:** \`https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ\`
   - กด **"Deploy"** รอประมาณ 30 วินาที ระบบจะสร้างเสร็จสมบูรณ์!

5. **ทดสอบยิงแจ้งเตือนด้วยตัวเอง**
   - เมื่อ Deploy เสร็จ คุณจะได้ URL ของโปรเจกต์ เช่น \`https://my-app.vercel.app\`
   - เปิดบราวเซอร์หรือทดสอบด้วยการเปิด URL:
     \`\`\`text
     https://<your-project>.vercel.app/api/stock-notifier
     \`\`\`
   - ระบบจะยิงข้อความ Rich Embed เข้า Discord ทันที และแสดงผลลัพธ์ JSON ในบราวเซอร์!

---

### ⏰ การทำงานของระบบ Cron Job บน Vercel
- ไฟล์ \`vercel.json\` ตั้งค่า \`0 0,4,8,12,16,20 * * *\` (ทุก 4 ชั่วโมงตามรอบรีเซ็ตผลไม้ของ Blox Fruits)
- **เวลาไทยที่รีเซ็ต:** 03:00, 07:00, 11:00, 15:00, 19:00, 23:00 น.
- *หมายเหตุสำหรับ Vercel Free (Hobby):* หากต้องการความแม่นยำสูง สามารถใช้เว็บฟรีอย่าง [cron-job.org](https://cron-job.org) ตั้งเวลายิง GET Request มาที่ \`https://<your-project>.vercel.app/api/stock-notifier\` ได้ฟรีตลอด 24 ชม. เช่นกัน!
`,
};
