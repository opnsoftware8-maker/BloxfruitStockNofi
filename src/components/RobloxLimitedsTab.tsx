import React, { useState, useEffect } from 'react';
import { RobloxLimitedItem, DEMAND_LABELS, TREND_LABELS } from '../types/robloxLimited';
import {
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Send,
  ExternalLink,
  Flame,
  TrendingUp,
  Award,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins,
  Copy,
  Check,
  Zap,
  Power,
  Settings,
  History,
  Info,
  ChevronDown,
  Globe,
  Code2,
  BellRing,
  GitBranch,
} from 'lucide-react';

interface RobloxSchedulerLog {
  id: string;
  timestamp: string;
  thaiTime: string;
  triggerType: string;
  status: 'success' | 'error';
  itemsCount: number;
  message: string;
}

interface RobloxSchedulerState {
  enabled: boolean;
  intervalMinutes: number;
  mode: 'top-market' | 'price-drop' | 'high-demand';
  itemsCount: number;
  webhookUrl: string;
  mentionType: string;
  roleId: string;
  customNote: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  countdownText: string;
  logs: RobloxSchedulerLog[];
}

export const RobloxLimitedsTab: React.FC = () => {
  const [items, setItems] = useState<RobloxLimitedItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDemand, setSelectedDemand] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'value' | 'rap' | 'demand' | 'name'>('value');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [customNote, setCustomNote] = useState('');

  // Auto-Scheduler State
  const [scheduler, setScheduler] = useState<RobloxSchedulerState>({
    enabled: true,
    intervalMinutes: 15,
    mode: 'top-market',
    itemsCount: 5,
    webhookUrl: '',
    mentionType: 'none',
    roleId: '',
    customNote: '⚡ บอทแจ้งเตือนอัตโนมัติ Roblox Limited Catalog Watcher',
    lastRunAt: null,
    nextRunAt: null,
    countdownText: '15:00',
    logs: [],
  });

  const [isSchedulerLoading, setIsSchedulerLoading] = useState(false);
  const [isTriggeringAuto, setIsTriggeringAuto] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'github' | 'dual-bot' | 'server' | 'cronjob'>('github');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Fetch Items
  const fetchLimiteds = async (force = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/roblox/limiteds?force=${force}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setTotalCount(data.totalItems || 0);
        setUpdatedAt(data.updatedAt || new Date().toISOString());
      }
    } catch (err: any) {
      console.error('Failed to fetch limiteds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Scheduler Status
  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch('/api/roblox/scheduler');
      const data = await res.json();
      if (data.success && data.data) {
        setScheduler(data.data);
      }
    } catch (err) {
      console.warn('Error fetching roblox scheduler state:', err);
    }
  };

  useEffect(() => {
    fetchLimiteds();
    fetchSchedulerStatus();
    const interval = setInterval(fetchSchedulerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectTop5 = () => {
    const top5Ids = filteredItems.slice(0, 5).map((i) => i.id);
    setSelectedItemIds(top5Ids);
  };

  // Manual Instant Dispatch
  const handleSendDiscord = async () => {
    setIsSendingAlert(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/roblox/limiteds/send-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: selectedItemIds.length > 0 ? selectedItemIds : items.slice(0, 5).map((i) => i.id),
          customNote,
          webhookUrl: scheduler.webhookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || 'ส่งแจ้งเตือนเข้า Discord สำเร็จแล้ว!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'ส่งแจ้งเตือนไม่สำเร็จ',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error' });
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Toggle Auto Scheduler Switch
  const handleToggleScheduler = async (newEnabled: boolean) => {
    setIsSchedulerLoading(true);
    try {
      const res = await fetch('/api/roblox/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: newEnabled,
          intervalMinutes: scheduler.intervalMinutes,
          mode: scheduler.mode,
          itemsCount: scheduler.itemsCount,
          webhookUrl: scheduler.webhookUrl,
          mentionType: scheduler.mentionType,
          roleId: scheduler.roleId,
          customNote: scheduler.customNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScheduler((prev) => ({ ...prev, enabled: newEnabled }));
        setFeedback({
          type: 'success',
          message: newEnabled
            ? `🟢 เปิดระบบส่งอัตโนมัติสำเร็จ! (บอทจะเช็คและส่งแจ้งเตือนทุกๆ ${scheduler.intervalMinutes} นาที)`
            : '🔴 ปิดระบบส่งอัตโนมัติชั่วคราวแล้ว',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSchedulerLoading(false);
    }
  };

  // Save Scheduler Settings
  const handleSaveSchedulerSettings = async () => {
    setIsSchedulerLoading(true);
    try {
      const res = await fetch('/api/roblox/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduler),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: '💾 บันทึกการตั้งค่าบอทอัตโนมัติเรียบร้อยแล้ว!' });
        setShowConfigModal(false);
      } else {
        setFeedback({ type: 'error', message: data.error || 'บันทึกไม่สำเร็จ' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSchedulerLoading(false);
    }
  };

  // Trigger Instant Auto-Run Test
  const handleTriggerAutoTest = async () => {
    setIsTriggeringAuto(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/roblox/scheduler/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: '🚀 จำลองส่งรอบอัตโนมัติเข้า Discord สำเร็จแล้ว! กรุณาเช็คในดิสคอร์ดของคุณ',
        });
        await fetchSchedulerStatus();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || data.error || 'เกิดข้อผิดพลาดในการยิงแจ้งเตือน',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsTriggeringAuto(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-hfkquwqjxd4mbefwduiy6q-4504304529.asia-southeast1.run.app';
  const cronTriggerUrl = `${originUrl}/api/roblox/cron`;

  // Filter & Sort
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.id).includes(searchQuery);
      const matchesDemand =
        selectedDemand === 'All' ||
        (selectedDemand === 'high' && item.demand >= 3) ||
        (selectedDemand === 'normal' && item.demand === 2) ||
        (selectedDemand === 'low' && item.demand <= 1);
      return matchesSearch && matchesDemand;
    })
    .sort((a, b) => {
      if (sortBy === 'value') {
        const valA = a.value > 0 ? a.value : a.rap;
        const valB = b.value > 0 ? b.value : b.rap;
        return valB - valA;
      }
      if (sortBy === 'rap') return b.rap - a.rap;
      if (sortBy === 'demand') return b.demand - a.demand;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const totalMarketCap = items.slice(0, 50).reduce((acc, curr) => acc + (curr.value > 0 ? curr.value : curr.rap), 0);

  return (
    <div className="space-y-6">
      {/* 24/7 Automation Control Center Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950 via-zinc-900 to-indigo-950 border border-sky-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    scheduler.enabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      scheduler.enabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                    }`}
                  />
                  {scheduler.enabled
                    ? '🟢 บอทอัตโนมัติเปิดทำงานอยู่ (24/7 Live Engine)'
                    : '🔴 บอทอัตโนมัติถูกปิดอยู่'}
                </span>

                <span className="text-xs bg-zinc-800/80 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>ตรวจจับรอบถัดไปในอีก:</span>
                  <span className="font-bold text-sky-300 font-mono">{scheduler.countdownText}</span>
                  <span className="text-zinc-500">(ทุกๆ {scheduler.intervalMinutes} นาที)</span>
                </span>

                <span className="text-xs bg-zinc-800/80 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">
                  สต็อกแคตตาล็อก {totalCount.toLocaleString()} ไอเทม (Official API)
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>💎 ระบบบอทแคตตาล็อกลิมิเต็ด Roblox ทำงานอัตโนมัติ 24 ชม.</span>
              </h2>

              <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
                บอทจะคอยจับตาดูราคาสินค้า, มูลค่าเทรด (Value), และของหลุดราคาถูกจาก Rolimons & Roblox Catalog API ตลอด 24 ชม.
                แล้วยิงแจ้งเตือนเข้า Discord Webhook ให้ทันทีโดยที่คุณไม่ต้องเปิดหน้าเว็บทิ้งไว้!
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleToggleScheduler(!scheduler.enabled)}
                disabled={isSchedulerLoading}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-xl transition-all cursor-pointer ${
                  scheduler.enabled
                    ? 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{scheduler.enabled ? 'ปิดบอทชั่วคราว' : 'เปิดบอททำงานอัตโนมัติ'}</span>
              </button>

              <button
                onClick={handleTriggerAutoTest}
                disabled={isTriggeringAuto}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-lg shadow-[#5865F2]/30 active:scale-95 transition-all cursor-pointer"
              >
                <Send className={`w-4 h-4 ${isTriggeringAuto ? 'animate-bounce' : ''}`} />
                <span>{isTriggeringAuto ? 'กำลังยิง...' : 'ยิงรอบนี้ทันที (Test)'}</span>
              </button>

              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                title="ตั้งค่าความถี่และโหมดของบอท"
              >
                <Settings className="w-4 h-4 text-sky-400" />
                <span>ตั้งค่าบอท</span>
              </button>

              <button
                onClick={() => {
                  setGuideTab('github');
                  setShowGuideModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/45 text-purple-200 font-bold text-xs border border-purple-500/50 shadow-lg shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <GitBranch className="w-4 h-4 text-purple-300" />
                <span>GitHub Actions (ฟรี 24 ชม.)</span>
              </button>

              <button
                onClick={() => {
                  setGuideTab('server');
                  setShowGuideModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4 text-amber-400" />
                <span>วิธีรัน 24 ชม. ทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Settings & Mode Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
            <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 block text-[11px]">โหมดการแจ้งเตือน</span>
              <span className="text-sky-300 font-bold text-sm mt-0.5 block truncate">
                {scheduler.mode === 'top-market' && '💎 สรุปสถิติตลาดสด Top Market'}
                {scheduler.mode === 'price-drop' && '🚨 ดักจับราคาหลุด / ราคาดิ่ง (Sniper)'}
                {scheduler.mode === 'high-demand' && '🔥 เฉพาะไอเทมดีมานด์สูง High/Amazing'}
              </span>
            </div>

            <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 block text-[11px]">ความถี่ในการตรวจจับ</span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
                ทุกๆ {scheduler.intervalMinutes} นาที (ส่งรอบละ {scheduler.itemsCount} ไอเทม)
              </span>
            </div>

            <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 block text-[11px]">Discord Webhook</span>
              <span className="text-zinc-200 font-mono text-xs mt-0.5 block truncate">
                {scheduler.webhookUrl ? 'กำหนดไว้เรียบร้อย' : 'bloxHook (ค่าเริ่มต้นพร้อมใช้)'}
              </span>
            </div>

            <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-400 block text-[11px]">รอบส่งล่าสุด</span>
              <span className="text-amber-300 font-mono text-xs mt-0.5 block truncate">
                {scheduler.lastRunAt
                  ? new Date(scheduler.lastRunAt).toLocaleTimeString('th-TH')
                  : 'พร้อมส่งในรอบแรก'}
              </span>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium animate-fadeIn ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="flex-1">{feedback.message}</span>
              <button
                onClick={() => setFeedback(null)}
                className="text-zinc-400 hover:text-white px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Run Logs Accordion */}
      {scheduler.logs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                ประวัติการส่งแจ้งเตือนอัตโนมัติล่าสุด ({scheduler.logs.length} ครั้ง)
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">บันทึกอัตโนมัติจาก Server</span>
          </div>

          <div className="divide-y divide-zinc-800/80 max-h-48 overflow-y-auto pr-1 text-xs">
            {scheduler.logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span className="font-mono text-zinc-400">{log.thaiTime}</span>
                  <span className="text-white font-medium">{log.message}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">
                    {log.triggerType}
                  </span>
                  <span>{log.itemsCount} ไอเทม</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Selection & Search Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อไอเทม เช่น Dominus, Valkyrie, Fedora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Demand filter */}
            <select
              value={selectedDemand}
              onChange={(e) => setSelectedDemand(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">ความต้องการทั้งหมด</option>
              <option value="high">🔥 สูง & ยอดนิยมสูงสุด (High/Amazing)</option>
              <option value="normal">ปานกลาง (Normal)</option>
              <option value="low">ต่ำ (Low/Terrible)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="value">เรียงตาม มูลค่าเทรด (Value)</option>
              <option value="rap">เรียงตาม ราคาเฉลี่ย (RAP)</option>
              <option value="demand">เรียงตาม ความต้องการ (Demand)</option>
              <option value="name">เรียงตาม ชื่อ (A-Z)</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => fetchLimiteds(true)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="ดึงข้อมูลสดจาก Roblox"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">เลือกด่วนสำหรับส่ง Discord:</span>
            <button
              onClick={selectTop5}
              className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30 transition-colors cursor-pointer"
            >
              เลือก Top 5 ประจำวัน
            </button>

            {selectedItemIds.length > 0 && (
              <button
                onClick={() => setSelectedItemIds([])}
                className="px-2.5 py-1 text-zinc-400 hover:text-rose-400 text-xs underline cursor-pointer"
              >
                ล้างที่เลือก ({selectedItemIds.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendDiscord}
              disabled={isSendingAlert}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold shadow-md shadow-[#5865F2]/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {selectedItemIds.length > 0
                  ? `ส่ง ${selectedItemIds.length} ไอเทมที่เลือกเข้า Discord ทันที`
                  : 'ส่ง Top 5 ไอเทมเข้า Discord ทันที'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Note to Discord */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3 text-xs">
        <span className="text-zinc-400 font-medium shrink-0">📝 ข้อความเสริมสำหรับแจ้งเตือนรอบนี้:</span>
        <input
          type="text"
          placeholder="พิมพ์ข้อความแท็ก เช่น 'เช็คด่วน! ของลิมิเต็ดราคาขยับ' (ไม่บังคับ)"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="p-16 text-center border border-zinc-800 rounded-2xl bg-zinc-900/40 space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">กำลังดึงข้อมูลแคตตาล็อกลิมิเต็ดสดจาก Roblox...</p>
          <p className="text-xs text-zinc-500">ตรวจสอบราคา RAP และสถานะการเทรดแบบเรียลไทม์</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl space-y-2">
          <Search className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-300">ไม่พบไอเทมที่ตรงกับคำค้นหา "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.slice(0, 60).map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const displayVal = item.value > 0 ? `R$ ${item.value.toLocaleString()}` : `R$ ${item.rap.toLocaleString()}`;
            const demandInfo = DEMAND_LABELS[item.demand] || DEMAND_LABELS[-1];
            const trendInfo = TREND_LABELS[item.trend] || TREND_LABELS[-1];

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`relative rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/30'
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                {/* Selection Checkmark */}
                <div className="absolute top-3 right-3 z-20">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-sky-500 border-sky-400 text-zinc-950'
                        : 'bg-zinc-950/80 border-zinc-700 text-transparent group-hover:border-zinc-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                {/* Card Top: Image & Header */}
                <div className="p-4 space-y-3">
                  <div className="relative aspect-square w-full rounded-xl bg-zinc-950 border border-zinc-800/60 flex items-center justify-center overflow-hidden p-2">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-zinc-600 font-mono text-xs">Roblox Asset #{item.id}</div>
                    )}

                    {/* Acronym / ID Badge */}
                    {item.acronym && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[10px] font-mono text-zinc-300 font-bold">
                        {item.acronym}
                      </span>
                    )}

                    {item.projected === 1 && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                        ⚠️ Projected
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-sky-300 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-[11px] text-zinc-500 font-mono">ID: {item.id}</div>
                  </div>

                  {/* Pricing Info */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">มูลค่าเทรด (Value):</span>
                      <span className="font-bold text-amber-400 font-mono">{displayVal}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">ราคาเฉลี่ย (RAP):</span>
                      <span className="font-semibold text-zinc-200 font-mono">
                        R$ {item.rap.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/60">
                      <span className="text-zinc-500">ความต้องการ:</span>
                      <span className={`font-medium ${demandInfo.color}`}>{demandInfo.label}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">แนวโน้ม:</span>
                      <span className={`font-medium ${trendInfo.color}`}>{trendInfo.label}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: External Links */}
                <div className="p-3 bg-zinc-950/60 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                  <a
                    href={`https://www.roblox.com/catalog/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-white flex items-center gap-1"
                  >
                    <span>Roblox</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={`https://www.rolimons.com/item/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-sky-400 flex items-center gap-1 font-medium"
                  >
                    <span>กราฟ Rolimons</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">ตั้งค่าระบบบอทอัตโนมัติ (Roblox Limiteds)</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  ความถี่ในการตรวจจับและส่งแจ้งเตือน:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setScheduler((prev) => ({ ...prev, intervalMinutes: mins }))}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        scheduler.intervalMinutes === mins
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      ทุก {mins} นาที
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">โหมดการตรวจจับ:</label>
                <select
                  value={scheduler.mode}
                  onChange={(e) => setScheduler((prev) => ({ ...prev, mode: e.target.value as any }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="top-market">💎 สรุปสถิติตลาดสด Top Market (ยอดนิยมสูงสุด)</option>
                  <option value="price-drop">🚨 ดักจับราคาหลุด / ราคาดิ่ง (Price Drop Sniper)</option>
                  <option value="high-demand">🔥 เฉพาะไอเทมดีมานด์สูง (High & Amazing Demand)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  จำนวนไอเทมที่ส่งต่อรอบ:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setScheduler((prev) => ({ ...prev, itemsCount: num }))}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        scheduler.itemsCount === num
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      Top {num} ไอเทม
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">การแท็กแจ้งเตือน (Mention):</label>
                <select
                  value={scheduler.mentionType}
                  onChange={(e) => setScheduler((prev) => ({ ...prev, mentionType: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="none">ไม่แท็กใคร (Silent)</option>
                  <option value="@everyone">แท็ก @everyone</option>
                  <option value="@here">แท็ก @here</option>
                  <option value="role">แท็ก Role ID</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Discord Webhook URL:</label>
                <input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={scheduler.webhookUrl}
                  onChange={(e) => setScheduler((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">ข้อความปิดท้ายแจ้งเตือน:</label>
                <input
                  type="text"
                  value={scheduler.customNote}
                  onChange={(e) => setScheduler((prev) => ({ ...prev, customNote: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveSchedulerSettings}
                disabled={isSchedulerLoading}
                className="px-5 py-2 rounded-xl bg-sky-500 text-zinc-950 font-bold text-xs hover:bg-sky-400 shadow-md shadow-sky-500/20 cursor-pointer"
              >
                {isSchedulerLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal: How Automation Works 24/7 */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    🤖 วิธีตั้งค่าบอทอัตโนมัติ 24 ชม. (ใช้ GitHub Actions แทน cron-job ได้ 100%)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    ไม่ต้องสมัครเว็บอื่นให้ยุ่งยาก รันฟรีบนคลาวด์ของ GitHub ปิดคอมแล้วก็ยังแจ้งเตือนตลอดเวลา
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <button
                type="button"
                onClick={() => setGuideTab('github')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  guideTab === 'github'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-purple-300" />
                <span>🐙 GitHub Actions (แนะนำอันดับ 1)</span>
              </button>

              <button
                type="button"
                onClick={() => setGuideTab('server')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  guideTab === 'server'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-sky-300" />
                <span>⚡ ตัวเซิร์ฟเวอร์ในตัว (รันตรงนี้)</span>
              </button>

              <button
                type="button"
                onClick={() => setGuideTab('cronjob')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  guideTab === 'cronjob'
                    ? 'bg-zinc-700 text-white shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span>🌐 cron-job.org (ทางเลือกเสริม)</span>
              </button>
            </div>

            {/* TAB CONTENT: GITHUB ACTIONS */}
            {guideTab === 'github' && (
              <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                      ✓ ตอบคำถาม: ใช้แทนได้ 100% และดีกว่ามาก!
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      ไม่ต้องสมัครเว็บแปลกๆ ฟรี 24 ชั่วโมง
                    </span>
                  </div>
                  <p className="text-xs text-purple-200">
                    GitHub Actions คือระบบ Automation ของ Microsoft/GitHub ที่มีเซิร์ฟเวอร์รันโค้ดให้อัตโนมัติตลอดเวลา
                    สามารถตั้งเวลาให้ดึงราคา Roblox Limiteds แล้วยิงเข้า Discord ทุกๆ 15 นาที โดยที่คุณไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้เลยครับ
                  </p>
                </div>

                {/* 3 Steps Guide */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>3 ขั้นตอนง่ายๆ ในการเริ่มใช้งาน:</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                        1
                      </div>
                      <div className="font-bold text-white">เปิด GitHub Repo</div>
                      <p className="text-[11px] text-zinc-400">
                        ไปที่ GitHub ของคุณ (หรือสร้าง New Repository ฟรี)
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                        2
                      </div>
                      <div className="font-bold text-white">สร้างไฟล์ Workflow</div>
                      <p className="text-[11px] text-zinc-400">
                        สร้างโฟลเดอร์ <code className="text-purple-300">.github/workflows/</code> และสร้างไฟล์ชื่อ <code className="text-purple-300">roblox-auto-bot.yml</code>
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                        3
                      </div>
                      <div className="font-bold text-white">วางโค้ด & รันอัตโนมัติ</div>
                      <p className="text-[11px] text-zinc-400">
                        ก๊อปปี้โค้ดด้านล่างไปวาง แล้วกด Commit เท่านี้บอทก็เริ่มทำงานอัตโนมัติทุก 15 นาทีทันที!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workflow Code Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-sky-400" />
                      <span>โค้ดไฟล์ .github/workflows/roblox-auto-bot.yml</span>
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `name: Roblox Limiteds & Stock 24/7 Auto Alert (GitHub Actions)

on:
  schedule:
    # Run automatically every 15 minutes (24/7 Free)
    - cron: '*/15 * * * *'
  workflow_dispatch: # Allows manual trigger directly from GitHub UI

jobs:
  roblox-stock-alert:
    name: Fetch & Send Roblox Stock to Discord
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Roblox Auto Bot
        run: |
          echo "🚀 Triggering Roblox Limiteds Auto Bot at $(date)..."
          curl -s -X POST "${cronTriggerUrl}" \\
            -H "Content-Type: application/json" \\
            -d '{"source": "github-actions"}'
`,
                          'workflowYaml'
                        )
                      }
                      className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 flex items-center gap-1 text-xs cursor-pointer font-bold"
                    >
                      {copiedText === 'workflowYaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'workflowYaml' ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด YAML'}</span>
                    </button>
                  </div>

                  <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-purple-200 overflow-x-auto max-h-56 leading-relaxed">
{`name: Roblox Limiteds & Stock 24/7 Auto Alert (GitHub Actions)

on:
  schedule:
    # รันอัตโนมัติทุกๆ 15 นาทีตลอด 24 ชั่วโมง
    - cron: '*/15 * * * *'
  workflow_dispatch: # ปุ่มกดรันด้วยมือใน GitHub Actions เพื่อทดสอบได้ทันที

jobs:
  roblox-stock-alert:
    name: Fetch & Send Roblox Stock to Discord
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Roblox Auto Bot
        run: |
          echo "🚀 Triggering Roblox Limiteds Auto Bot at $(date)..."
          curl -s -X POST "${cronTriggerUrl}" \\
            -H "Content-Type: application/json" \\
            -d '{"source": "github-actions"}'`}
                  </pre>
                </div>

                {/* Standalone Script Option */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>ตัวเลือกเสริมพิเศษ: สคริปต์ Standalone (ไม่ต้องพึ่งเซิร์ฟเวอร์ใดๆ)</span>
                      </h5>
                      <p className="text-[11px] text-zinc-400">
                        ในโปรเจกต์นี้มีไฟล์ <code className="text-amber-300">scripts/roblox-cron.mjs</code> ให้แล้ว ซึ่งสามารถรันผ่าน GitHub Actions ยิงตรงเข้า Discord Webhook ได้เลย 100% แม้เว็บนี้จะดับไป!
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `node scripts/roblox-cron.mjs`,
                          'standaloneCmd'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      {copiedText === 'standaloneCmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>คัดลอกคำสั่งรัน</span>
                    </button>
                  </div>
                </div>

                {/* Test Trigger Button */}
                <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="space-y-0.5">
                    <span className="text-zinc-200 font-bold block">ทดสอบยิงดูข้อความจริงใน Discord ตอนนี้</span>
                    <span className="text-zinc-400 text-[11px]">
                      กดปุ่มนี้เพื่อส่งตัวอย่างข้อความลิมิเต็ด Roblox เข้า Discord ทันที
                    </span>
                  </div>
                  <button
                    onClick={handleTriggerAutoTest}
                    disabled={isTriggeringAuto}
                    className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#5865F2]/20 cursor-pointer shrink-0"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTriggeringAuto ? 'animate-bounce' : ''}`} />
                    <span>{isTriggeringAuto ? 'กำลังส่ง...' : 'ทดสอบยิงทันที'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SERVER BUILT-IN */}
            {guideTab === 'server' && (
              <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    รันในตัวเซิร์ฟเวอร์นี้ (เปิดใช้งานได้ในคลิกเดียว)
                  </h4>
                  <p>
                    ระบบนี้มี <strong>Node.js Interval Engine</strong> ทำงานอยู่เบื้องหลัง เพียงกดปุ่มสีเขียว <strong>"เปิดบอททำงานอัตโนมัติ"</strong> บนหน้าเว็บนี้
                    เซิร์ฟเวอร์จะคอยดึงสต็อกและยิงแจ้งเตือนเข้า Discord ทุกๆ {scheduler.intervalMinutes} นาทีให้อัตโนมัติทันที
                  </p>
                  <p className="text-[11px] text-sky-200/80">
                    💡 หมายเหตุ: หากไม่มีคนเข้าเว็บเลยเป็นเวลาหลายชั่วโมง เซิร์ฟเวอร์ Cloud Run อาจเข้าโหมดสแตนด์บายประหยัดพลังงาน แนะนำให้ใช้ GitHub Actions ร่วมด้วยเพื่อความเสถียรสูงสุดครับ
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CRON-JOB.ORG */}
            {guideTab === 'cronjob' && (
              <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    ใช้ cron-job.org หรือ UptimeRobot ยิงปลุกอัตโนมัติ
                  </h4>
                  <p>
                    ถ้าต้องการใช้ cron-job.org ให้นำ URL ด้านล่างนี้ไปกรอกในช่อง URL to call แล้วตั้งเวลายิงทุกๆ 15 นาที:
                  </p>
                  <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between font-mono text-[11px] text-zinc-300">
                    <span className="truncate pr-2">{cronTriggerUrl}</span>
                    <button
                      onClick={() => copyToClipboard(cronTriggerUrl, 'cronUrl')}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-sans shrink-0 cursor-pointer"
                    >
                      {copiedText === 'cronUrl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'cronUrl' ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-500">
                🚀 โค้ดทั้งหมดพร้อมใช้งานแล้วใน Repository นี้
              </span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 cursor-pointer"
              >
                เข้าใจแล้ว ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
