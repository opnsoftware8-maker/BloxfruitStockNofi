import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Zap,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Flame,
  Award,
  Settings,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Eye,
  EyeOff,
  Radio,
  Power,
  KeyRound,
  Link as LinkIcon,
} from 'lucide-react';

const DEFAULT_AI_WEBHOOK =
  'https://discord.com/api/webhooks/1552857116002484336/bAnDAEL79Vu7bVet-d-uxSGEogcvClHdwZYUkxdQanYtuwjyYndQldKrwo1wqYp-uiMb';

interface GeminiQAItem {
  id: string;
  timestamp: string;
  thaiTime: string;
  question: string;
  answer: string;
  questioner: string;
  persona: string;
  status: 'sent' | 'failed' | 'generated_only';
  error?: string;
}

interface LiveBotStatus {
  isRunning: boolean;
  botInfo: {
    id: string;
    tag: string;
    username: string;
    avatar: string | null;
    guildsCount: number;
    guildNames: string[];
    startedAt: string;
  } | null;
  hasSavedToken: boolean;
  savedTokenMasked: string;
}

export function GeminiBotTab() {
  const [subTab, setSubTab] = useState<'control' | 'tagGuide' | 'autoScheduler' | 'history'>('tagGuide');

  // Input states
  const [question, setQuestion] = useState('');
  const [questioner, setQuestioner] = useState('@สมาชิกในกลุ่ม');
  const [persona, setPersona] = useState<'roblox-expert' | 'trade-master' | 'friendly-helper' | 'custom'>('roblox-expert');
  const [customInstruction, setCustomInstruction] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_AI_WEBHOOK);
  const [botName, setBotName] = useState('Gemini AI Assistant | ผู้ช่วยประจำกลุ่ม');

  // Live Bot states
  const [liveBot, setLiveBot] = useState<LiveBotStatus | null>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Generation states
  const [isLoading, setIsLoading] = useState(false);
  const [previewAnswer, setPreviewAnswer] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // History & Scheduler
  const [history, setHistory] = useState<GeminiQAItem[]>([]);
  const [autoTipsEnabled, setAutoTipsEnabled] = useState(false);
  const [autoTipsInterval, setAutoTipsInterval] = useState(4);
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick preset questions
  const quickPrompts = [
    {
      title: '🍉 ผลฟาร์มเลเวลที่ดีที่สุด',
      query: 'สำหรับผู้เล่นใหม่ใน Blox Fruits ผลปีศาจไหนดีที่สุดสำหรับใช้ฟาร์มเลเวลในทะเล 1 และทะเล 2 พร้อมบอกเหตุผลและสเตตัสที่ควรอัป',
      persona: 'roblox-expert' as const,
    },
    {
      title: '⚖️ วิเคราะห์การเทรด Kitsune vs Dragon',
      query: 'วิเคราะห์การเทรด: มีคนเอา Kitsune มาขอแลก Dragon + Dough ถือว่า Win หรือ Lose (W/F/L)? ฝั่งไหนคุ้มกว่ากัน?',
      persona: 'trade-master' as const,
    },
    {
      title: '⚡ วิธีทำผลตื่น (Awakening)',
      query: 'อธิบายขั้นตอนการลงดันเจี้ยนเรด (Raid) เพื่อปลุกพลังผลตื่นใน Blox Fruits ต้องมีเลเวลเท่าไหร่ ใช้ Fragment อย่างไร?',
      persona: 'roblox-expert' as const,
    },
    {
      title: '💎 เทคนิคเก็งกำไร Limited Roblox',
      query: 'แนะนำวิธีการดูค่า RAP และ Demand ของไอเทม Limited ใน Roblox สังเกตอย่างไรว่าไอเทมชิ้นไหนมีโอกาสราคาพุ่งขึ้น?',
      persona: 'trade-master' as const,
    },
    {
      title: '🗡️ แนะนำดาบสุดแกร่ง',
      query: 'ดาบ True Triple Katana (TTK) กับ Cursed Dual Katana (CDK) อันไหนดีกว่ากัน และทำยากง่ายต่างกันยังไง?',
      persona: 'roblox-expert' as const,
    },
  ];

  // Fetch config and history from server
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      if (data.success && data.data) {
        setWebhookUrl(data.data.webhookUrl || DEFAULT_AI_WEBHOOK);
        setBotName(data.data.botName || 'Gemini AI Assistant');
        setAutoTipsEnabled(!!data.data.autoTipsEnabled);
        setAutoTipsInterval(data.data.autoTipsIntervalHours || 4);
        setHistory(data.data.history || []);
      }
    } catch (err) {
      console.warn('Failed to load AI bot config:', err);
    }
  };

  const fetchBotStatus = async () => {
    try {
      const res = await fetch('/api/ai/bot/status');
      const data = await res.json();
      if (data.success) {
        setLiveBot(data);
        if (data.botInfo?.id && !clientIdInput) {
          setClientIdInput(data.botInfo.id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live bot status:', err);
    }
  };

  const handleStartBot = async () => {
    if (!botTokenInput.trim() && !liveBot?.hasSavedToken) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอก Discord Bot Token ก่อนกดเริ่ม' });
      return;
    }
    setIsBotLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/ai/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botTokenInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `🎉 บอทออนไลน์แล้วในชื่อ "${data.botInfo?.tag || 'Discord Bot'}"! ตอนนี้คนในกลุ่มพิมพ์แท็ก @${data.botInfo?.username || 'บอท'} หรือ !ask ถามได้ทันที!`,
        });
        setBotTokenInput('');
        fetchBotStatus();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'ไม่สามารถเชื่อมต่อ Discord Bot ได้' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setIsBotLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsBotLoading(true);
    try {
      const res = await fetch('/api/ai/bot/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'หยุดการทำงานของบอท Discord แล้ว' });
        fetchBotStatus();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsBotLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAskOnly = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          persona,
          customInstruction: persona === 'custom' ? customInstruction : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setPreviewAnswer(data.answer);
        setStatusMessage({ type: 'success', text: 'Gemini AI สร้างคำตอบสำเร็จแล้ว! ตรวจดูตัวอย่างด้านล่างได้เลย' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'ไม่สามารถสร้างคำตอบได้' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAndSend = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);
    const personaLabels: Record<string, string> = {
      'roblox-expert': 'เซียน Roblox & Blox Fruits',
      'trade-master': 'ปรมาจารย์ด้านการเทรด W/F/L',
      'friendly-helper': 'ผู้ช่วยใจดีประจำดิสคอร์ด',
      'custom': 'กำหนดบุคลิกภาพเอง',
    };

    try {
      const res = await fetch('/api/ai/ask-and-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          questioner: questioner.trim() || 'สมาชิกในกลุ่ม',
          persona,
          personaLabel: personaLabels[persona] || 'ผู้เชี่ยวชาญ AI',
          customInstruction: persona === 'custom' ? customInstruction : undefined,
          webhookUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `🎉 ส่งคำตอบจาก Gemini AI ไปยังช่องดิสคอร์ดผ่าน Webhook บอทตัวใหม่เรียบร้อยแล้ว!`,
        });
        if (data.data?.answer) {
          setPreviewAnswer(data.data.answer);
        }
        fetchConfig();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการส่ง' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerTip = async (category: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/ai/trigger-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'ยิงส่งเกร็ดความรู้ AI พิเศษเข้า Discord สำเร็จ!' });
        if (data.tip) setPreviewAnswer(data.tip);
        fetchConfig();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          botName,
          autoTipsEnabled,
          autoTipsIntervalHours: autoTipsInterval,
          defaultPersona: persona,
          customInstruction,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'บันทึกการตั้งค่าบอท Gemini AI เรียบร้อยแล้ว' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/80 via-purple-900/60 to-indigo-950/80 border border-violet-700/40 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Gemini 3.8 Flash • บอทผู้ช่วยประจำกลุ่ม
              </span>
              {liveBot?.isRunning ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  🟢 Discord Bot: ออนไลน์ ({liveBot.botInfo?.tag || 'Connected'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Discord Bot: รอใส่ Token เพื่อเปิดออนไลน์
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🤖 ศูนย์ควบคุมบอทผู้ช่วย Discord & Gemini AI</span>
            </h2>
            <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
              ตอบคำถามสมาชิกใน Discord ทั้งเรื่องผลปีศาจ Blox Fruits, สเตตัส, ดันเจี้ยนเรด, การวิเคราะห์เทรด W/F/L และราคาไอเทม Limited Roblox! สามารถให้สมาชิกพิมพ์ <code className="text-amber-300 font-semibold">@บอท คำถาม</code> หรือส่งผ่าน Webhook ได้ทันที
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setSubTab('tagGuide')}
              className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                liveBot?.isRunning
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-amber-500/30'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{liveBot?.isRunning ? 'จัดการบอทออนไลน์' : '🔑 ใส่ Token เพื่อเปิดบอทออนไลน์'}</span>
            </button>
          </div>
        </div>

        {/* Webhook Connection Pill */}
        <div className="mt-4 pt-4 border-t border-violet-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="text-zinc-400">Webhook ปัจจุบัน:</span>
            <code className="px-2.5 py-1 bg-black/40 border border-violet-500/20 rounded font-mono text-[11px] text-violet-300 truncate max-w-xs sm:max-w-md">
              {webhookUrl}
            </code>
          </div>
          <button
            onClick={() => setSubTab('autoScheduler')}
            className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>ตั้งเวลาให้ AI ส่งเกร็ดความรู้อัตโนมัติ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-800 pb-2">
        <button
          onClick={() => setSubTab('tagGuide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'tagGuide'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md shadow-amber-500/25 font-black'
              : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>🔑 ได้โทเคนแล้วทำอะไรต่อ & เปิดบอทออนไลน์</span>
          {liveBot?.isRunning && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          )}
        </button>

        <button
          onClick={() => setSubTab('control')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'control'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>🎮 กล่องสั่งถาม-ตอบ (ผ่าน Webhook)</span>
        </button>

        <button
          onClick={() => setSubTab('autoScheduler')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'autoScheduler'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>⏰ ส่งเกร็ดความรู้ AI อัตโนมัติ 24 ชม.</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'history'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>📜 ประวัติการตอบ ({history.length})</span>
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subtab 1: Command Center (Control) */}
      {subTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form & Quick Buttons (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                <span>พิมพ์คำถามที่ต้องการให้ Gemini AI ตอบ</span>
              </h3>

              {/* Questioner & Persona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                    👤 ผู้ถามในดิสคอร์ด (จะถูกกล่าวถึงใน Embed)
                  </label>
                  <input
                    type="text"
                    value={questioner}
                    onChange={(e) => setQuestioner(e.target.value)}
                    placeholder="เช่น @Boss, น้องเกมเมอร์ หรือไอดี <@123...>"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                    🧠 บุคลิกภาพ AI (Persona)
                  </label>
                  <select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="roblox-expert">👑 เซียน Blox Fruits & Roblox</option>
                    <option value="trade-master">⚖️ ปรมาจารย์เทรดดิ้ง (W/F/L)</option>
                    <option value="friendly-helper">🤝 ผู้ช่วยใจดี อธิบายมือใหม่</option>
                    <option value="custom">⚙️ กำหนด System Prompt เอง</option>
                  </select>
                </div>
              </div>

              {persona === 'custom' && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                    ⚙️ กำหนดคำสั่งควบคุมนิสัย AI (System Instruction)
                  </label>
                  <textarea
                    rows={2}
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="เช่น คุณคือผู้ช่วยสอนเล่น Blox Fruits ตอบสั้น กระชับ แนะนำดาบและจุดฟาร์ม..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              {/* Main Question Textarea */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  ❓ คำถามที่ต้องการให้บอทตอบ
                </label>
                <textarea
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="พิมพ์คำถามได้ตามต้องการ เช่น: ผล Dough กับ Dragon อันไหนดีกว่ากันสำหรับการลง PvP และแนะนำการอัปสเตตัสหน่อยครับ"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleAskAndSend}
                  disabled={isLoading || !question.trim()}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini กำลังคิดและส่งเข้า Discord...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>🚀 ให้ Gemini ตอบ & ยิงเข้าดิสคอร์ดทันที</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAskOnly}
                  disabled={isLoading || !question.trim()}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-semibold text-xs border border-zinc-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>ลองให้คิดคำตอบก่อน (ยังไม่ส่ง)</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Prompts */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>คำถามยอดฮิต (กดเลือกแล้วตอบทันที)</span>
                </span>
                <span className="text-[10px] text-zinc-500">คลิกเพื่อใส่คำถาม</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuestion(item.query);
                      setPersona(item.persona);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-violet-500/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-violet-300">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {item.query}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Tip Generators */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>ยิงเกร็ดความรู้ AI อัตโนมัติ (1-Click Tip)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  ให้ Gemini สุ่มคิดทริคเกมเด็ดๆ ส่งเข้าห้องดิสคอร์ดทันที
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleTriggerTip('bloxfruits')}
                  disabled={isLoading}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  🍉 ทริค Blox Fruits
                </button>
                <button
                  onClick={() => handleTriggerTip('trading')}
                  disabled={isLoading}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  ⚖️ ทริคเทรดดิ้ง
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Discord Embed Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-violet-400" />
                  <span>ตัวอย่างที่จะแสดงใน Discord</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Discord Embed Live
                </span>
              </div>

              {/* Mock Discord Chat Interface */}
              <div className="bg-[#313338] rounded-xl p-3.5 font-sans border border-zinc-700/50 shadow-inner">
                {/* Bot Profile Header */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0 overflow-hidden shadow">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{botName}</span>
                    <span className="bg-[#5865F2] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      BOT
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-1">วันนี้ เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Optional Mention Content */}
                <div className="text-xs text-indigo-300 mb-2 font-medium">
                  {questioner} นี่คือคำตอบสำหรับคำถามของคุณครับ:
                </div>

                {/* Discord Embed Box */}
                <div className="border-l-4 border-violet-500 bg-[#2b2d31] rounded-r-lg p-3.5 space-y-2.5 shadow">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🤖 Gemini AI Q&A | บอทช่วยตอบคำถามประจำดิสคอร์ด</span>
                  </div>

                  {/* Question */}
                  <div className="bg-[#1e1f22]/70 p-2.5 rounded-md border-l-2 border-violet-400 text-xs text-zinc-300">
                    <div className="text-[10px] uppercase font-bold text-violet-400 mb-0.5">❓ คำถาม:</div>
                    <div className="italic text-white">
                      "{question.trim() || 'คำถามของคุณจะแสดงที่นี่...'}"
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>💡 คำตอบจาก Gemini AI (gemini-3.8-flash):</span>
                    </div>
                    {previewAnswer ? (
                      <div>{previewAnswer}</div>
                    ) : (
                      <div className="text-zinc-500 italic py-3 text-center">
                        กดปุ่ม "ให้ Gemini ตอบ & ยิงเข้าดิสคอร์ด" เพื่อรับคำตอบแบบสมบูรณ์จาก AI ทันที
                      </div>
                    )}
                  </div>

                  {/* Embed Fields */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-700/50 text-[11px]">
                    <div>
                      <div className="text-zinc-400 text-[10px]">👤 ถามโดย</div>
                      <div className="text-white font-semibold">{questioner || 'สมาชิกในกลุ่ม'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 text-[10px]">🧠 บุคลิกภาพ AI</div>
                      <div className="text-violet-300 font-semibold">
                        {persona === 'roblox-expert'
                          ? 'เซียน Blox Fruits'
                          : persona === 'trade-master'
                          ? 'ปรมาจารย์เทรดดิ้ง'
                          : persona === 'friendly-helper'
                          ? 'ผู้ช่วยใจดี'
                          : 'กำหนดเอง'}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 text-[10px] text-zinc-400 flex items-center gap-1.5 border-t border-zinc-800">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span>Google Gemini 3.8 Flash • AI Q&A Bot 24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Webhook Settings Card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3 text-xs">
              <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>การตั้งค่า Webhook บอท</span>
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">URL Webhook บอทตัวใหม่</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-violet-500"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setWebhookUrl(DEFAULT_AI_WEBHOOK)}
                  className="text-zinc-400 hover:text-white text-[11px] underline cursor-pointer"
                >
                  รีเซ็ตกลับเป็น Webhook ล่าสุดของคุณ
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-[11px] cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Tag @Bot Guide & Live Bot Runner */}
      {subTab === 'tagGuide' && (
        <div className="space-y-6">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-indigo-500/15 border border-amber-500/30 rounded-2xl p-6 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <KeyRound className="w-6 h-6 text-amber-300" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                  คำตอบสำหรับคำถามของคุณ
                </div>
                <h3 className="text-lg font-black text-white">
                  "ได้โทเคน (Bot Token) มาแล้ว แล้วเอาไปทำอะไรต่อ?"
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                  <strong>Bot Token</strong> คือ <strong>"กุญแจล็อกอินของบอท"</strong> ที่ทำให้บอทมีชีวิตขึ้นมาและเชื่อมต่อกับเซิร์ฟเวอร์ Discord ได้จริง! เมื่อมีโทเคนแล้ว คุณสามารถทำ <strong>3 ขั้นตอนด้านล่างนี้</strong> เพื่อให้บอทเริ่มตอบคำถามคนที่แท็กในดิสคอร์ดได้ทันที:
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1: Live Bot Connection Panel (Interactive) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shadow">
                  1
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Power className="w-4 h-4 text-violet-400" />
                    <span>นำ Token มาใส่เพื่อสั่งให้บอทออนไลน์ (เปิดใช้งานทันทีในระบบนี้)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    วาง Token ลงในช่องด้านล่าง แล้วกดเชื่อมต่อ บอทจะออนไลน์ใน Discord ทันทีโดยไม่ต้องเปิดโปรแกรมอื่น
                  </p>
                </div>
              </div>

              {liveBot?.isRunning && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ออนไลน์อยู่
                </span>
              )}
            </div>

            {/* If Bot is Currently Running */}
            {liveBot?.isRunning && liveBot.botInfo ? (
              <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/30 border border-emerald-500/40 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {liveBot.botInfo.avatar ? (
                      <img
                        src={liveBot.botInfo.avatar}
                        alt="Bot Avatar"
                        className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        🤖
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-white">{liveBot.botInfo.username}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-white text-[10px] font-black uppercase">
                          BOT
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">#{liveBot.botInfo.tag.split('#')[1] || '0000'}</span>
                      </div>
                      <div className="text-xs text-emerald-300 flex items-center gap-2 mt-0.5">
                        <span>🟢 สถานะ: ออนไลน์พร้อมตอบคำถามตลอด 24 ชม.</span>
                        <span>•</span>
                        <span>อยู่ทั้งหมด {liveBot.botInfo.guildsCount} เซิร์ฟเวอร์</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStopBot}
                    disabled={isBotLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 text-rose-400" />
                    <span>หยุดการทำงานบอท (Stop Bot)</span>
                  </button>
                </div>

                {/* Quick Test Instructions */}
                <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ทดสอบพิมพ์แท็กบอทใน Discord ได้ทันที!</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    ตอนนี้คนในเซิร์ฟเวอร์ดิสคอร์ดของคุณสามารถแท็กบอทได้แล้ว โดยพิมพ์แบบใดก็ได้ดังนี้:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-indigo-300">
                      <code>@{liveBot.botInfo.username} ผล Kitsune ดีไหม แนะนำการอัปสเตตัสหน่อย</code>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-violet-300">
                      <code>!ask ดาบคาตานะสามเล่ม (TTK) ทำยังไง?</code>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* If Bot is Offline: Provide Token Input Box */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    🔑 วาง Discord Bot Token ของคุณที่นี่:
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={botTokenInput}
                      onChange={(e) => setBotTokenInput(e.target.value)}
                      placeholder={
                        liveBot?.hasSavedToken
                          ? `เคยมี Token บันทึกไว้ (${liveBot.savedTokenMasked}) สามารถกดเริ่มได้เลย หรือใส่โทเคนใหม่`
                          : 'วาง Token เช่น: MTA1NDky... หรือ MTIzNDU2...'
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl pl-3.5 pr-24 py-3 text-xs text-white font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showToken ? 'ซ่อน' : 'แสดง'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleStartBot}
                    disabled={isBotLoading || (!botTokenInput.trim() && !liveBot?.hasSavedToken)}
                    className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isBotLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>กำลังล็อกอินเข้าสู่ Discord...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" />
                        <span>🟢 เชื่อมต่อและเริ่มเปิดบอทออนไลน์ (Connect Bot Online)</span>
                      </>
                    )}
                  </button>

                  {liveBot?.hasSavedToken && (
                    <button
                      onClick={() => {
                        setBotTokenInput('');
                        handleStartBot();
                      }}
                      disabled={isBotLoading}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition-colors cursor-pointer"
                    >
                      ใช้ Token ที่บันทึกไว้ ({liveBot.savedTokenMasked})
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  🔒 <strong>ความปลอดภัย:</strong> Token ของคุณจะถูกใช้เชื่อมต่อกับ Discord Gateway โดยตรงในระบบหลังบ้านเพื่อรับฟังคำสั่งถาม-ตอบ ไม่มีการส่งออกไปยังบุคคลที่สาม
                </p>
              </div>
            )}
          </div>

          {/* STEP 2: Invite Bot to Discord Server */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <span className="w-7 h-7 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shadow">
                2
              </span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-violet-400" />
                  <span>เชิญบอทเข้าเซิร์ฟเวอร์ดิสคอร์ดของคุณ (Invite Link)</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  ถ้าบอทยังไม่ได้อยู่ในเซิร์ฟเวอร์ จะไม่สามารถรับแท็กได้ ให้กดเชิญบอทเข้าดิสคอร์ดของคุณก่อน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  🆔 Application ID / Client ID (ดูได้จากหน้า Developer Portal):
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="เช่น 1552857116002484336 หรือรหัสตัวเลข 18-19 หลัก"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-violet-500"
                />
                <span className="text-[10px] text-zinc-500 block">
                  * หาได้ที่หน้า Developer Portal → แท็บ "General Information" → ตรงช่อง "Application ID"
                </span>
              </div>

              <div className="md:col-span-5 flex flex-col gap-2 pt-2 md:pt-0">
                <a
                  href={
                    clientIdInput.trim()
                      ? `https://discord.com/api/oauth2/authorize?client_id=${clientIdInput.trim()}&permissions=277025507392&scope=bot`
                      : '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!clientIdInput.trim()) {
                      e.preventDefault();
                      setStatusMessage({ type: 'error', text: 'กรุณากรอก Application ID ก่อนกดเชิญบอท' });
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-center shadow-lg transition-all ${
                    clientIdInput.trim()
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>🔗 คลิกเพื่อเชิญบอทเข้าเซิร์ฟเวอร์</span>
                </a>

                {clientIdInput.trim() && (
                  <button
                    onClick={() => {
                      const url = `https://discord.com/api/oauth2/authorize?client_id=${clientIdInput.trim()}&permissions=277025507392&scope=bot`;
                      navigator.clipboard.writeText(url);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 2000);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedInvite ? 'คัดลอกลิงก์เชิญแล้ว!' : 'คัดลอกลิงก์ Invite URL'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3: Must Enable Intent Switch in Developer Portal */}
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-amber-500/30 pb-4">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center shadow">
                3
              </span>
              <div>
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>สิ่งสำคัญที่สุด: อย่าลืมเปิดสวิตช์ MESSAGE CONTENT INTENT</span>
                </h4>
                <p className="text-[11px] text-zinc-300">
                  ถ้าไม่เปิดสวิตช์นี้ Discord จะบล็อกไม่ให้บอทอ่านข้อความที่คนแท็กถาม (บอทจะไม่ตอบ)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-center leading-5 font-black text-[11px]">1</span>
                  <span>ไปที่ Developer Portal</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  เข้าเว็บ <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-sky-400 underline">discord.com/developers/applications</a> แล้วคลิกที่ชื่อบอทของคุณ
                </p>
              </div>

              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-center leading-5 font-black text-[11px]">2</span>
                  <span>คลิกเมนู "Bot" ด้านซ้าย</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  มองหาเมนูแท็บ <strong>"Bot"</strong> แถบทางซ้ายมือ แล้วเลื่อนหน้าจอลงมาด้านล่าง
                </p>
              </div>

              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-center leading-5 font-black text-[11px]">3</span>
                  <span>เปิด MESSAGE CONTENT INTENT</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  ตรงหัวข้อ <strong>Privileged Gateway Intents</strong> ให้เปิดสวิตช์ <strong>MESSAGE CONTENT INTENT</strong> เป็นสีเขียว แล้วกด <strong>Save Changes</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Alternative Option: Run Locally or on VPS */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>ทางเลือกเสริม: รันบอทบนคอมพิวเตอร์ของคุณเอง หรือ Cloud VPS (Node.js)</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  หากคุณต้องการดาวน์โหลดโค้ดไปรันแบบ Standalone ในเครื่องตนเอง สามารถสั่งรันคำสั่งด้านล่างนี้ได้ทันที:
                </p>
              </div>

              <button
                onClick={() => {
                  const cmd = `DISCORD_BOT_TOKEN="${botTokenInput.trim() || 'ใส่_BOT_TOKEN_ของคุณที่นี่'}" node scripts/discord-gemini-bot.mjs`;
                  navigator.clipboard.writeText(cmd);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกคำสั่งรัน'}</span>
              </button>
            </div>

            <div className="bg-black/70 p-3.5 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto border border-zinc-800">
              DISCORD_BOT_TOKEN="{botTokenInput.trim() || 'ใส่_BOT_TOKEN_ของคุณที่นี่'}" node scripts/discord-gemini-bot.mjs
            </div>

            <p className="text-[11px] text-zinc-400">
              ✅ ไฟล์สคริปต์ <code className="text-violet-300 font-mono">scripts/discord-gemini-bot.mjs</code> ในระบบนี้ถูกเขียนเตรียมไว้ครบถ้วนแล้ว เชื่อมต่อกับ <strong>Google Gemini 3.8 Flash</strong> โดยตรง พร้อมระบบจัดการ Embed และ Mention ผู้ถามอัตโนมัติ
            </p>
          </div>
        </div>
      )}

      {/* Subtab 3: Auto Scheduler (AI Tips) */}
      {subTab === 'autoScheduler' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>ระบบโพสต์เกร็ดความรู้และตอบคำถามอัตโนมัติ (AI Auto-Tips)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                ให้ Gemini สร้างเกร็ดความรู้ ทริคเกม หรือวิเคราะห์การเทรดสดใหม่ โพสต์ลงในดิสคอร์ดอัตโนมัติตามช่วงเวลาที่กำหนด
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${autoTipsEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {autoTipsEnabled ? '🟢 เปิดทำงาน' : '🔴 ปิดอยู่'}
              </span>
              <button
                onClick={() => setAutoTipsEnabled(!autoTipsEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  autoTipsEnabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                ⏱️ ความถี่ในการโพสต์
              </label>
              <select
                value={autoTipsInterval}
                onChange={(e) => setAutoTipsInterval(parseInt(e.target.value, 10))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-violet-500"
              >
                <option value={1}>ทุกๆ 1 ชั่วโมง (บ่อยพิเศษ)</option>
                <option value={2}>ทุกๆ 2 ชั่วโมง</option>
                <option value={4}>ทุกๆ 4 ชั่วโมง (แนะนำ พร้อมรอบรีเซ็ต Blox Fruits)</option>
                <option value={8}>ทุกๆ 8 ชั่วโมง</option>
                <option value={12}>ทุกๆ 12 ชั่วโมง</option>
              </select>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                🎯 เนื้อหาที่ให้ AI สุ่มสร้าง
              </label>
              <p className="text-xs text-zinc-400 leading-relaxed">
                • เกร็ดความรู้และทริคลับ Blox Fruits ทะเล 1, 2, 3<br />
                • วิเคราะห์แนวโน้มราคาและการเทรดผลปีศาจ<br />
                • เทคนิคการดูไอเทม Limited Roblox<br />
                • ตอบคำถามยอดฮิตของผู้เล่นประจำสัปดาห์
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSaveConfig}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              💾 บันทึกการตั้งค่าระบบอัตโนมัติ
            </button>
          </div>
        </div>
      )}

      {/* Subtab 4: History Logs */}
      {subTab === 'history' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>ประวัติคำถาม-คำตอบที่ส่งเข้าดิสคอร์ด ({history.length} รายการ)</span>
            </h3>
            {history.length > 0 && (
              <button
                onClick={async () => {
                  await fetch('/api/ai/clear-history', { method: 'POST' });
                  fetchConfig();
                }}
                className="text-xs text-rose-400 hover:underline cursor-pointer"
              >
                ล้างประวัติ
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              ยังไม่มีประวัติคำถาม-คำตอบ ลองพิมพ์ถามในแท็บ "กล่องสั่งถาม-ตอบ" ได้เลยครับ!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">👤 {item.questioner}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-violet-300">🧠 {item.persona}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-400">{item.thaiTime}</span>
                      {item.status === 'sent' ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          ✓ ส่งเข้า Discord สำเร็จ
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                          ✕ ส่งไม่สำเร็จ ({item.error})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-zinc-200">
                    <strong className="text-white">คำถาม:</strong> {item.question}
                  </div>

                  {item.answer && (
                    <div className="text-zinc-300 bg-zinc-900/60 p-3 rounded-lg border-l-2 border-violet-500 leading-relaxed whitespace-pre-wrap text-[11px]">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
