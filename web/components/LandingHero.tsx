import React from 'react';
import Link from 'next/link';
import { Sparkles, Play, ShieldCheck, Flame, Star, BookOpen, Clock } from 'lucide-react';

export const LandingHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 md:pt-10 md:pb-24">
      {/* Decorative gradient glow blobs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-orange-400/10 to-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between pb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30">
              AI
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">AI Tuition App</span>
              <span className="ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Class 1–8
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#demo" className="hover:text-indigo-600 transition-colors">Live Demo</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#teachers" className="hover:text-indigo-600 transition-colors">AI Teachers</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing (₹200/mo)</a>
            <a href="#faqs" className="hover:text-indigo-600 transition-colors">FAQs</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs md:text-sm hover:bg-slate-100 transition-all"
            >
              Parent Portal
            </Link>
            <Link
              href="/tutor"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm shadow-md shadow-emerald-600/20 transition-all hidden sm:inline-block"
            >
              Free Beta Access
            </Link>
          </div>
        </header>

        {/* Hero Central Content */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-6">
            <Flame className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>Open Beta Testing Active • 100% Free Access</span>
          </div>

          {/* Catchy Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Class 1st se 8th Tak Ka{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-indigo-600 to-purple-600">
              Personal AI Tutor
            </span>{' '}
            Ab Testing Ke Liye Free!
          </h1>

          {/* Sub-headline */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Real-time Voice Doubts, Homework Scanner, aur 100% RBSE/CBSE Syllabus Aligned Learning Neha Mam, Sharma Sir aur Riya Didi ke saath.
          </p>

          {/* Dual CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/tutor"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <span>Launch AI Teacher Classroom</span>
            </Link>

            <Link
              href="/tutor"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Start Free Beta Learning</span>
            </Link>
          </div>

          {/* Micro Trust Banner */}
          <div className="mt-10 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% CBSE & NCERT Aligned</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>24/7 Voice Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>0% Social Media Distraction</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
