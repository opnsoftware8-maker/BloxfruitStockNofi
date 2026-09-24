import React, { useState } from 'react';
import { BloxFruit, FRUITS_DATABASE } from '../data/fruits';
import { DiscordEmbedPreview } from './DiscordEmbedPreview';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Settings2,
  Eye,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface DiscordTestTabProps {
  stockFruits: BloxFruit[];
  rotationDate: string;
  rotationTime: string;
  nextResetThai: string;
  countdownText: string;
  timestampSec: number;
}

export const DiscordTestTab: React.FC<DiscordTestTabProps> = ({
  stockFruits,
  rotationDate,
  rotationTime,
  nextResetThai,
  countdownText,
  timestampSec,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(
    'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ'
  );
  const [mentionType, setMentionType] = useState<'none' | '@everyone' | '@here' | 'role'>('none');
  const [roleId, setRoleId] = useState('');
  const [onlyHighRarity, setOnlyHighRarity] = useState(false);
  const [customNote, setCustomNote] = useState('');
  
  // Custom test fruits override
  const [currentTestFruits, setCurrentTestFruits] = useState<BloxFruit[]>(stockFruits);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // Sync test fruits when stockFruits changes if user hasn't overridden
  React.useEffect(() => {
    if (currentTestFruits.length === 0 && stockFruits.length > 0) {
      setCurrentTestFruits(stockFruits);
    }
  }, [stockFruits]);

  const handleSend = async () => {
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/bloxfruits/send-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          mentionType,
          roleId,
          onlyHighRarity,
          customNote,
          fruitsList: currentTestFruits.length > 0 ? currentTestFruits : stockFruits,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSendResult({
          type: 'success',
          message: '✅ ส่งการแจ้งเตือนสต็อกเข้า Discord เรียบร้อยแล้ว! (ตรวจสอบในแชนแนล Discord ของคุณได้ทันที)',
          details: `ส่งผลไม้ทั้งหมด ${data.fruitsCount} ผล • เวลา: ${new Date().toLocaleTimeString('th-TH')}`,
        });
      } else {
        setSendResult({
          type: 'error',
          message: '❌ เกิดข้อผิดพลาดในการส่งเข้า Discord',
          details: data.error || 'Unknown error occurred',
        });
      }
    } catch (err: any) {
      setSendResult({
        type: 'error',
        message: '❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        details: err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const addFruitToTest = (name: string) => {
    const found = FRUITS_DATABASE[name];
    if (found && !currentTestFruits.some((f) => f.name === found.name)) {
      setCurrentTestFruits([...currentTestFruits, found]);
    }
  };

  const removeFruitFromTest = (name: string) => {
    setCurrentTestFruits(currentTestFruits.filter((f) => f.name !== name));
  };

  const resetToWikiStock = () => {
    setCurrentTestFruits(stockFruits);
  };

  return (
    <div className="space-y-6">
      {/* Top Info Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>📢 ห้องทดสอบส่งแจ้งเตือน Discord Webhook</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              ทดสอบยิงข้อความ Rich Embed ไปยังแชนแนล Discord ของคุณโดยตรง
              และปรับแต่งตัวเลือกการแท็กแจ้งเตือนได้แบบเรียลไทม์
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={isSending || !webhookUrl}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-[#5865F2]/30 active:scale-95 transition-all cursor-pointer"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
            {isSending ? 'กำลังส่งเข้า Discord...' : 'ยิงแจ้งเตือนเข้า Discord ทันที'}
          </button>
        </div>

        {/* Send Result Alert */}
        {sendResult && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-start gap-3 transition-all ${
              sendResult.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            {sendResult.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-sm">{sendResult.message}</div>
              {sendResult.details && (
                <div className="text-xs opacity-90 mt-0.5 font-mono">{sendResult.details}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Settings & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" />
              การตั้งค่า Webhook & ข้อความ
            </h3>

            {/* Webhook URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Discord Webhook URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full pl-3 pr-8 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#5865F2]"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  title="คัดลอก Webhook URL"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                ค่าตั้งต้นคือ Webhook ของคุณที่ระบุมา พร้อมใช้งานทันที
              </p>
            </div>

            {/* Mentions Options */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                การแท็กผู้ใช้ (Mentions / Pings)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'ไม่แท็ก (None)' },
                  { id: '@everyone', label: '@everyone' },
                  { id: '@here', label: '@here' },
                  { id: 'role', label: 'ระบุ Role ID' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMentionType(item.id as any)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                      mentionType === item.id
                        ? 'bg-[#5865F2]/20 border-[#5865F2] text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {mentionType === 'role' && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="ใส่ Discord Role ID เช่น 1122334455..."
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyHighRarity}
                  onChange={(e) => setOnlyHighRarity(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-[#5865F2] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">
                    แจ้งเตือนเฉพาะผลระดับสูง (Mythical & Legendary)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    ซ่อนผลระดับ Common / Uncommon / Rare ออกจากการแจ้งเตือน
                  </span>
                </div>
              </label>
            </div>

            {/* Custom Note */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label className="text-xs font-semibold text-zinc-300 block">
                ข้อความโน้ตเพิ่มเติม (Custom Note)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="เช่น: รีบเข้าเกมด่วน! ใครอยากซื้อผลนี้เจอกันเกาะคาเฟ่"
                rows={2}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-[#5865F2]"
              />
            </div>
          </div>

          {/* Test Fruits Sandbox */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                จำลองผลไม้ในรอบนี้ ({currentTestFruits.length} ผล)
              </h3>
              <button
                onClick={resetToWikiStock}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                รีเซ็ตเป็นสต็อกสด
              </button>
            </div>

            {/* Current Selected Chips */}
            <div className="flex flex-wrap gap-1.5">
              {currentTestFruits.map((fruit) => (
                <span
                  key={fruit.name}
                  className="inline-flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-1 rounded-lg text-zinc-200"
                >
                  <span>{fruit.name}</span>
                  <button
                    onClick={() => removeFruitFromTest(fruit.name)}
                    className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Quick Add Buttons for testing Mythicals */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="text-[11px] font-medium text-zinc-400">
                ⚡ คลิกด่วนเพื่อจำลองใส่ผลระดับเทพ (Test Mythicals):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Kitsune', 'Dragon', 'Dough', 'Buddha', 'Portal', 'T-Rex'].map((fName) => (
                  <button
                    key={fName}
                    type="button"
                    onClick={() => addFruitToTest(fName)}
                    className="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer border border-zinc-700"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    +{fName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Discord Rich Embed Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              ตัวอย่างข้อความจริงใน Discord (Live Rich Embed Preview)
            </h3>
            <span className="text-[11px] text-zinc-400">เรนเดอร์เทียบเท่าหน้าจอ Discord จริง 100%</span>
          </div>

          <DiscordEmbedPreview
            fruits={currentTestFruits}
            rotationDate={rotationDate}
            rotationTime={rotationTime}
            nextResetThai={nextResetThai}
            countdownText={countdownText}
            timestampSec={timestampSec}
            mentionType={mentionType}
            roleId={roleId}
            onlyHighRarity={onlyHighRarity}
            customNote={customNote}
          />
        </div>
      </div>
    </div>
  );
};
