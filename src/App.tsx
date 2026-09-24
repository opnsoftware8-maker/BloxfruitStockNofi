import React, { useState, useEffect } from 'react';
import { BloxFruit, FRUITS_DATABASE } from './data/fruits';
import { LiveStockTab } from './components/LiveStockTab';
import { DiscordTestTab } from './components/DiscordTestTab';
import { VercelCodeTab } from './components/VercelCodeTab';
import { DeployGuideTab } from './components/DeployGuideTab';
import {
  Flame,
  Send,
  Code2,
  BookOpen,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'liveStock' | 'discordTest' | 'vercelCode' | 'deployGuide'
  >('liveStock');

  const [stockFruits, setStockFruits] = useState<BloxFruit[]>([
    FRUITS_DATABASE['Quake'],
    FRUITS_DATABASE['Magma'],
    FRUITS_DATABASE['Spider'],
    FRUITS_DATABASE['Rocket'],
    FRUITS_DATABASE['Spin'],
  ]);

  const [rotationDate, setRotationDate] = useState<string>('9/24/26');
  const [rotationTime, setRotationTime] = useState<string>('4:00 AM');
  const [nextResetThai, setNextResetThai] = useState<string>('11:00 น.');
  const [countdownText, setCountdownText] = useState<string>('กำลังคำนวณ...');
  const [timestampSec, setTimestampSec] = useState<number>(Math.floor(Date.now() / 1000) + 7200);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch stock from our API proxy
  const fetchStock = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/bloxfruits/stock');
      const data = await res.json();
      if (res.ok && data.success) {
        setStockFruits(data.data.fruits);
        setRotationDate(data.data.date);
        setRotationTime(data.data.time);
        if (data.data.resetTimers) {
          setNextResetThai(data.data.resetTimers.thaiFormatted);
          setTimestampSec(data.data.resetTimers.timestampSec);
        }
      } else {
        setApiError(data.error || 'Failed to fetch');
      }
    } catch (err: any) {
      console.warn('Using client-side fallback stock:', err);
      // Keep sensible default fruits
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Real-time ticking countdown to next reset
  useEffect(() => {
    const updateCountdown = () => {
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
      setNextResetThai(`${String(thaiNextHour).padStart(2, '0')}:00 น.`);
      setCountdownText(
        `${String(diffHours).padStart(2, '0')}:${String(diffMinutes).padStart(2, '0')}:${String(diffSeconds).padStart(2, '0')}`
      );
      setTimestampSec(Math.floor(nextResetDate.getTime() / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0d0f12]/90 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & App Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Blox Fruits Stock
                  </h1>
                  <span className="hidden sm:inline-block bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Discord & Vercel
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Wiki Stock Notifier & Vercel Cron Automation
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>รีเซ็ตถัดไป:</span>
                <span className="font-bold text-amber-300 font-mono">{countdownText}</span>
                <span className="text-zinc-500">({nextResetThai})</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-full text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Webhook:</span>
                <span className="font-semibold text-white">bloxHook</span>
              </div>
            </div>

            {/* GitHub / Deploy Direct Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('deployGuide')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>วิธีขึ้น Vercel</span>
              </button>

              <button
                onClick={() => setActiveTab('discordTest')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-xs font-semibold text-white shadow-md shadow-[#5865F2]/30 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ทดสอบส่ง</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-zinc-800/40 text-xs">
            <button
              onClick={() => setActiveTab('liveStock')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'liveStock'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <span>🍉</span>
              <span>สต็อกผลไม้สด (Live Stock)</span>
            </button>

            <button
              onClick={() => setActiveTab('discordTest')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'discordTest'
                  ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>ทดสอบแจ้งเตือน Discord</span>
            </button>

            <button
              onClick={() => setActiveTab('vercelCode')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'vercelCode'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>โค้ด TypeScript สำหรับ Vercel</span>
            </button>

            <button
              onClick={() => setActiveTab('deployGuide')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeTab === 'deployGuide'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>คู่มือติดตั้งบน Vercel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'liveStock' && (
          <LiveStockTab
            stockFruits={stockFruits}
            rotationDate={rotationDate}
            rotationTime={rotationTime}
            countdownText={countdownText}
            nextResetThai={nextResetThai}
            isLoading={isLoading}
            onRefresh={fetchStock}
            onSendDiscord={() => setActiveTab('discordTest')}
          />
        )}

        {activeTab === 'discordTest' && (
          <DiscordTestTab
            stockFruits={stockFruits}
            rotationDate={rotationDate}
            rotationTime={rotationTime}
            nextResetThai={nextResetThai}
            countdownText={countdownText}
            timestampSec={timestampSec}
          />
        )}

        {activeTab === 'vercelCode' && <VercelCodeTab />}

        {activeTab === 'deployGuide' && <DeployGuideTab />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-[#0a0b0d] py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Blox Fruits Stock Discord Notifier • ดึงข้อมูลอ้างอิงจาก{' '}
            <a
              href="https://blox-fruits.fandom.com/wiki/Blox_Fruit_Dealer"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline"
            >
              Blox Fruits Fandom Wiki
            </a>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => setActiveTab('vercelCode')}
              className="text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
            >
              ดูโค้ด TypeScript
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => setActiveTab('deployGuide')}
              className="text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
            >
              ขั้นตอนติดตั้งบน Vercel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
