import React from 'react';
import { BloxFruit, RARITY_COLORS } from '../data/fruits';
import { Zap, ShieldCheck, Sparkles, Coins } from 'lucide-react';

interface FruitCardProps {
  fruit: BloxFruit;
  inStock?: boolean;
  onSelect?: (fruit: BloxFruit) => void;
}

export const FruitCard: React.FC<FruitCardProps> = ({ fruit, inStock = false, onSelect }) => {
  const colors = RARITY_COLORS[fruit.rarity];

  return (
    <div
      onClick={() => onSelect?.(fruit)}
      className={`relative group overflow-hidden rounded-xl bg-zinc-900/90 border transition-all duration-300 p-4 flex flex-col justify-between cursor-pointer ${
        inStock
          ? `${colors.border} shadow-lg hover:shadow-xl hover:scale-[1.02] ring-1 ring-white/10`
          : 'border-zinc-800/80 hover:border-zinc-700 opacity-90'
      }`}
    >
      {/* Background ambient glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: colors.hexStr }}
      />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {fruit.rarity}
          </span>

          <div className="flex items-center gap-1">
            {fruit.awakening && (
              <span
                title="มีระบบร่างตื่น (Awakened)"
                className="text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded flex items-center gap-0.5"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                ตื่น
              </span>
            )}

            <span className="text-[11px] font-medium bg-zinc-800/90 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
              {fruit.type}
            </span>
          </div>
        </div>

        {/* Fruit Image & Name */}
        <div className="flex items-center gap-3 my-2">
          <div className="relative shrink-0 w-16 h-16 rounded-lg bg-zinc-950/80 border border-zinc-800 p-1 flex items-center justify-center group-hover:border-zinc-600 transition-colors">
            <img
              src={fruit.image}
              alt={fruit.name}
              className="w-14 h-14 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest';
              }}
            />
            {inStock && (
              <span className="absolute -top-1.5 -left-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-base text-white truncate flex items-center gap-1.5">
              <span>{fruit.name}</span>
            </h3>
            <p className="text-xs text-zinc-400 truncate">{fruit.thaiName}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 px-1 rounded text-amber-300">
                Tier {fruit.tier}
              </span>
            </div>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
          {fruit.description}
        </p>
      </div>

      {/* Prices */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span>${fruit.beliPrice.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1 text-sky-400 font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>R$ {fruit.robuxPrice}</span>
        </div>
      </div>
    </div>
  );
};
