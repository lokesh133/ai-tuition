'use client';

import React, { useState } from 'react';
import {
  Users,
  Settings,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
  Plus,
} from 'lucide-react';

const TEACHERS = [
  { id: 'neha_mam', name: 'Neha Mam', subject: 'Science (Class 1-8)', classes: '1 to 8', pacing: 'Slow & Socratic', pauseSecs: 1.2, speed: '40 WPM', active: true },
  { id: 'sharma_sir', name: 'Sharma Sir', subject: 'Mathematics (Class 1-8)', classes: '1 to 8', pacing: 'Line-by-Line Blackboard', pauseSecs: 1.5, speed: '35 WPM', active: true },
  { id: 'riya_didi', name: 'Riya Didi', subject: 'English & Grammar (Class 1-8)', classes: '1 to 8', pacing: 'Story & Phonics Paced', pauseSecs: 1.0, speed: '45 WPM', active: true },
  { id: 'verma_sir', name: 'Verma Sir', subject: 'Physics & Numericals (Class 9-12)', classes: '9 to 12', pacing: 'Step-by-Step Derivations', pauseSecs: 1.4, speed: '38 WPM', active: true },
  { id: 'gupta_sir', name: 'Gupta Sir', subject: 'Chemistry (Class 9-12)', classes: '9 to 12', pacing: 'Reaction Balancing Slow', pauseSecs: 1.3, speed: '40 WPM', active: true },
];

export default function AdminTeachersConfigPage() {
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[1]); // Sharma Sir
  const [pacingMode, setPacingMode] = useState('school_blackboard');
  const [speechPacing, setSpeechPacing] = useState(1.2);
  const [socraticCheckWait, setSocraticCheckWait] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
          AI Teacher Avatar & Pacing Engine
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
          AI Teacher Configuration & "School Blackboard" Slow Pacing
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Yahan se Admin define karta hai ki teacher school ke blackboard ki tarah kitna dheere aur step-by-step explain karega.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Teachers List (Class 1 to 12) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-slate-900">Configured Teachers</h3>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New (9th-12th)</span>
            </button>
          </div>

          <div className="space-y-2">
            {TEACHERS.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTeacher(t)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedTeacher.id === t.id
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-500">{t.subject}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Class {t.classes}
                  </span>
                  <p className="text-[10px] text-amber-600 font-bold mt-1">{t.pacing}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Pacing & Prompt Tuner */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-black text-lg text-slate-900">
                Pacing & Pedagogy Controls for {selectedTeacher.name}
              </h3>
              <p className="text-xs text-slate-500">Tweak step delays, blackboard reveal speed and question prompting</p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
              Active in Production
            </span>
          </div>

          {/* 1. School Blackboard Slow Pacing Mode */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-amber-900 uppercase">
                School Blackboard Slow Delivery (Strict Socratic Mode)
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Teacher ek baar me poora solution nahi dega. Pehle Step 1 likhega, phir bache se confirmation lega, aur 1.2 second ka realistic pause lega jaise school me sir blackboard par chalk se likhte hain.
            </p>
          </div>

          <div className="space-y-5">
            {/* Delivery Pacing Mode */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Delivery Style</label>
              <select
                value={pacingMode}
                onChange={(e) => setPacingMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="school_blackboard">🏫 School Teacher (Slow, Line-by-Line Blackboard with Pauses)</option>
                <option value="guided_tutor">👨‍🏫 Guided Tutor (Explains with question prompt before next step)</option>
                <option value="quick_exam_revision">⚡ Fast Exam Revision (Direct answers for test revision)</option>
              </select>
            </div>

            {/* Speech Pause Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
                <span>Teacher Voice Pause Between Steps:</span>
                <span className="text-indigo-600 font-black">{speechPacing} Seconds</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={speechPacing}
                onChange={(e) => setSpeechPacing(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0.5s (Fast)</span>
                <span>1.2s (Real Teacher Class Pace)</span>
                <span>3.0s (Very Patient / Class 1-3)</span>
              </div>
            </div>

            {/* Socratic Wait Checkbox */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Mandatory Socratic Check ("Pehle itna samajh aaya?")
                </span>
                <span className="text-[11px] text-slate-500">
                  Step 2 dikhane se pehle bache se confirmation maangega
                </span>
              </div>
              <input
                type="checkbox"
                checked={socraticCheckWait}
                onChange={(e) => setSocraticCheckWait(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Pacing rules updated and deployed to mobile app!
              </span>
            )}
            <button
              onClick={handleSave}
              className="ml-auto px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Pacing Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
