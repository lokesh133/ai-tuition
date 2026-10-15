'use client';

import React from 'react';
import { X, Printer, Download, BookOpen, Award, CheckCircle2 } from 'lucide-react';

interface SundayExamProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  className?: string;
  board?: string;
  subjectName?: string;
}

export default function PrintableSundayExamModal({
  isOpen,
  onClose,
  studentName = 'राहुल कुमावत',
  className = 'कक्षा 4th',
  board = 'RBSE (राजस्थान बोर्ड)',
  subjectName = 'गणित (Mathematics)',
}: SundayExamProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative my-6 print:m-0 print:shadow-none print:w-full print:rounded-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <div>
              <h3 className="text-sm font-black">संडे साप्ताहिक टेस्ट पेपर (Sunday Practice Paper)</h3>
              <p className="text-[10px] text-slate-300">घर पर अभ्यास हेतु प्रिंट करें या स्क्रीन पर हल करें</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट / PDF निकालें</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE TEST PAPER SHEET */}
        <div className="p-8 md:p-10 space-y-6 bg-white font-serif text-slate-900 border print:border-none print:p-6">
          {/* School Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-wider">
              राजकीय प्राथमिक विद्यालय / {board}
            </h2>
            <h3 className="text-base font-semibold text-slate-800">
              साप्ताहिक मूल्यांकन परीक्षा 2026-27 (Weekly Sunday Test)
            </h3>
            <div className="flex items-center justify-between text-xs font-bold pt-2 px-2">
              <span>विषय: {subjectName}</span>
              <span>{className}</span>
              <span>समय: 1 घंटा</span>
              <span>पूर्णांक (Max Marks): 25</span>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs font-bold bg-slate-50 print:bg-transparent">
            <div>छात्र का नाम: <span className="font-mono text-sm underline decoration-dotted">{studentName}</span></div>
            <div>रोल नंबर: [ .................... ]</div>
            <div>दिनांक: {new Date().toLocaleDateString('hi-IN')}</div>
          </div>

          {/* Section A */}
          <div className="space-y-3">
            <div className="bg-slate-200 px-3 py-1 font-bold text-xs uppercase tracking-wide border border-slate-300">
              खंड 'क' : सही उत्तर चुनिए (Multiple Choice Questions) — (5 × 1 = 5 अंक)
            </div>

            <div className="space-y-3 text-xs leading-relaxed pl-1">
              <div>
                <p>1. संख्या 382 का सही विस्तारित रूप क्या होगा?</p>
                <div className="grid grid-cols-2 gap-2 pt-1 pl-4">
                  <span>(क) 300 + 80 + 2</span>
                  <span>(ख) 30 + 8 + 2</span>
                  <span>(ग) 300 + 8 + 20</span>
                  <span>(घ) 380 + 20</span>
                </div>
              </div>

              <div>
                <p>2. वैदिक गणित में अंक 7 का "परम मित्र" अंक कौन सा होता है?</p>
                <div className="grid grid-cols-4 gap-2 pt-1 pl-4">
                  <span>(क) 2</span>
                  <span>(ख) 3</span>
                  <span>(ग) 5</span>
                  <span>(घ) 8</span>
                </div>
              </div>

              <div>
                <p>3. एक संख्या के सक्सेसर (Successor) और प्रेडिसेसर (Predecessor) का अंतर हमेशा होता है:</p>
                <div className="grid grid-cols-4 gap-2 pt-1 pl-4">
                  <span>(क) 0</span>
                  <span>(ख) 1</span>
                  <span>(ग) 2</span>
                  <span>(घ) 3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B */}
          <div className="space-y-3">
            <div className="bg-slate-200 px-3 py-1 font-bold text-xs uppercase tracking-wide border border-slate-300">
              खंड 'ख' : रिक्त स्थान भरें (Fill in the Blanks) — (5 × 1 = 5 अंक)
            </div>

            <div className="space-y-2 text-xs leading-relaxed pl-1">
              <p>4. 541 और 550 के ठीक बीच में संख्या ................. आएगी।</p>
              <p>5. किसी भी मकान को ऊपर से देखने पर दिखने वाले दृश्य को ................. कहते हैं।</p>
              <p>6. 1921605 में से 1921605 घटाने पर ................. प्राप्त होगा।</p>
              <p>7. दिशू की 6 कॉपियों का मूल्य (यदि 1 कॉपी ₹7 की हो) = ₹ ................. होगा।</p>
            </div>
          </div>

          {/* Section C */}
          <div className="space-y-3">
            <div className="bg-slate-200 px-3 py-1 font-bold text-xs uppercase tracking-wide border border-slate-300">
              खंड 'ग' : सवाल हल कीजिए (Solve with Step-by-Step Working) — (3 × 5 = 15 अंक)
            </div>

            <div className="space-y-4 text-xs leading-relaxed pl-1">
              <div>
                <p className="font-bold">8. किताब का इबारती सवाल (जोड़):</p>
                <p>लोकेश बाजार से ₹567 की घड़ी और ₹280 की टार्च खरीदता है। बताओ उसने कुल कितने रुपये खर्च किए? (चरणबद्ध हल करें)</p>
                <div className="h-16 border-b border-dashed border-slate-400 mt-2"></div>
              </div>

              <div>
                <p className="font-bold">9. तराताई गाँव का घटाव सवाल:</p>
                <p>राजू के परिवार ने 790 मिट्टी के दीपक बनाए और चेतन के परिवार ने 630 दीपक बनाए। राजू के परिवार ने चेतन से कितने अधिक दीपक बनाए?</p>
                <div className="h-16 border-b border-dashed border-slate-400 mt-2"></div>
              </div>

              <div>
                <p className="font-bold">10. वैदिक गणित एकाधिकेन विधि:</p>
                <p>संख्या 28 में अंक 8 के पूर्व अंक 2 पर एकाधिकेन पूर्वेण चिह्न लगाकर नया मान बताइए व नियम लिखिए।</p>
                <div className="h-16 border-b border-dashed border-slate-400 mt-2"></div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
            <div>अभिभावक (Parent) के हस्ताक्षर: ....................</div>
            <div>जांचकर्ता शिक्षक: शर्मा सर (AI Tuition Mentor)</div>
            <div>प्राप्तांक: ............ / 25</div>
          </div>
        </div>
      </div>
    </div>
  );
}
