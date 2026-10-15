'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Mic, Award, Smile, BookOpen, ThumbsUp } from 'lucide-react';

export interface TeacherProfile {
  id: string;
  name: string;
  subject: string;
  emoji: string;
  avatarRole: string;
  themeColor: string;
  tagline: string;
}

interface CharacterGuideProps {
  teacher: TeacherProfile;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking?: boolean;
  lastMessage?: string;
  onReplayAudio?: () => void;
}

export default function CharacterGuide({
  teacher,
  isSpeaking,
  isListening,
  isThinking = false,
  lastMessage = '',
  onReplayAudio,
}: CharacterGuideProps) {
  const [pulseWave, setPulseWave] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeaking) {
      interval = setInterval(() => {
        setPulseWave((prev) => !prev);
      }, 350);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="relative bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-5 border border-indigo-500/30 shadow-2xl text-white overflow-hidden flex flex-col justify-between">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black tracking-wider uppercase text-emerald-300">
            {isSpeaking ? 'बोल रहे हैं (Speaking)' : isListening ? 'सुन रहे हैं (Listening)' : isThinking ? 'सोच रहे हैं...' : 'तैयार हैं (Online)'}
          </span>
        </div>

        <button
          onClick={onReplayAudio}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 transition-all text-xs font-bold flex items-center gap-1.5 border border-white/10"
          title="आवाज़ दोबारा सुनें"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Replay Voice</span>
        </button>
      </div>

      {/* Central Animated Avatar Illustration */}
      <div className="flex flex-col items-center justify-center my-4 z-10">
        <div className="relative">
          {/* Audio Wave Ring animations when speaking */}
          {isSpeaking && (
            <>
              <div className="absolute -inset-4 rounded-full border-2 border-indigo-400/40 animate-ping pointer-events-none" />
              <div className="absolute -inset-8 rounded-full border border-indigo-400/20 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Listening pulse rings */}
          {isListening && (
            <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-pulse pointer-events-none" />
          )}

          {/* Avatar Base Container */}
          <div
            className={`w-28 h-28 md:w-32 md:h-32 rounded-3xl p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 shadow-2xl transition-all duration-300 transform ${
              isSpeaking ? 'scale-105' : 'scale-100'
            }`}
          >
            <div className="w-full h-full rounded-[22px] bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden border border-white/20">
              {/* Teacher Big Emoji Avatar */}
              <span className={`text-5xl md:text-6xl transition-transform duration-300 ${isSpeaking ? 'scale-110' : ''}`}>
                {teacher.emoji}
              </span>

              {/* Status Indicator icon on avatar */}
              <div className="absolute bottom-2 right-2 bg-slate-800/90 rounded-full p-1 border border-white/20 shadow">
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                ) : isListening ? (
                  <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Name & Subject */}
        <h3 className="text-xl font-black mt-3 flex items-center gap-2">
          {teacher.name}
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold">
            {teacher.subject}
          </span>
        </h3>
        <p className="text-xs text-slate-300 text-center max-w-xs mt-0.5">
          {teacher.avatarRole}
        </p>

        {/* Live Audio Visualizer Bars */}
        <div className="flex items-center gap-1.5 h-6 mt-3">
          {[40, 75, 100, 60, 90, 45, 80, 55, 95, 50].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isSpeaking
                  ? 'bg-gradient-to-t from-indigo-400 to-emerald-400'
                  : 'bg-slate-700'
              }`}
              style={{
                height: isSpeaking ? `${Math.max(6, (h * (pulseWave ? 1 : 0.45)) * 0.24)}px` : '4px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Teacher's Current Speech / Guidance Bubble */}
      <div className="z-10 bg-slate-800/80 rounded-2xl p-3.5 border border-white/10 backdrop-blur-md">
        <div className="flex items-start gap-2.5">
          <Smile className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {lastMessage || `नमस्ते बेटा! मैं ${teacher.name} हूँ। आपको गणित या किसी भी सवाल में दिक्कत हो तो मुझसे बेझिझक पूछिए या फोटो भेजिए!`}
          </p>
        </div>
      </div>
    </div>
  );
}
