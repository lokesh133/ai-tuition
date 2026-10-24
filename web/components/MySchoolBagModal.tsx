'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  Plus,
  Layers,
  Award,
} from 'lucide-react';
import { SubjectCurriculum } from '@/lib/curriculum-data';

export interface MySchoolBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSubjects: SubjectCurriculum[];
  selectedSubject: SubjectCurriculum | null;
  onSelectSubject: (sub: SubjectCurriculum) => void;
  currentClass: string;
  currentBoard: string;
  onClassChange?: (cls: string) => void;
  onBoardChange?: (b: 'RBSE' | 'CBSE') => void;
  medium?: string;
}

export const MySchoolBagModal: React.FC<MySchoolBagModalProps> = ({
  isOpen,
  onClose,
  allSubjects,
  selectedSubject,
  onSelectSubject,
  currentClass,
  currentBoard,
  onClassChange,
  onBoardChange,
  medium = 'hindi',
}) => {
  const [activeTab, setActiveTab] = useState<'my_books' | 'add_book'>('my_books');
  const [selectedBookForSubject, setSelectedBookForSubject] = useState<string | null>(null);

  // New Book Upload
  const [newBookName, setNewBookName] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('math');
  const [indexImage, setIndexImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleIndexFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIndexImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadNewBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) {
      alert('कृपया किताब का नाम लिखें!');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/syllabus/book-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_index_photo',
          board: currentBoard,
          className: currentClass,
          subject: selectedSubjectId === 'math' ? 'Mathematics' : selectedSubjectId === 'evs' ? 'EVS / Science' : 'English',
          bookName: newBookName.trim(),
          publisher: newPublisher.trim() || 'Private School Publisher',
          imageBase64: indexImage || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'किताब सफलतापूर्वक आपके बस्ते में जुड़ गई!');
        setNewBookName('');
        setNewPublisher('');
        setIndexImage('');
        setTimeout(() => {
          setActiveTab('my_books');
          setSuccessMsg('');
        }, 1800);
      }
    } catch {
      alert('त्रुटि: दोबारा कोशिश करें!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP KID-FRIENDLY HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/20 text-2xl flex items-center justify-center shadow-xs">
              🎒
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  {medium === 'english' ? 'My Digital School Bag' : 'मेरा डिजिटल बस्ता (स्कूल बैग)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                  {currentClass} • {currentBoard}
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                {medium === 'english'
                  ? 'Your textbooks, chapters & syllabus organized in one place!'
                  : 'आपके स्कूल की किताबें और पाठ! जिस किताब को पढ़ना है, उस पर क्लिक करें।'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-black transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUB-HEADER TABS: My Books vs Add New Book */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('my_books')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'my_books'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>📚</span>
              <span>{medium === 'english' ? 'My Active Books' : 'बस्ते की किताबें'} ({allSubjects.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add_book')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'add_book'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{medium === 'english' ? 'Add Another Book' : '+ नई किताब जोड़ें'}</span>
            </button>
          </div>

          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0-Token Cached</span>
          </span>
        </div>

        {/* BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'my_books' ? (
            <div className="space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {medium === 'english'
                  ? 'Select any textbook to start learning immediately:'
                  : 'पढ़ाई शुरू करने के लिए नीचे दी गई किसी भी किताब पर क्लिक करें:'}
              </span>

              {/* BOOKSHELF GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {allSubjects.map((sub) => {
                  const isCurrent = selectedSubject?.id === sub.id;
                  const totalChaps = sub.chapters?.length || 0;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        onSelectSubject(sub);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:shadow-md'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>सक्रिय (Active)</span>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-amber-500/15 text-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          {sub.emoji}
                        </span>
                        <div className="min-w-0 pr-6">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {sub.subjectHindi} ({sub.subject})
                          </h4>
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 truncate mt-0.5">
                            📖 {sub.bookName || 'पाठ्यपुस्तक'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            मार्गदर्शक: {sub.teacherName} • {totalChaps} पाठ
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {totalChaps} Chapters Ready
                        </span>
                        <span className="text-amber-700 dark:text-amber-300 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>किताब खोलें</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Kid-Friendly Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span className="text-indigo-900 dark:text-indigo-200 font-medium">
                    क्या आपके स्कूल में कोई दूसरी किताब चलती है? आप नीचे बटन दबाकर अपनी किताब जोड़ सकते हैं।
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('add_book')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-black shrink-0 hover:bg-indigo-700 transition-all shadow-xs"
                >
                  + नई किताब जोड़ें
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: ADD BOOK VIA INDEX PHOTO */
            <form onSubmit={handleUploadNewBook} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-900 dark:text-amber-200">
                📌 <strong>इंडेक्स पेज की फोटो खीचें:</strong> अपनी किताब के पहले 1-2 पेजों में दी गई &quot;विषय-सूची (Table of Contents)&quot; की फोटो अपलोड करें। AI सारे चैप्टर्स आपके बस्ते में जोड़ देगा!
              </div>

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    विषय चुनें (Subject):
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="math">गणित (Mathematics)</option>
                    <option value="evs">विज्ञान / पर्यावरण (EVS / Science)</option>
                    <option value="english">अंग्रेजी (English)</option>
                    <option value="hindi">हिंदी (Hindi)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    किताब का नाम (Book Name):
                  </label>
                  <input
                    type="text"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    placeholder="उदा. Living Science, Math Magic, Oxford"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  पब्लिशर का नाम (Publisher, उदा. Ratna Sagar, NCERT, Cordova):
                </label>
                <input
                  type="text"
                  value={newPublisher}
                  onChange={(e) => setNewPublisher(e.target.value)}
                  placeholder="उदा. Ratna Sagar, NCERT, Macmillan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  📸 Index पेज की फोटो (Upload Photo):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIndexFile}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white cursor-pointer"
                />
                {indexImage && (
                  <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                    ✓ Index पेज की फोटो लोड हो गई है!
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('my_books')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-amber-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI इंडेक्स पढ़ रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>बस्ते में शामिल करें</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
