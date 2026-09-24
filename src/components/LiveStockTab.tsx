import React, { useState } from 'react';
import { BloxFruit, FRUITS_DATABASE } from '../data/fruits';
import { FruitCard } from './FruitCard';
import {
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  Search,
  Filter,
  Flame,
  ShieldAlert,
  Coins,
  Store,
  Info,
} from 'lucide-react';

interface LiveStockTabProps {
  stockFruits: BloxFruit[];
  rotationDate: string;
  rotationTime: string;
  countdownText: string;
  nextResetThai: string;
  isLoading: boolean;
  onRefresh: () => void;
  onSendDiscord: () => void;
  onUpdateCustomStock?: (fruits: BloxFruit[]) => void;
  onResetToWiki?: () => void;
  isCustom?: boolean;
}

export const LiveStockTab: React.FC<LiveStockTabProps> = ({
  stockFruits,
  rotationDate,
  rotationTime,
  countdownText,
  nextResetThai,
  isLoading,
  onRefresh,
  onSendDiscord,
  onUpdateCustomStock,
  onResetToWiki,
  isCustom = false,
}) => {
  const [viewMode, setViewMode] = useState<'inStock' | 'all'>('inStock');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Custom in-game fruit editor modal
  const [isEditing, setIsEditing] = useState(false);
  const [tempSelectedFruits, setTempSelectedFruits] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const allFruitsList = Object.values(FRUITS_DATABASE);
  const stockFruitNames = new Set(stockFruits.map((f) => f.name));

  const openEditor = () => {
    setTempSelectedFruits(stockFruits.map((f) => f.name));
    setIsEditing(true);
    setSaveStatus(null);
  };

  const toggleFruitInSelection = (fruitName: string) => {
    // Keep Rocket & Spin always in stock
    if (fruitName === 'Rocket' || fruitName === 'Spin') return;
    setTempSelectedFruits((prev) =>
      prev.includes(fruitName) ? prev.filter((name) => name !== fruitName) : [...prev, fruitName]
    );
  };

  const handleSaveInGameStock = async () => {
    try {
      const chosenFruits = tempSelectedFruits.map((name) => FRUITS_DATABASE[name]).filter(Boolean);
      const res = await fetch('/api/bloxfruits/stock/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fruits: chosenFruits,
          date: 'สต็อกในเกมจริง (ตรวจพบขณะนี้)',
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('✅ อัปเดตสต็อกตรงกับในเกมของคุณเรียบร้อยแล้ว!');
        if (onUpdateCustomStock) onUpdateCustomStock(data.data.fruits);
        setTimeout(() => {
          setIsEditing(false);
          setSaveStatus(null);
          onRefresh();
        }, 1200);
      }
    } catch (err: any) {
      setSaveStatus(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleResetWiki = async () => {
    try {
      await fetch('/api/bloxfruits/stock/reset-wiki', { method: 'POST' });
      if (onResetToWiki) onResetToWiki();
      onRefresh();
    } catch {}
  };

  const sourceList = viewMode === 'inStock' ? stockFruits : allFruitsList;

  const filteredFruits = sourceList.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.thaiName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'All' || f.rarity === selectedRarity;
    const matchesType = selectedType === 'All' || f.type === selectedType;
    return matchesSearch && matchesRarity && matchesType;
  });

  const hasMythical = stockFruits.some((f) => f.rarity === 'Mythical');
  const hasLegendary = stockFruits.some((f) => f.rarity === 'Legendary');
  const totalBeliValue = stockFruits.reduce((sum, f) => sum + (f.beliPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner / Dealer Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                คนขายผล Blox Fruit Dealer ทำการอยู่
              </span>
              <span className="text-xs bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-700">
                รอบวันที่ {rotationDate} ({rotationTime} UTC)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🍉 สต็อกผลไม้ Blox Fruits ปัจจุบัน</span>
            </h2>

            <p className="text-sm text-zinc-400 max-w-2xl">
              ดึงข้อมูลตรงจาก Blox Fruits Fandom Wiki API ทุกๆ รอบ 4 ชั่วโมง
              พร้อมส่งแจ้งเตือนเข้า Discord Webhook อัตโนมัติ
            </p>
          </div>

          {/* Reset Timer & Discord Trigger Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 min-w-[220px]">
              <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  รอบรีเซ็ตถัดไป (เวลาไทย)
                </div>
                <div className="text-lg font-bold text-amber-300">{nextResetThai}</div>
                <div className="text-xs text-zinc-400">อีก {countdownText}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onSendDiscord}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm shadow-lg shadow-[#5865F2]/25 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                ส่งเข้า Discord เดี๋ยวนี้
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={openEditor}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 transition-colors cursor-pointer"
                  title="ถ้าสต็อกไม่ตรงกับในเกมของคุณ กดปุ่มนี้เพื่อติ๊กเลือกผลไม้ที่เห็นในเกมได้ทันที"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>✏️ ตั้งผลตามในเกม</span>
                </button>

                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isCustom && (
                <button
                  onClick={handleResetWiki}
                  className="text-[11px] text-zinc-400 hover:text-amber-400 text-center underline cursor-pointer"
                >
                  รีเซ็ตกลับเป็นดึงจาก Fandom Wiki
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-400 block">ผลในสต็อกรอบนี้</span>
            <span className="text-white font-bold text-base">{stockFruits.length} ผล</span>
          </div>

          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-400 block">ผลระดับ Mythical</span>
            <span
              className={`font-bold text-base ${hasMythical ? 'text-rose-400 font-black' : 'text-zinc-500'}`}
            >
              {hasMythical ? '🔥 มีผลเทพเข้า!' : 'ไม่มีในรอบนี้'}
            </span>
          </div>

          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-400 block">ผลระดับ Legendary</span>
            <span
              className={`font-bold text-base ${hasLegendary ? 'text-fuchsia-400' : 'text-zinc-500'}`}
            >
              {hasLegendary ? '✨ มีผลตำนาน' : 'ไม่มีในรอบนี้'}
            </span>
          </div>

          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-400 block">มูลค่ารวม (Beli)</span>
            <span className="text-emerald-400 font-bold text-base font-mono">
              ${totalBeliValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle View Mode */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('inStock')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'inStock'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🛒 ผลในสต็อกรอบนี้ ({stockFruits.length})
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-zinc-700 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📖 ผลไม้ทั้งหมดในเกม ({allFruitsList.length})
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผลไม้ (ไทย/อังกฤษ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Rarity Select */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/60"
          >
            <option value="All">ทุกระดับ (Rarity)</option>
            <option value="Mythical">Mythical (มายา)</option>
            <option value="Legendary">Legendary (ตำนาน)</option>
            <option value="Rare">Rare (หายาก)</option>
            <option value="Uncommon">Uncommon (พิเศษ)</option>
            <option value="Common">Common (ทั่วไป)</option>
          </select>

          {/* Type Select */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/60"
          >
            <option value="All">ทุกสาย (Type)</option>
            <option value="Natural">Natural (สายพารามีเซีย)</option>
            <option value="Elemental">Elemental (สายโรเกีย)</option>
            <option value="Beast">Beast (สายโซออน)</option>
          </select>
        </div>
      </div>

      {/* Fruit Cards Grid */}
      {filteredFruits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 space-y-2">
          <Info className="w-8 h-8 mx-auto text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">ไม่พบผลไม้ที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเป็น "ทุกระดับ"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFruits.map((fruit) => (
            <FruitCard
              key={fruit.name}
              fruit={fruit}
              inStock={stockFruitNames.has(fruit.name)}
            />
          ))}
        </div>
      )}

      {/* In-Game Stock Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎮 ตั้งสต็อกผลไม้ให้ตรงกับในเกมของคุณ</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  ติ๊กเลือกผลไม้ที่คุณเห็นอยู่ในร้านค้า Blox Fruit Dealer ในเกมตอนนี้ เพื่อให้ระบบจำและส่งแจ้งเตือนได้ถูกต้อง 100%
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Fruits List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {saveStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    saveStatus.startsWith('✅')
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {saveStatus}
                </div>
              )}

              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2">
                <span>💡</span>
                <span>
                  ผล <strong>Rocket</strong> และ <strong>Spin</strong> มีขายตลอดเวลาในเกม จึงถูกเลือกไว้ให้อัตโนมัติครับ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {allFruitsList.map((fruit) => {
                  const isSelected = tempSelectedFruits.includes(fruit.name);
                  const isPermanent = fruit.name === 'Rocket' || fruit.name === 'Spin';

                  return (
                    <button
                      key={fruit.name}
                      type="button"
                      disabled={isPermanent}
                      onClick={() => toggleFruitInSelection(fruit.name)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm shadow-amber-500/10'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      } ${isPermanent ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <img
                        src={fruit.image}
                        alt={fruit.name}
                        className="w-8 h-8 rounded-lg object-contain bg-zinc-900 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate flex items-center gap-1">
                          <span>{fruit.name}</span>
                          {isSelected && <span className="text-amber-400 text-[10px]">✓</span>}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">{fruit.thaiName}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-400">
                เลือกแล้ว: <strong className="text-white">{tempSelectedFruits.length} ผล</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveInGameStock}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  บันทึกสต็อกในเกมทันที
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
