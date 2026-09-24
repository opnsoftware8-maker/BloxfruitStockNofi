import React, { useState, useEffect } from 'react';
import {
  Zap,
  Power,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
  Settings,
  History,
  ShieldAlert,
  Flame,
  Globe,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  Terminal,
  GitBranch,
} from 'lucide-react';

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

interface SchedulerState {
  enabled: boolean;
  webhookUrl: string;
  mentionType: string;
  roleId: string;
  onlyHighRarity: boolean;
  customNote: string;
  parseBotEndpoint?: string;
  parseBotApiKey?: string;
  useParseBot?: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  nextResetThai: string;
  countdownText: string;
  logs: SchedulerLog[];
}

export const AutoBotTab: React.FC = () => {
  const [scheduler, setScheduler] = useState<SchedulerState>({
    enabled: true,
    webhookUrl:
      'https://discord.com/api/webhooks/1552483630645911612/FIitW2oGO7UXK_EJGR8gqwLdNzcIxbUF2hJ3exXF1aLZfgS6j2k6DS7b_ny8IAJF3RsQ',
    mentionType: 'none',
    roleId: '',
    onlyHighRarity: false,
    customNote: '🔔 บอทอัตโนมัติ Blox Fruits Dealer Stock Notifier',
    parseBotEndpoint: 'https://api.parse.bot/mcp',
    parseBotApiKey: '',
    useParseBot: false,
    lastRunAt: null,
    nextRunAt: null,
    nextResetThai: '11:00 น.',
    countdownText: 'กำลังคำนวณ...',
    logs: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // Safe JSON response parser
  const safeParse = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      if (text.toLowerCase().includes('too many') || res.status === 429) {
        return {
          success: false,
          error: '⚠️ Discord กำลังจำกัดความถี่การส่ง (Rate Limit) กรุณารอสัก 2-3 วินาทีแล้วลองใหม่ครับ',
        };
      }
      return {
        success: false,
        error: text.substring(0, 150) || 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง',
      };
    }
  };

  // Fetch scheduler status from server
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bloxfruits/scheduler');
      const data = await safeParse(res);
      if (data && data.success && data.data) {
        setScheduler(data.data);
      }
    } catch (err) {
      console.warn('Error fetching scheduler state:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toggle Auto-Scheduler
  const handleToggle = async (newEnabled: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bloxfruits/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: newEnabled,
          webhookUrl: scheduler.webhookUrl,
          mentionType: scheduler.mentionType,
          roleId: scheduler.roleId,
          onlyHighRarity: scheduler.onlyHighRarity,
          customNote: scheduler.customNote,
          parseBotEndpoint: scheduler.parseBotEndpoint,
          parseBotApiKey: scheduler.parseBotApiKey,
          useParseBot: scheduler.useParseBot,
        }),
      });
      const data = await safeParse(res);
      if (data && data.success) {
        setScheduler((prev) => ({ ...prev, enabled: newEnabled }));
        setFeedback({
          type: 'success',
          message: newEnabled
            ? '🟢 เปิดระบบส่งอัตโนมัติทุก 4 ชั่วโมงเรียบร้อยแล้ว! (บอทจะคอยจับเวลาร้านรีสต็อกตลอดเวลา)'
            : '🔴 ปิดระบบส่งอัตโนมัติชั่วคราวแล้ว',
        });
      } else {
        setFeedback({ type: 'error', message: data?.error || 'ไม่สามารถบันทึกได้' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bloxfruits/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: scheduler.enabled,
          webhookUrl: scheduler.webhookUrl,
          mentionType: scheduler.mentionType,
          roleId: scheduler.roleId,
          onlyHighRarity: scheduler.onlyHighRarity,
          customNote: scheduler.customNote,
          parseBotEndpoint: scheduler.parseBotEndpoint,
          parseBotApiKey: scheduler.parseBotApiKey,
          useParseBot: scheduler.useParseBot,
        }),
      });
      const data = await safeParse(res);
      if (data && data.success) {
        setFeedback({ type: 'success', message: '💾 บันทึกการตั้งค่าบอทและ Parse.bot MCP สำเร็จแล้ว!' });
      } else {
        setFeedback({ type: 'error', message: data?.error || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger manual test dispatch
  const handleTriggerNow = async () => {
    setIsTriggering(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/bloxfruits/scheduler/trigger', {
        method: 'POST',
      });
      const data = await safeParse(res);
      if (data && data.success) {
        setFeedback({
          type: 'success',
          message: '🚀 ส่งการแจ้งเตือนรอบนี้เข้า Discord เรียบร้อยแล้ว! (ตรวจดูใน Discord ได้ทันที)',
        });
        await fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: data?.message || data?.error || 'เกิดข้อผิดพลาดในการยิงแจ้งเตือน',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message?.includes('token')
          ? 'เซิร์ฟเวอร์กำลังรีสตาร์ทหรือมี Rate Limit กรุณารอสัก 2-3 วินาทีแล้วลองใหม่ครับ'
          : err.message,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const copyEndpointUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const currentTriggerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/bloxfruits/scheduler/trigger`
    : 'https://ais-dev-hfkquwqjxd4mbefwduiy6q-4504304529.asia-southeast1.run.app/api/bloxfruits/scheduler/trigger';

  return (
    <div className="space-y-6">
      {/* Top Banner & Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-[#181a20] to-zinc-900 border border-zinc-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  scheduler.enabled
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    scheduler.enabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                  }`}
                />
                {scheduler.enabled
                  ? '🟢 บอทอัตโนมัติเปิดทำงานอยู่ (Active 24/7)'
                  : '🔴 บอทถูกปิดการทำงานอยู่'}
              </span>

              <span className="text-xs bg-zinc-800/80 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                รอบถัดไป: {scheduler.nextResetThai} (อีก {scheduler.countdownText})
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Zap className="w-7 h-7 text-amber-400 fill-amber-400" />
              <span>ระบบส่งแจ้งเตือนอัตโนมัติทุก 4 ชั่วโมง</span>
            </h2>

            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              ผมได้สร้างระบบบอทตรวจจับเวลาสต็อกของ Blox Fruits (Dealer) อัตโนมัติให้คุณแล้ว!
              เมื่อถึงเวลาร้านรีเซ็ตทุก 4 ชั่วโมง ระบบจะดึงสต็อกสดและยิงเข้า Discord ทันทีโดยที่คุณไม่ต้องกดส่งเอง
            </p>
          </div>

          {/* Quick Actions & Master Switch */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleToggle(!scheduler.enabled)}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all cursor-pointer ${
                scheduler.enabled
                  ? 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <Power className="w-4 h-4" />
              {scheduler.enabled ? 'กดปิดบอทชั่วคราว' : 'กดเปิดบอททำงานทันที'}
            </button>

            <button
              onClick={handleTriggerNow}
              disabled={isTriggering}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-lg shadow-[#5865F2]/30 active:scale-95 transition-all cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isTriggering ? 'animate-bounce' : ''}`} />
              {isTriggering ? 'กำลังยิงเข้า Discord...' : 'ยิงส่งรอบนี้เดี๋ยวนี้ (Test)'}
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Grid: Settings & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bot Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              การตั้งค่าบอทอัตโนมัติ (Bot Preferences)
            </h3>

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Discord Webhook URL
              </label>
              <input
                type="text"
                value={scheduler.webhookUrl}
                onChange={(e) =>
                  setScheduler((prev) => ({ ...prev, webhookUrl: e.target.value }))
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Mentions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                การแท็กผู้ใช้เมื่อมีของเข้า (Pings)
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
                    onClick={() =>
                      setScheduler((prev) => ({ ...prev, mentionType: item.id }))
                    }
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                      scheduler.mentionType === item.id
                        ? 'bg-[#5865F2]/20 border-[#5865F2] text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {scheduler.mentionType === 'role' && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="ใส่ Discord Role ID เช่น 1122334455..."
                    value={scheduler.roleId}
                    onChange={(e) =>
                      setScheduler((prev) => ({ ...prev, roleId: e.target.value }))
                    }
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
                  checked={scheduler.onlyHighRarity}
                  onChange={(e) =>
                    setScheduler((prev) => ({ ...prev, onlyHighRarity: e.target.checked }))
                  }
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">
                    แจ้งเตือนเฉพาะผลระดับสูง (Mythical & Legendary)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    ถ้าไม่มีผลเทพเข้าในรอบนั้น จะซ่อนผลทั่วไป
                  </span>
                </div>
              </label>
            </div>

            {/* Custom Note */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label className="text-xs font-semibold text-zinc-300 block">
                ข้อความใต้กล่องแจ้งเตือน (Custom Footer / Note)
              </label>
              <input
                type="text"
                value={scheduler.customNote}
                onChange={(e) =>
                  setScheduler((prev) => ({ ...prev, customNote: e.target.value }))
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Parse.bot MCP Integration */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Parse.bot MCP Server API</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduler.useParseBot || false}
                    onChange={(e) =>
                      setScheduler((prev) => ({ ...prev, useParseBot: e.target.checked }))
                    }
                    className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-300 font-medium">เปิดใช้ MCP</span>
                </label>
              </div>

              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-zinc-400 font-medium">
                      MCP Endpoint URL
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">https://api.parse.bot/mcp</span>
                  </div>
                  <input
                    type="text"
                    value={scheduler.parseBotEndpoint || 'https://api.parse.bot/mcp'}
                    onChange={(e) =>
                      setScheduler((prev) => ({ ...prev, parseBotEndpoint: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-zinc-400 font-medium">
                      Parse.bot API Key (X-API-Key)
                    </label>
                    <a
                      href="https://parse.bot/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-sky-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      รับคีย์ที่ parse.bot/settings <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="ใส่ Parse.bot API Key เช่น pb_live_..."
                    value={scheduler.parseBotApiKey || ''}
                    onChange={(e) =>
                      setScheduler((prev) => ({ ...prev, parseBotApiKey: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <p className="text-[10px] text-zinc-500 leading-normal">
                  ⚡ ระบบเชื่อมต่อ Parse.bot MCP (<code className="text-emerald-400">gemini mcp add -t http parse https://api.parse.bot/mcp</code>) เพื่อดึงข้อมูลเว็บ และมีระบบ Fallback ไปที่ Blox Fruits Wiki โดยอัตโนมัติหากไม่มีคีย์
                </p>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow transition-all cursor-pointer"
            >
              💾 บันทึกการตั้งค่าบอท
            </button>
          </div>

          {/* Schedule Times Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              รอบเวลาที่ร้าน Blox Fruit Dealer รีสต็อก (เวลาไทย)
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {['03:00 น.', '07:00 น.', '11:00 น.', '15:00 น.', '19:00 น.', '23:00 น.'].map(
                (timeStr) => (
                  <div
                    key={timeStr}
                    className={`py-2 px-2 rounded-lg border font-mono font-semibold ${
                      scheduler.nextResetThai === timeStr
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {timeStr}
                    {scheduler.nextResetThai === timeStr && (
                      <span className="block text-[10px] text-amber-400 font-normal">รอบถัดไป</span>
                    )}
                  </div>
                )
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              * รีเซ็ตพร้อมกันทุกเซิร์ฟเวอร์ทั่วโลกทุก 4 ชม. ตรง (0, 4, 8, 12, 16, 20 UTC)
            </p>
          </div>
        </div>

        {/* Right Column: Execution Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                ประวัติการส่งแจ้งเตือนอัตโนมัติ (Dispatch History Logs)
              </h3>
              <button
                onClick={fetchStatus}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> รีเฟรช
              </button>
            </div>

            {scheduler.logs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl space-y-2">
                <History className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">ยังไม่มีประวัติการส่งอัตโนมัติในเซสชันนี้</p>
                <p className="text-[11px] text-zinc-500">
                  คุณสามารถกดปุ่ม "ยิงส่งรอบนี้เดี๋ยวนี้ (Test)" ด้านบนเพื่อทดสอบการบันทึกประวัติได้ทันที
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {scheduler.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-white">เวลาไทย {log.thaiTime}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {log.triggerType === 'auto-cron' ? '⏰ Auto-Cron 4h' : '🧪 Manual Test'}
                        </span>
                        {log.hasMythical && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                            🔥 Mythical Alert
                          </span>
                        )}
                      </div>

                      <p className="text-zinc-300 text-[11px]">{log.message}</p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {log.fruits.map((fName) => (
                          <span
                            key={fName}
                            className="text-[10px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300"
                          >
                            {fName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span className="text-emerald-400 font-mono text-[11px] shrink-0 font-semibold">
                      {log.status === 'success' ? '✓ สำเร็จ' : '✗ ไม่สำเร็จ'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Tutorial: How to Run 24/7 without keeping PC on */}
      <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-2xl p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
              <Zap className="w-3.5 h-3.5" /> แนะนำสำหรับการรันจริง 24 ชั่วโมง
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              วิธีทำให้ระบบส่งแจ้งเตือนทุก 4 ชม. อัตโนมัติ 100% ตลอดชีพ (ไม่ต้องเปิดเว็บหรือเปิดคอมทิ้งไว้)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              เนื่องจากเว็บบนเบราว์เซอร์จะหยุดทำงานเมื่อคุณปิดหน้าต่างหรือปิดเครื่อง ให้เลือก 1 ใน 2 วิธีด้านล่างนี้ (ฟรี 100% ตั้งค่าเพียง 1 นาที):
            </p>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{showGuide ? 'ซ่อนคู่มือ' : 'แสดงคู่มือ'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Option 1: GitHub Actions (Best & Recommended) */}
            <div className="bg-zinc-950 border border-purple-500/40 rounded-xl p-5 space-y-4 shadow-lg shadow-purple-950/20">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/30 flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" /> วิธีที่ 1 (แนะนำที่สุด)
                </span>
                <span className="text-zinc-400 font-mono text-[10px]">ไม่ต้องสมัครเว็บอื่น</span>
              </div>

              <h4 className="text-sm font-bold text-white">
                ใช้ GitHub Actions รันฟรี 24 ชม. บน Cloud
              </h4>

              <div className="space-y-2 text-zinc-300 leading-relaxed">
                <p>
                  สร้างไฟล์ <code className="text-purple-300">.github/workflows/bloxfruits-cron.yml</code> ใน GitHub ของคุณ:
                </p>

                <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg space-y-2 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>GitHub Workflow YAML</span>
                    <button
                      onClick={() =>
                        copyEndpointUrl(
                          `name: Blox Fruits 4H Auto Alert
on:
  schedule:
    - cron: '0 0,4,8,12,16,20 * * *'
  workflow_dispatch:
jobs:
  alert:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST "${currentTriggerUrl}"`
                        )
                      }
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>
                  <pre className="text-purple-200 overflow-x-auto text-[10px]">
{`on:
  schedule:
    - cron: '0 0,4,8,12,16,20 * * *'
jobs:
  alert:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST "${currentTriggerUrl}"`}
                  </pre>
                </div>
                <p className="text-[11px] text-zinc-400">
                  GitHub จะสั่งยิงตรงเข้าร้าน Blox Fruits ทุก 4 ชม. ตรงรอบรีสต็อกเป๊ะตลอด 24 ชม. แม้ปิดคอมครับ
                </p>
              </div>
            </div>

            {/* Option 2: cron-job.org */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-bold text-[11px] border border-zinc-700">
                  วิธีที่ 2 (เว็บ Cron ภายนอก)
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">cron-job.org</span>
              </div>

              <h4 className="text-sm font-bold text-white">
                ใช้ cron-job.org ยิงมาที่ Trigger URL
              </h4>

              <div className="space-y-2 text-zinc-300 leading-relaxed">
                <div>
                  1. สมัครฟรีที่{' '}
                  <a
                    href="https://cron-job.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 underline font-semibold inline-flex items-center gap-0.5"
                  >
                    cron-job.org <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  2. สร้าง Cronjob ใส่ URL:
                  <div className="flex items-center justify-between gap-1 mt-1 bg-zinc-900 p-2 rounded border border-zinc-800 font-mono text-[10px]">
                    <span className="text-emerald-400 truncate">{currentTriggerUrl}</span>
                    <button
                      onClick={() => copyEndpointUrl(currentTriggerUrl)}
                      className="text-zinc-400 hover:text-white p-1 shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div>
                  3. ตั้งเวลา <strong>Every 4 hours</strong> (หรือ 0 0,4,8,12,16,20 * * *)
                </div>
              </div>
            </div>

            {/* Option 3: Vercel Serverless Cron */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[11px] border border-indigo-500/30">
                  วิธีที่ 3 (ขึ้น Vercel)
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">Serverless</span>
              </div>

              <h4 className="text-sm font-bold text-white">
                รัน Serverless บน Vercel ผ่าน vercel.json
              </h4>

              <div className="space-y-2 text-zinc-300 leading-relaxed">
                <p>
                  ดาวน์โหลดโค้ดในแท็บ <strong>"💻 โค้ด TypeScript"</strong> แล้ว Deploy บน Vercel พร้อมไฟล์ <code className="text-amber-300">vercel.json</code> ที่มี Cron เตรียมไว้ให้แล้ว
                </p>
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded font-mono text-[10px] text-zinc-400">
                  Environment: <span className="text-amber-300">DISCORD_WEBHOOK_URL</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
