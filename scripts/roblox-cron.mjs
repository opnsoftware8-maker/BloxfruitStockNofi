// Standalone Roblox Limiteds & Stock Watcher for GitHub Actions (24/7 Free)
// Can be executed directly with: node scripts/roblox-cron.mjs

const DEFAULT_WEBHOOK =
  'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ';

const WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK || process.env.WEBHOOK_URL || DEFAULT_WEBHOOK;
const ITEMS_COUNT = parseInt(process.env.ITEMS_COUNT || '5', 10);
const MODE = process.env.MODE || 'top-market'; // 'top-market' | 'price-drop' | 'high-demand'
const CUSTOM_NOTE =
  process.env.CUSTOM_NOTE ||
  '⚡ แจ้งเตือนอัตโนมัติจาก GitHub Actions 24/7 (รันฟรีบนคลาวด์ ไม่ต้องเปิดคอม)';

async function run() {
  console.log('==============================================');
  console.log('🚀 Roblox Limiteds Auto Bot (GitHub Actions)');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`🎯 Mode: ${MODE} | Items: ${ITEMS_COUNT}`);
  console.log('==============================================');

  if (!WEBHOOK_URL || !WEBHOOK_URL.startsWith('https://discord.com/api/webhooks/')) {
    console.error('❌ Error: Invalid Discord Webhook URL.');
    process.exit(1);
  }

  try {
    console.log('📡 Fetching latest data from Rolimons API...');
    const res = await fetch('https://www.rolimons.com/itemapi/itemdetails', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RobloxCatalogBot/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Rolimons HTTP status ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.items) {
      throw new Error('Invalid Rolimons JSON format');
    }

    const entries = Object.entries(data.items);
    console.log(`✅ Loaded ${entries.length} items from Rolimons.`);

    const items = entries.map(([idStr, val]) => {
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
        thumbnail: '',
      };
    });

    // Sort by Value or RAP
    items.sort((a, b) => (b.value > 0 ? b.value : b.rap) - (a.value > 0 ? a.value : a.rap));

    let candidateItems = [...items];
    if (MODE === 'high-demand') {
      candidateItems = candidateItems.filter((i) => i.demand >= 3);
    } else if (MODE === 'price-drop') {
      candidateItems = candidateItems.filter((i) => i.trend === 0 || i.projected === 1);
    }

    if (candidateItems.length === 0) {
      candidateItems = items;
    }

    const selectedItems = candidateItems.slice(0, ITEMS_COUNT);

    // Fetch thumbnails for top selected items
    const assetIds = selectedItems.map((i) => i.id).join(',');
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds}&size=150x150&format=Png`,
        { headers: { 'User-Agent': 'Roblox/WinInet' } }
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData?.data && Array.isArray(thumbData.data)) {
          for (const t of thumbData.data) {
            const found = selectedItems.find((i) => i.id === t.targetId);
            if (found && t.imageUrl) {
              found.thumbnail = t.imageUrl;
            }
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Thumbnail fetch warning:', e.message);
    }

    const demandMap = {
      0: 'ต่ำมาก (Terrible)',
      1: 'ต่ำ (Low)',
      2: 'ปานกลาง (Normal)',
      3: 'สูง (High) 🔥',
      4: 'ยอดนิยมสูงสุด (Amazing) 🌟',
    };

    const trendMap = {
      0: '📉 ราคาดิ่งลง (Lowering)',
      1: '⚡ ผันผวน (Unstable)',
      2: '⚖️ ทรงตัว (Stable)',
      3: '📈 กำลังพุ่ง (Raising)',
      4: '🔄 แกว่งตัว (Fluctuating)',
    };

    const fields = selectedItems.map((item) => {
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

    if (CUSTOM_NOTE) {
      fields.push({
        name: '📝 บันทึกระบบอัตโนมัติ',
        value: CUSTOM_NOTE,
        inline: false,
      });
    }

    const modeLabels = {
      'top-market': '💎 สรุปสถิติ & สต็อกไอเทมยอดนิยม Top Market',
      'price-drop': '🚨 แจ้งเตือนราคาหลุด / ราคาดิ่ง (Price Drop Sniper)',
      'high-demand': '🔥 สต็อกไอเทมความต้องการสูงสุด (High & Amazing Demand)',
    };

    const payload = {
      username: 'Roblox Limiteds Watcher (GitHub Actions 24/7)',
      avatar_url:
        'https://static.wikia.nocookie.net/roblox/images/a/a2/Dominus_Empyreus.png/revision/latest',
      embeds: [
        {
          title: `💎 Roblox Limiteds Auto-Report | ${modeLabels[MODE] || 'อัปเดตอัตโนมัติ'}`,
          description: `ดึงข้อมูลตรงจาก **Roblox Catalog & Rolimons API** อัตโนมัติด้วย **GitHub Actions** ⚡\n(รันบนคลาวด์ 24 ชม. ฟรี 100% แม้ปิดคอม)`,
          color: MODE === 'price-drop' ? 0xff3b30 : 0x00a2ff,
          fields,
          thumbnail: {
            url:
              selectedItems[0]?.thumbnail ||
              'https://tr.rbxcdn.com/180DAY-1de084fa35fdeace0b12fd5b21077677/150/150/Hat/Png/noFilter',
          },
          footer: {
            text: 'GitHub Actions Automated Engine 24/7 • ไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้',
            icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    console.log(`📤 Sending alert with ${selectedItems.length} items to Discord...`);
    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      throw new Error(`Discord Webhook HTTP ${discordRes.status}: ${errText}`);
    }

    console.log('🎉 SUCCESS: Sent Roblox Limiteds alert to Discord via GitHub Actions!');
  } catch (err) {
    console.error('💥 Execution Error:', err);
    process.exit(1);
  }
}

run();
