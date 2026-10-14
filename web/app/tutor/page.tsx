'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mic,
  Volume2,
  Edit3,
  RotateCcw,
  Sparkles,
  Send,
  ArrowLeft,
  CheckCircle2,
  Globe2,
  Brain,
} from 'lucide-react';

const TEACHERS = [
  { id: 'neha', name: 'Neha Mam', subject: 'Science 🔬', emoji: '👩‍🔬', activeColor: 'border-sky-400 bg-sky-50' },
  { id: 'sharma', name: 'Sharma Sir', subject: 'Math 📐', emoji: '👨‍🏫', activeColor: 'border-amber-400 bg-amber-50' },
  { id: 'riya', name: 'Riya Didi', subject: 'English 📚', emoji: '👩‍🏫', activeColor: 'border-pink-400 bg-pink-50' },
  { id: 'kabir', name: 'Kabir Sir', subject: 'SST 🌍', emoji: '👨‍💼', activeColor: 'border-purple-400 bg-purple-50' },
  { id: 'pooja', name: 'Pooja Mam', subject: 'Hindi ✍️', emoji: '👩‍🎓', activeColor: 'border-emerald-400 bg-emerald-50' },
];

export default function WebAITutorStudio() {
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[1]); // Sharma Sir
  const [isListening, setIsListening] = useState(false);
  const [languageMode, setLanguageMode] = useState<'Hinglish' | 'Hindi' | 'English'>('Hinglish');
  const [messages, setMessages] = useState([
    {
      sender: 'teacher',
      text: 'Namaste Aarav! Main Sharma Sir hoon. Aaj Maths me Fractions & Decimals ka concept seekhenge. Kaho, kya sawaal hai?',
      time: '10:00 AM',
    },
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSendMessage = () => {
    if (!inputVal.trim()) return;
    const userMsg = inputVal;
    setInputVal('');

    setMessages((prev) => [
      ...prev,
      { sender: 'student', text: userMsg, time: '10:02 AM' },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'teacher',
          text: `Bahut achha sawaal! "${userMsg}" ka solution maine whiteboard par note kar diya hai. Dekhiye!`,
          time: '10:02 AM',
        },
      ]);
    }, 1000);
  };

  const handleMicToggle = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-base">AI Tutor Studio</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
              WEB DESKTOP EDITION
            </span>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <Globe2 className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {(['Hinglish', 'Hindi', 'English'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguageMode(lang)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                languageMode === lang ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      {/* Main Workspace: 2-Column Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Column: Smart Whiteboard & Teacher Selector */}
        <div className="lg:col-span-8 p-6 flex flex-col border-r border-slate-800 overflow-y-auto">
          {/* Teacher Switcher Ribbon */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-4 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Choose Teacher:</span>
            {TEACHERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeacher(t)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  selectedTeacher.id === t.id
                    ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>

          {/* Interactive Chalkboard Canvas */}
          <div className="flex-1 bg-slate-900/90 rounded-3xl border-2 border-slate-800 p-6 flex flex-col relative shadow-2xl">
            {/* Whiteboard Top Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Live Smart Whiteboard</h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  STEP-BY-STEP SOLUTION
                </span>
              </div>
              <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas steps */}
            <div className="flex-1 space-y-4 font-mono">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400 mb-1">
                  <span>Step 1: NCERT Method</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl font-black text-cyan-300">1/2 + 1/4 = ?</p>
                <p className="text-xs font-sans text-slate-400 mt-2">
                  Sharma Sir: <i>"Sabse pehle dono fractions ke denominators (2 aur 4) ka LCM lete hain: LCM(2, 4) = 4"</i>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                  <span>Step 2: Equivalent Fraction & Final Sum</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl font-black text-emerald-300">2/4 + 1/4 = (2 + 1) / 4 = 3/4</p>
                <p className="text-xs font-sans text-emerald-400/90 mt-2">
                  ✅ <b>Final Answer:</b> 3/4 (Three-Fourths / Pona bhag)
                </p>
              </div>
            </div>

            {/* Sound Waveform Visualizer in Whiteboard */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs text-slate-300 font-semibold">{selectedTeacher.name} is ready for doubts</span>
              </div>

              <div className="flex items-center gap-1">
                {[14, 28, 42, 20, 36, 16, 30].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: isListening ? `${h}px` : '10px' }}
                    className="w-1 bg-emerald-400 rounded-full transition-all"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Voice Chat & Push-to-Talk Controller */}
        <div className="lg:col-span-4 bg-slate-900 flex flex-col justify-between p-6">
          {/* Header of Active Teacher */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-2xl">
              {selectedTeacher.emoji}
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white">{selectedTeacher.name}</h4>
              <p className="text-xs text-amber-400 font-semibold">{selectedTeacher.subject}</p>
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {messages.map((m, i) => {
              const isTeacher = m.sender === 'teacher';
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    isTeacher
                      ? 'bg-slate-800 border border-slate-700/60 text-slate-200 mr-auto'
                      : 'bg-indigo-600 text-white ml-auto'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                    <span className="font-bold">{isTeacher ? selectedTeacher.name : 'You (Aarav)'}</span>
                    <span>• {m.time}</span>
                  </div>
                  <p>{m.text}</p>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Area: Mic & Input */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            {/* Big Mic Button */}
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={handleMicToggle}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                  isListening
                    ? 'bg-red-500 scale-110 shadow-red-500/40'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                }`}
              >
                <Mic className="w-7 h-7 text-white" />
              </button>
              <span className="text-xs font-bold text-slate-300 mt-2">
                {isListening ? '🔴 Listening... Bolte rahiye' : 'Mic dabakar sawaal bolein'}
              </span>
            </div>

            {/* Text input for quiet study */}
            <div className="flex items-center gap-2 bg-slate-950 rounded-2xl p-2 border border-slate-800">
              <input
                type="text"
                placeholder="Ya type karke sawaal poochein..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-transparent px-3 text-xs text-white outline-none placeholder:text-slate-500"
              />
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
