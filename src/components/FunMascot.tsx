import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface FunMascotProps {
  onCheer?: () => void;
}

export const FunMascot: React.FC<FunMascotProps> = () => {
  const [speechBubble, setSpeechBubble] = useState("Don't worry, dinner can be saved! 🍳");
  const [isWiggling, setIsWiggling] = useState(false);

  const tips = [
    "Don't worry, dinner can be saved! 🍳",
    "Rule #1: Turn down the heat! ❄️",
    "Take a breath, grab a spoon! 🥄",
    "Even top chefs burn things sometimes! 👩‍🍳",
    "Snap a photo, I'll take a look! 📸",
  ];

  const handlePoke = () => {
    setIsWiggling(true);
    const nextTip = tips[Math.floor(Math.random() * tips.length)];
    setSpeechBubble(nextTip);
    setTimeout(() => setIsWiggling(false), 600);
  };

  return (
    <div
      onClick={handlePoke}
      className="flex items-center space-x-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3 shadow-xs cursor-pointer select-none transition hover:shadow-sm"
      title="Tap me for chef encouragement!"
    >
      {/* Cute Animated Skillet Mascot SVG */}
      <div className={`relative shrink-0 w-12 h-12 transition-transform duration-300 ${isWiggling ? 'scale-110 rotate-12' : 'hover:scale-105'}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          {/* Pan handle */}
          <rect x="70" y="44" width="28" height="10" rx="5" fill="#4B5563" />
          
          {/* Pan body */}
          <circle cx="45" cy="50" r="38" fill="#1F2937" />
          <circle cx="45" cy="50" r="32" fill="#D97706" />
          <circle cx="45" cy="50" r="28" fill="#F59E0B" />
          
          {/* Cute face */}
          {/* Eyes */}
          <circle cx="37" cy="46" r="3.5" fill="#1F2937" />
          <circle cx="53" cy="46" r="3.5" fill="#1F2937" />
          {/* Eye shines */}
          <circle cx="38" cy="44.5" r="1.2" fill="#FFFFFF" />
          <circle cx="54" cy="44.5" r="1.2" fill="#FFFFFF" />
          {/* Cheeks */}
          <circle cx="32" cy="53" r="3" fill="#F87171" opacity="0.6" />
          <circle cx="58" cy="53" r="3" fill="#F87171" opacity="0.6" />
          {/* Smiling mouth */}
          <path d="M40 52 Q45 59 50 52" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          
          {/* Little Chef Hat */}
          <g transform="translate(24, 6)">
            <path d="M12 24 C8 24 5 21 6 16 C6 11 12 8 16 10 C18 6 25 5 28 8 C32 6 38 9 37 14 C40 18 38 24 33 24 Z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
            <rect x="11" y="22" width="23" height="4" rx="2" fill="#DC2626" />
          </g>

          {/* Little butter pat */}
          <rect x="40" y="32" width="10" height="7" rx="2" fill="#FEF08A" />
        </svg>

        {/* Playful sparkle badge */}
        <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-900 rounded-full p-0.5 shadow-xs">
          <Sparkles className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            Chef Sizzle
          </span>
          <span className="text-[10px] text-amber-700 bg-amber-200/60 px-1.5 py-0.2 rounded-full">
            Tap me!
          </span>
        </div>
        <p className="text-xs font-semibold text-stone-800 truncate mt-0.5">
          "{speechBubble}"
        </p>
      </div>
    </div>
  );
};
