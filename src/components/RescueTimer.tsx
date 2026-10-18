import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { playTimerChime, unlockAudio } from '../utils/audioChime';

interface RescueTimerProps {
  initialMinutes: number;
  label?: string;
}

export const RescueTimer: React.FC<RescueTimerProps> = ({ initialMinutes, label }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      setHasFinished(true);
      playTimerChime();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const toggle = () => {
    unlockAudio();
    if (hasFinished) {
      setSecondsLeft(initialMinutes * 60);
      setHasFinished(false);
      setIsActive(true);
    } else {
      setIsActive(!isActive);
    }
  };

  const reset = () => {
    setIsActive(false);
    setSecondsLeft(initialMinutes * 60);
    setHasFinished(false);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div
      className={`inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        hasFinished
          ? 'bg-amber-100 border-amber-300 text-amber-900 animate-bounce'
          : isActive
          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
          : 'bg-stone-100 border-stone-300 text-stone-700'
      }`}
    >
      <Bell className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 animate-pulse' : 'text-stone-500'}`} />
      <span className="font-mono font-bold tracking-wider">{timeFormatted}</span>
      {label && <span className="text-[11px] text-stone-500 hidden sm:inline">({label})</span>}
      <button
        onClick={toggle}
        className="p-1 rounded-full hover:bg-black/10 transition"
        title={isActive ? 'Pause' : 'Start Timer'}
      >
        {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <button
        onClick={reset}
        className="p-1 rounded-full hover:bg-black/10 transition"
        title="Reset Timer"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
};
