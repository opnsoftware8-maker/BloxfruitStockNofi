import React from 'react';
import { BloxFruit, RARITY_COLORS } from '../data/fruits';

interface DiscordEmbedPreviewProps {
  fruits: BloxFruit[];
  rotationDate: string;
  rotationTime: string;
  nextResetThai: string;
  countdownText: string;
  timestampSec: number;
  mentionType: string;
  roleId: string;
  onlyHighRarity: boolean;
  customNote: string;
}

export const DiscordEmbedPreview: React.FC<DiscordEmbedPreviewProps> = ({
  fruits,
  rotationDate,
  rotationTime,
  nextResetThai,
  countdownText,
  mentionType,
  roleId,
  onlyHighRarity,
  customNote,
}) => {
  // Determine highest rarity for embed sidebar color
  const hasMythical = fruits.some((f) => f.rarity === 'Mythical');
  const hasLegendary = fruits.some((f) => f.rarity === 'Legendary');
  const hasRare = fruits.some((f) => f.rarity === 'Rare');

  let borderColorClass = 'border-l-sky-500';
  let rarityGlow = 'from-sky-500/10 to-transparent';
  if (hasMythical) {
    borderColorClass = 'border-l-rose-500';
    rarityGlow = 'from-rose-500/20 to-transparent';
  } else if (hasLegendary) {
    borderColorClass = 'border-l-fuchsia-500';
    rarityGlow = 'from-fuchsia-500/20 to-transparent';
  } else if (hasRare) {
    borderColorClass = 'border-l-sky-500';
    rarityGlow = 'from-sky-500/20 to-transparent';
  }

  // Filter fruits if onlyHighRarity is checked
  const displayedFruits = onlyHighRarity
    ? fruits.filter((f) => f.rarity === 'Mythical' || f.rarity === 'Legendary')
    : fruits;

  const grouped: Record<string, BloxFruit[]> = {
    Mythical: [],
    Legendary: [],
    Rare: [],
    Uncommon: [],
    Common: [],
  };

  displayedFruits.forEach((f) => {
    if (grouped[f.rarity]) {
      grouped[f.rarity].push(f);
    }
  });

  const thumbnailFruit =
    fruits.find((f) => f.rarity === 'Mythical') ||
    fruits.find((f) => f.rarity === 'Legendary') ||
    fruits[0];

  return (
    <div className="bg-[#313338] text-zinc-100 rounded-xl p-4 md:p-5 font-sans border border-zinc-700/60 shadow-2xl select-none">
      {/* Discord Message Header */}
      <div className="flex items-start gap-3 mb-2">
        <div className="relative">
          <img
            src={
              hasMythical
                ? 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e9/Kitsune_Fruit.png/revision/latest'
                : 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest'
            }
            alt="Bot Avatar"
            className="w-10 h-10 rounded-full bg-zinc-800 object-cover border border-zinc-700"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#313338]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
              Blox Fruits Fruit Dealer
            </span>
            <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded tracking-wide">
              BOT
            </span>
            <span className="text-xs text-zinc-400">วันนี้ เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
          </div>

          {/* Mention line if enabled */}
          {mentionType !== 'none' && (
            <div className="mt-1 text-sm">
              {mentionType === '@everyone' && (
                <span className="bg-[#5865F2]/30 text-[#c9cdfb] px-1.5 py-0.5 rounded font-medium">
                  @everyone
                </span>
              )}
              {mentionType === '@here' && (
                <span className="bg-[#5865F2]/30 text-[#c9cdfb] px-1.5 py-0.5 rounded font-medium">
                  @here
                </span>
              )}
              {mentionType === 'role' && roleId && (
                <span className="bg-[#5865F2]/30 text-[#c9cdfb] px-1.5 py-0.5 rounded font-medium">
                  @{roleId}
                </span>
              )}
              {hasMythical && (
                <span className="ml-2 text-rose-400 font-semibold">
                  🚨 [ALERT] มีผล Mythical เข้าสต็อก Blox Fruits Dealer!
                </span>
              )}
            </div>
          )}

          {/* Discord Embed Container */}
          <div
            className={`mt-2 bg-[#2b2d31] rounded-lg border-l-4 ${borderColorClass} p-4 shadow-md bg-gradient-to-r ${rarityGlow} max-w-2xl`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-3 flex-1">
                {/* Embed Title */}
                <div className="font-bold text-base text-white hover:text-sky-400 cursor-pointer flex items-center gap-1.5">
                  <span>🍉</span>
                  <span>Blox Fruits Dealer Stock Update | อัปเดตสต็อกผลไม้</span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-relaxed">
                  🛒 <strong>คนขายผลปีศาจ (Blox Fruit Dealer)</strong> มีผลไม้พร้อมจำหน่ายในสต็อกปัจจุบัน:
                  <br />
                  <span className="text-zinc-400 italic">
                    *(บันทึกรอบวันที่ {rotationDate} เวลา {rotationTime})*
                  </span>
                </p>

                {/* Fields */}
                <div className="space-y-3 pt-1 text-xs">
                  {grouped.Mythical.length > 0 && (
                    <div>
                      <div className="font-bold text-rose-400 mb-1 flex items-center gap-1">
                        <span>🔥</span> ระดับ Mythical (ผลมายา/เทพ)
                      </div>
                      <div className="space-y-0.5 pl-2 text-zinc-200">
                        {grouped.Mythical.map((f) => (
                          <div key={f.name}>
                            • <strong className="text-white">{f.name}</strong> ({f.thaiName}) — 💰 ${f.beliPrice.toLocaleString()} | 💎 R$ {f.robuxPrice}
                            {f.awakening && <span className="text-amber-400 font-medium"> ⚡(มีร่างตื่น)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {grouped.Legendary.length > 0 && (
                    <div>
                      <div className="font-bold text-fuchsia-400 mb-1 flex items-center gap-1">
                        <span>✨</span> ระดับ Legendary (ผลตำนาน)
                      </div>
                      <div className="space-y-0.5 pl-2 text-zinc-200">
                        {grouped.Legendary.map((f) => (
                          <div key={f.name}>
                            • <strong className="text-white">{f.name}</strong> ({f.thaiName}) — 💰 ${f.beliPrice.toLocaleString()} | 💎 R$ {f.robuxPrice}
                            {f.awakening && <span className="text-amber-400 font-medium"> ⚡(มีร่างตื่น)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {grouped.Rare.length > 0 && (
                    <div>
                      <div className="font-bold text-sky-400 mb-1 flex items-center gap-1">
                        <span>💎</span> ระดับ Rare (ผลหายาก)
                      </div>
                      <div className="space-y-0.5 pl-2 text-zinc-200">
                        {grouped.Rare.map((f) => (
                          <div key={f.name}>
                            • <strong className="text-white">{f.name}</strong> ({f.thaiName}) — 💰 ${f.beliPrice.toLocaleString()} | 💎 R$ {f.robuxPrice}
                            {f.awakening && <span className="text-amber-400 font-medium"> ⚡(มีร่างตื่น)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {grouped.Uncommon.length > 0 && (
                    <div>
                      <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                        <span>🌿</span> ระดับ Uncommon (ผลคัดพิเศษ)
                      </div>
                      <div className="space-y-0.5 pl-2 text-zinc-200">
                        {grouped.Uncommon.map((f) => (
                          <div key={f.name}>
                            • <strong className="text-white">{f.name}</strong> ({f.thaiName}) — 💰 ${f.beliPrice.toLocaleString()} | 💎 R$ {f.robuxPrice}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {grouped.Common.length > 0 && (
                    <div>
                      <div className="font-bold text-zinc-400 mb-1 flex items-center gap-1">
                        <span>📦</span> ระดับ Common (ผลทั่วไป / ประจำ)
                      </div>
                      <div className="space-y-0.5 pl-2 text-zinc-300">
                        {grouped.Common.map((f) => (
                          <div key={f.name}>
                            • <strong className="text-white">{f.name}</strong> ({f.thaiName}) — 💰 ${f.beliPrice.toLocaleString()} | 💎 R$ {f.robuxPrice}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reset Timer */}
                  <div className="bg-[#232428]/60 p-2.5 rounded border border-zinc-700/50">
                    <div className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                      <span>⏰</span> เวลารีเซ็ตสต็อกรอบถัดไป
                    </div>
                    <div className="space-y-0.5 text-zinc-300 pl-2">
                      <div>• <strong>เวลาไทย:</strong> {nextResetThai}</div>
                      <div>• <strong>นับถอยหลัง:</strong> อีกประมาณ {countdownText}</div>
                      <div>
                        • <strong>Discord Dynamic Timestamp:</strong>{' '}
                        <span className="bg-[#1e1f22] px-1 py-0.5 rounded text-sky-300 font-mono">
                          &lt;t:{Math.floor(Date.now() / 1000) + 7200}:R&gt;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Note */}
                  {customNote.trim() && (
                    <div className="bg-[#232428]/60 p-2.5 rounded border border-zinc-700/50">
                      <div className="font-bold text-indigo-300 mb-1">📝 ข้อความเพิ่มเติม</div>
                      <div className="text-zinc-200 pl-2">{customNote}</div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-400 border-t border-zinc-700/40">
                  <img
                    src="https://static.wikia.nocookie.net/roblox-blox-piece/images/1/14/Quake_Fruit.png/revision/latest"
                    alt="Icon"
                    className="w-4 h-4 rounded-full"
                  />
                  <span>Blox Fruits Stock Notifier • Vercel Cron Integration</span>
                  <span>•</span>
                  <span>วันนี้ เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                </div>
              </div>

              {/* Thumbnail */}
              {thumbnailFruit && (
                <div className="shrink-0 hidden sm:block">
                  <img
                    src={thumbnailFruit.image}
                    alt={thumbnailFruit.name}
                    className="w-20 h-20 rounded-lg object-contain bg-zinc-900/60 p-1 border border-zinc-700 shadow"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
