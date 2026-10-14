'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mic, Sparkles, Volume2, CheckCircle2, AlertTriangle, ArrowRight, Camera, Video, Target } from 'lucide-react';

export const InteractiveDemoWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'voice' | 'scanner'>('video');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 md:p-8 text-white relative">
      {/* Background glow blur */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Demo Widget Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Interactive Live Preview</h3>
            <p className="text-xs text-slate-400">See how your child learns in real-time</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'video'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Teacher & Pointer</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'voice'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voice Doubt
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'scanner'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Scanner
          </button>
        </div>
      </div>

      {/* Tab 1: Video Teacher & Pointer Demo */}
      {activeTab === 'video' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Video Stream Simulator */}
          <div className="md:col-span-6 bg-slate-950/80 rounded-2xl p-4 border border-indigo-500/30 flex flex-col items-center relative overflow-hidden shadow-xl">
            {/* Live Indicator */}
            <div className="w-full flex items-center justify-between mb-3 text-xs">
              <span className="flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>LIVE VIDEO CAM</span>
              </span>
              <span className="text-indigo-400 font-semibold text-[11px]">Sharma Sir • Math Class</span>
            </div>

            {/* Video Frame */}
            <div className="w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative p-4">
              <div className="w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-400 flex items-center justify-center text-4xl shadow-lg animate-pulse mb-2">
                👨‍🏫
              </div>
              <p className="text-xs font-bold text-white">Sharma Sir is teaching live</p>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">Lip-Sync Active • Pointer Sync: ON</p>

              {/* Laser Pointer simulation rod */}
              <div className="absolute right-4 bottom-4 flex items-center gap-1 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg shadow-rose-600/40">
                <Target className="w-3 h-3 text-white animate-spin" />
                <span>Chalk Pointer</span>
              </div>
            </div>

            <Link
              href="/tutor"
              className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Open Full Live Video Classroom</span>
            </Link>
          </div>

          {/* Right: Smart Whiteboard with Teacher Pointer Sync */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Target className="w-3.5 h-3.5" />
                <span>Teacher Live Pointer Target</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                Real-Time
              </span>
            </div>

            {/* Step 1 with Pointer Target */}
            <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-rose-500/80 shadow-lg shadow-rose-500/10 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                <span>Step 1: NCERT Method</span>
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-mono">Pointer Here 🎯</span>
              </div>
              <p className="text-base font-black font-mono text-amber-300">1/2 + 1/4 = 2/4 + 1/4</p>
              <p className="text-xs text-slate-300 font-sans">Sharma Sir: &quot;Dono denominators ka LCM 4 lete hain.&quot;</p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-1">
              <div className="text-[11px] font-bold text-indigo-400">Step 2: Final Sum</div>
              <p className="text-base font-black font-mono text-cyan-300">2/4 + 1/4 = 3/4</p>
              <p className="text-xs text-slate-400 font-sans">Final Answer: 3/4 (Pona hissa)</p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
              <span>Supports Built-in Avatar + HeyGen/D-ID/Simli</span>
              <span className="font-bold text-emerald-400">0 Setup Needed</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Voice Doubt Demo */}
      {activeTab === 'voice' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Teacher Profile & Waveform */}
          <div className="md:col-span-5 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-400/80 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20 animate-pulse">
                👨‍🏫
              </div>
              <span className="absolute bottom-0 right-0 px-2 py-0.5 bg-emerald-500 text-white font-bold text-[10px] rounded-full border-2 border-slate-900">
                ACTIVE
              </span>
            </div>

            <h4 className="mt-3 font-bold text-base text-white">Sharma Sir</h4>
            <p className="text-xs font-medium text-amber-400">Mathematics Specialist (Class 1–8)</p>

            {/* Audio Waveform Simulator */}
            <div className="w-full bg-slate-900/80 rounded-xl p-3 my-4 border border-slate-800">
              <div className="flex items-center justify-center gap-1.5 h-10">
                {[16, 28, 40, 24, 36, 18, 30, 42, 22, 14].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: isPlayingAudio ? `${h}px` : '12px' }}
                    className="w-1.5 bg-emerald-400 rounded-full transition-all duration-300"
                  />
                ))}
              </div>
              <button
                onClick={toggleAudio}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center gap-1.5 w-full"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {isPlayingAudio ? 'Pause Audio Voice' : 'Listen to Sharma Sir\'s Voice (Hinglish)'}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800">
              Child said: <span className="text-slate-200 italic">"Sir, 1/2 aur 1/4 ko kaise jodte hain?"</span>
            </div>
          </div>

          {/* Right: Live Interactive Whiteboard Output */}
          <div className="md:col-span-7 bg-slate-950 rounded-2xl p-5 border border-slate-800 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">Live Smart Whiteboard</span>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                STEP-BY-STEP
              </span>
            </div>

            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-xs font-bold text-amber-400">Step 1: Denominators Same Banao</span>
                <p className="text-cyan-400 font-bold text-sm mt-1">1/2 = 2/4 (Numerator & Denominator × 2)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-xs font-bold text-emerald-400">Step 2: Add Numerators</span>
                <p className="text-cyan-400 font-bold text-sm mt-1">2/4 + 1/4 = (2 + 1) / 4 = 3/4</p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-sans">
                💡 <b>Sharma Sir ka Tip:</b> Jab denominator same ho jaye, toh sirf upar ke numbers ko add karte hain!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Homework Scanner Demo */}
      {activeTab === 'scanner' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Notebook scan simulation */}
          <div className="md:col-span-6 bg-slate-950 rounded-2xl p-4 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
              SCANNED NOTEBOOK PAGE
            </div>
            <div className="bg-slate-100 text-slate-800 rounded-xl p-5 font-mono text-sm shadow-inner relative">
              <p className="text-xs text-slate-500 border-b pb-2 mb-3 font-sans">Math Homework • Class 5</p>
              <p className="font-bold">Q1. 15 × 6 = 90 <span className="text-emerald-600 font-sans">✓</span></p>
              <p className="font-bold mt-3 text-red-600 bg-red-100 p-1 rounded border border-red-300">
                Q2. (4/5) - (2/5) = 2/0 <span className="font-sans">❌</span>
              </p>
              <p className="font-bold mt-3">Q3. 120 ÷ 4 = 30 <span className="text-emerald-600 font-sans">✓</span></p>
            </div>
          </div>

          {/* AI Line-by-Line Correction */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Instant AI Verification (0.8s)</span>
            </div>

            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Mistake Detected in Q2</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">
                Aarav beta, fractions me subtract karte waqt denominator (5) change nahi hota. Denominator zero nahi ho sakta!
              </p>
              <div className="bg-slate-900 p-2 rounded text-cyan-300 font-mono text-xs">
                Correct Solution: 4/5 - 2/5 = (4 - 2) / 5 = <b>2/5</b>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              * Parents get an automated summary on WhatsApp for every homework scan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
