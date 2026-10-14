'use client';

import React, { useState } from 'react';
import { LandingHero } from '../components/LandingHero';
import { InteractiveDemoWidget } from '../components/InteractiveDemoWidget';
import { PricingCard } from '../components/PricingCard';
import {
  Users,
  Camera,
  ShieldAlert,
  MessageSquare,
  ChevronDown,
  Sparkles,
  CheckCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

const FAQS = [
  {
    q: 'Kya AI bache ko galat answers de sakta hai?',
    a: 'Nahi! Humara AI model strict NCERT textbooks aur CBSE syllabus ke vector database par train kiya gaya hai. Isme strict guardrails hain jo galat answers aur internet ki anchaahi information ko block karte hain.',
  },
  {
    q: 'Kya isme screen-time limit set kar sakte hain?',
    a: 'Haan, bilkul! Parent Dashboard me parents daily study limit (e.g., 30 mins, 45 mins ya 60 mins) set kar sakte hain. Limit poori hote hi app bache ko break lene ke liye encourage karta hai.',
  },
  {
    q: 'Subscription kaise cancel karein?',
    a: 'Subscription cancel karna 100% easy hai. Parent Dashboard me "Subscription & Billing" section me jaakar aap 1-click me cancel kar sakte hain. Koi hidden lock-in period nahi hai.',
  },
  {
    q: 'Kya bachha Hinglish me pooch sakta hai?',
    a: 'Ji haan! Bachha Hindi, English, ya aam bolchaal ki bhasha "Hinglish" me bolkar ya type karke sawaal pooch sakta hai. AI teachers usi bhasha me aasaani se explain karte hain.',
  },
];

const TEACHERS = [
  { name: 'Neha Mam', subject: 'Science 🔬', desc: 'Experiments aur biological concepts ko visuals ke saath aasan banati hain.', emoji: '👩‍🔬', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { name: 'Sharma Sir', subject: 'Math 📐', desc: 'Step-by-step calculations, shortcuts aur mental math formulas sikhate hain.', emoji: '👨‍🏫', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Riya Didi', subject: 'English 📚', desc: 'Grammar, sentence formation aur vocabulary building par focus karti hain.', emoji: '👩‍🏫', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Kabir Sir', subject: 'SST & Geography 🌍', desc: 'History aur solar system ki kahaniyon ke zariye curious banate hain.', emoji: '👨‍💼', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Pooja Mam', subject: 'Hindi & Vyakaran ✍️', desc: 'Shuddh uchharan, kavitaayein aur vyakaran ke niyam sikhane me expert.', emoji: '👩‍🎓', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. Hero Section */}
      <LandingHero />

      {/* 2. Live Interactive Demo Widget */}
      <section id="demo" className="py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Live Product Experience
            </span>
            <h2 className="text-3xl font-black text-white mt-3">
              Khel-Khel Me Seekhein Sharma Sir & Neha Mam Ke Saath
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Bache bina jhijhak ke kitni bhi baar sawaal pooch sakte hain.
            </p>
          </div>

          <InteractiveDemoWidget />
        </div>
      </section>

      {/* 3. Features Grid (Why Parents Choose Us) */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-black text-slate-950">
            Kyun 50,000+ Parents Bharosa Karte Hain?
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Mehangi coaching aur tuition classes ke mukable 10x zyada attention aur 90% kam kharcha.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">5 Dedicated AI Teachers</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Science, Math, English, SST aur Hindi ke liye dedicated visual avatars jo Hinglish me step-by-step sikhate hain.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">Instant Homework Scanner</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Notebook ki photo kheenche aur AI turant har step check karke batayega ki kahan mistake hui aur sahi formula kya hai.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">Strict NCERT Guardrails</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sirf CBSE/NCERT syllabus ka content. Koi galat fact ya bina matlab ka internet material bache tak nahi pahuchega.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">Weekly WhatsApp Report</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Har hafte parent ke WhatsApp par scorecard: kitne doubts pooche, kaunsa subject strong hai aur kitna samay padhai ki.
            </p>
          </div>
        </div>
      </section>

      {/* 4. AI Teachers Showcase Carousel */}
      <section id="teachers" className="py-16 bg-slate-100/70 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
              Personalized Attention
            </span>
            <h2 className="text-3xl font-black text-slate-950 mt-2">Miliye Apne AI Teachers Se</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {TEACHERS.map((teacher, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 text-center shadow-sm">
                <div className="text-4xl mb-3">{teacher.emoji}</div>
                <h4 className="font-extrabold text-base text-slate-900">{teacher.name}</h4>
                <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-1 mb-2 ${teacher.color}`}>
                  {teacher.subject}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">{teacher.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl font-black text-slate-950 mt-2">
            Har Bachhe Ke Liye Personal Tutor - Sirf ₹200 / Month
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Pehle 3 din poori tarah free use karein. Pasand na aaye toh bina kisi sawal ke cancel karein.
          </p>
        </div>

        <PricingCard />
      </section>

      {/* 6. FAQ Section */}
      <section id="faqs" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Aksar Pooche Jaane Wale Sawaal (FAQs)</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-5 text-left font-bold text-slate-900 flex justify-between items-center hover:bg-slate-50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-extrabold text-white text-base">AI Tuition App</span>
            <p className="mt-1">Empowering Bharat's students with affordable AI guidance (Class 1st to 8th).</p>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/dashboard" className="hover:text-white">Parent Portal</Link>
            <a href="#privacy" className="hover:text-white">Privacy Policy</a>
            <a href="#terms" className="hover:text-white">Terms of Service</a>
            <a href="#contact" className="hover:text-white">WhatsApp Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
