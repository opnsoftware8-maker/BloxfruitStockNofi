/**
 * 🤖 Gemini AI Discord Q&A Bot (ตอบคนในดิสคอร์ดแบบแท็ก @บอท ได้ 100%)
 * 
 * -------------------------------------------------------------
 * 📌 คำตอบสำหรับผู้ใช้: "จะแท็กบอทยังไงให้มันตอบคนในกลุ่ม?"
 * -------------------------------------------------------------
 * Discord Webhook ปกติ: ส่งข้อความ "ขาออก" เข้า Discord ได้ แต่ Discord ไม่อนุญาตให้แท็ก @Webhook ได้
 * 
 * หากต้องการให้คนในกลุ่ม "แท็ก @บอท <คำถาม>" แล้วบอทตอบกลับทันที:
 * 1. ไปที่ https://discord.com/developers/applications (ล็อกอิน Discord)
 * 2. กด "New Application" -> ตั้งชื่อบอท -> ไปที่เมนู "Bot" ด้านซ้าย
 * 3. เลื่อนลงมาเปิดสวิตช์ "MESSAGE CONTENT INTENT" (สำคัญมาก เพื่อให้บอทอ่านข้อความที่แท็กได้)
 * 4. กด "Reset Token" แล้ว Copy "Bot Token" มาใส่ที่ DISCORD_BOT_TOKEN
 * 5. ไปที่เมนู "OAuth2" -> "URL Generator" -> ติ๊ก [bot] -> ติ๊กสิทธิ์ [Send Messages, Read Messages/View Channels]
 *    -> ก็อปลิงก์ไปเปิดในเบราว์เซอร์เพื่อเชิญบอทเข้าเซิร์ฟเวอร์ดิสคอร์ดของคุณ!
 * 6. รันคำสั่ง: node scripts/discord-gemini-bot.mjs
 * 
 * เมื่อมีคนพิมพ์: @ชื่อบอท ผลโมจิดีไหม?
 * หรือพิมพ์: !ask ดาบคาตานะสามเล่มทำยังไง?
 * -> บอทจะใช้ Gemini 3.8 Flash ตอบกลับคนนั้นในดิสคอร์ดทันที!
 */

import { GoogleGenAI } from '@google/genai';
import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// Webhook สำรองสำหรับส่งสรุป หรือประกาศ
const DISCORD_WEBHOOK =
  process.env.DISCORD_WEBHOOK ||
  'https://discord.com/api/webhooks/1552857116002484336/bAnDAEL79Vu7bVet-d-uxSGEogcvClHdwZYUkxdQanYtuwjyYndQldKrwo1wqYp-uiMb';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!BOT_TOKEN) {
  console.log('⚠️ [คำแนะนำ] ยังไม่ได้ใส่ DISCORD_BOT_TOKEN');
  console.log('👉 คุณสามารถรันคำสั่งโดยใส่ Token ได้ดังนี้:');
  console.log('   DISCORD_BOT_TOKEN="your_discord_bot_token" node scripts/discord-gemini-bot.mjs\n');
}

// 1. กำหนดค่า Gemini AI Client
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 2. สร้าง Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const SYSTEM_INSTRUCTION = `คุณคือผู้ช่วย AI ประจำกลุ่ม Discord สำหรับผู้เล่นเกม Roblox และ Blox Fruits
- ตอบเป็นภาษาไทยอย่างสุภาพ เป็นกันเอง มีความรู้ลึกซึ้งและกระชับ
- ตอบคำถามเรื่องผลปีศาจ, จุดฟาร์ม, ดาบ, เควสต์, เทรดดิ้ง, ไอเทม Limited ได้อย่างแม่นยำ
- ใช้ Bullet points และ Emoji ประกอบเพื่อให้อ่านง่ายบน Discord
- ความยาวคำตอบพอดีๆ ไม่สั้นเกินไปและไม่ยาวเกินหน้าจอ`;

client.once('ready', () => {
  console.log('====================================================');
  console.log(`🤖 บอท Gemini AI ออนไลน์แล้วในชื่อ: ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log('💡 วิธีใช้งานในเซิร์ฟเวอร์ Discord:');
  console.log(`   1. แท็กบอท: <@${client.user.id}> คำถามของคุณ...`);
  console.log('   2. หรือพิมพ์: !ask คำถามของคุณ...');
  console.log('====================================================');
});

client.on('messageCreate', async (message) => {
  // ไม่ตอบข้อความตัวเองหรือบอทอื่น
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user.id);
  const isAskCommand = message.content.startsWith('!ask') || message.content.startsWith('!ถาม');

  if (!isMentioned && !isAskCommand) return;

  // ดึงข้อความคำถาม
  let query = message.content;
  if (isMentioned) {
    // ลบแท็ก <@bot_id> ออก
    query = query.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
  } else if (isAskCommand) {
    query = query.replace(/^!(ask|ถาม)\s*/i, '').trim();
  }

  if (!query) {
    return message.reply('สวัสดีครับ! มีอะไรให้ผมและ Gemini AI ช่วยไหมครับ? แท็กผมพร้อมพิมพ์คำถามได้เลยนะ เช่น `@บอท ผล Kitsune ดีไหม`');
  }

  try {
    // แสดงสถานะ "กำลังพิมพ์..." (Typing indicator)
    await message.channel.sendTyping();

    console.log(`[Q&A] ${message.author.username} ถามว่า: "${query}"`);

    // เรียก Gemini 3.8 Flash API
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const answer = response.text || 'ขออภัยครับ ไม่สามารถคิดคำตอบได้ในขณะนี้';

    // ส่งคำตอบกลับหาคนที่แท็ก
    if (answer.length <= 1900) {
      // ตอบแบบ Embed สวยงาม
      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('💡 คำตอบจาก Gemini AI')
        .setDescription(answer)
        .setFooter({
          text: `ถามโดย ${message.author.username} • Google Gemini 3.8 Flash`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } else {
      // กรณีคำตอบยาว ส่งแบบ chunk
      await message.reply({ content: answer.substring(0, 1990) });
    }

    console.log(`[Q&A] ตอบคำถาม ${message.author.username} สำเร็จ!`);
  } catch (err) {
    console.error('[Error] ไม่สามารถประมวลผลคำตอบได้:', err);
    await message.reply(`ขออภัยครับ เกิดข้อผิดพลาดในการเรียก Gemini AI: ${err.message}`);
  }
});

// เริ่มต้นบอทถ้ามี Token
if (BOT_TOKEN) {
  client.login(BOT_TOKEN).catch((err) => {
    console.error('❌ ไม่สามารถล็อกอิน Discord Bot ได้:', err.message);
  });
}
