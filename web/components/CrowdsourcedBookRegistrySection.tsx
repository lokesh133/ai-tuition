'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  Search,
  Volume2,
  Zap,
  Plus,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';

export interface RegisteredBook {
  id: string;
  board: string;
  class: string;
  subject: string;
  bookName: string;
  publisher?: string;
  language?: string;
  totalChapters: number;
  verified?: boolean;
  uploadedBy?: string;
  chapters: {
    chapterNumber: number;
    title: string;
    concept?: string;
    units?: string;
  }[];
}

export const CrowdsourcedBookRegistrySection: React.FC = () => {
  const [board, setBoard] = useState('RBSE');
  const [className, setClassName] = useState('Class 4th');
  const [subject, setSubject] = useState('Mathematics');

  const [books, setBooks] = useState<RegisteredBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<RegisteredBook | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // New Book Index Upload State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [newBookName, setNewBookName] = useState<string>('');
  const [newPublisher, setNewPublisher] = useState<string>('');
  const [indexImageBase64, setIndexImageBase64] = useState<string>('');
  const [indexText, setIndexText] = useState<string>('');
  const [isProcessingIndex, setIsProcessingIndex] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ message: string; isCached: boolean } | null>(null);

  // Voice Explanation State
  const [playingChapterTitle, setPlayingChapterTitle] = useState<string | null>(null);
  const [voiceExplanationScript, setVoiceExplanationScript] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch matching books whenever filters change
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/syllabus/book-registry?board=${encodeURIComponent(board)}&class=${encodeURIComponent(
          className
        )}&subject=${encodeURIComponent(subject)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.books)) {
        setBooks(data.books);
        if (data.books.length > 0) {
          setSelectedBook(data.books[0]);
        } else {
          setSelectedBook(null);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [board, className, subject]);

  // Handle Photo selection for Index
  const handleIndexFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setIndexImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Index to AI (1-time token, cached forever)
  const handleUploadIndexSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) {
      alert('कृपया किताब का नाम लिखें!');
      return;
    }

    setIsProcessingIndex(true);
    setUploadFeedback(null);

    try {
      const res = await fetch('/api/syllabus/book-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_index_photo',
          board,
          className,
          subject,
          bookName: newBookName.trim(),
          publisher: newPublisher.trim() || 'Private Publisher',
          imageBase64: indexImageBase64 || undefined,
          indexText: indexText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.book) {
        setUploadFeedback({
          message: data.message,
          isCached: data.cached,
        });
        setSelectedBook(data.book);
        fetchBooks();
        setNewBookName('');
        setNewPublisher('');
        setIndexImageBase64('');
        setIndexText('');
      } else {
        alert(data.error || 'इंडेक्स प्रोसेस नहीं हो पाया, दोबारा कोशिश करें!');
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setIsProcessingIndex(false);
    }
  };

  // Play Chapter Concept Voice Explanation (4-step pedagogical hook)
  const handleExplainChapterVoice = async (chap: { title: string; concept?: string }) => {
    setPlayingChapterTitle(chap.title);
    setVoiceExplanationScript(null);

    try {
      const res = await fetch('/api/syllabus/book-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_chapter_voice',
          chapterTitle: chap.title,
          subject,
          className,
        }),
      });

      const data = await res.json();
      if (data.success && data.speechScript) {
        setVoiceExplanationScript(data.speechScript);

        // Play via TTS
        if (typeof window !== 'undefined') {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(data.speechScript);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.9;
            utterance.onend = () => setPlayingChapterTitle(null);
            utterance.onerror = () => setPlayingChapterTitle(null);
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    } catch {
      setPlayingChapterTitle(null);
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingChapterTitle(null);
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-700 font-black text-xs flex items-center gap-1.5 border border-amber-500/20">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>0-Token Deduplication & Shared Library</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              विद्या क्राउडसोर्स्ड बुक रजिस्ट्री
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            📚 सभी किताबों का सिलेबस रिपॉजिटरी (Token Saver Hub)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            जब कोई भी छात्र अपनी किताब के <strong>इंडेक्स (विषय-सूची) पेज</strong> की एक फोटो अपलोड करता है, तो AI उसे एक बार प्रोसेस करके लाइब्रेरी में सेव कर देता है। बाद में अन्य सभी छात्रों को वही सिलेबस <strong>0 टोकन (100% फ्री)</strong> में तुरंत मिल जाता है!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(!isUploadOpen)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 self-start sm:self-auto shrink-0"
        >
          <Camera className="w-4 h-4" />
          <span>{isUploadOpen ? 'फॉर्म बंद करें' : '📸 नया बुक इंडेक्स जोड़ें'}</span>
        </button>
      </div>

      {/* FILTER BAR: Board, Class, Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
            1. बोर्ड (Board)
          </label>
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="RBSE">RBSE (राजस्थान बोर्ड)</option>
            <option value="CBSE">CBSE (सेंट्रल बोर्ड)</option>
            <option value="ICSE">ICSE</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
            2. कक्षा (Grade / Class)
          </label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Class 1st">Class 1st</option>
            <option value="Class 2nd">Class 2nd</option>
            <option value="Class 3rd">Class 3rd</option>
            <option value="Class 4th">Class 4th</option>
            <option value="Class 5th">Class 5th</option>
            <option value="Class 6th">Class 6th</option>
            <option value="Class 7th">Class 7th</option>
            <option value="Class 8th">Class 8th</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
            3. विषय (Subject)
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Mathematics">Mathematics (गणित)</option>
            <option value="EVS / Science">EVS / Science (पर्यावरण व विज्ञान)</option>
            <option value="English">English (अंग्रेजी)</option>
            <option value="Hindi">Hindi (हिंदी)</option>
          </select>
        </div>
      </div>

      {/* NEW BOOK INDEX UPLOAD MODAL/PANEL */}
      {isUploadOpen && (
        <form
          onSubmit={handleUploadIndexSubmit}
          className="p-5 rounded-3xl bg-indigo-50/70 border-2 border-dashed border-indigo-300 space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-indigo-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-indigo-600" />
              <span>किताब के Index पेज की फोटो अपलोड करें (Crowdsource Syllabus)</span>
            </h3>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              ⚡️ Token x1 (Always Cached Forever)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                किताब का नाम (Book Name):
              </label>
              <input
                type="text"
                value={newBookName}
                onChange={(e) => setNewBookName(e.target.value)}
                placeholder="उदा. Living Science, Apna Parivesh, Math-Magic"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                पब्लिशर या बोर्ड (Publisher / Board):
              </label>
              <input
                type="text"
                value={newPublisher}
                onChange={(e) => setNewPublisher(e.target.value)}
                placeholder="उदा. Ratna Sagar, NCERT, Oxford, RSCERT"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                📸 Index पेज की फोटो (Upload Photo):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleIndexFileChange}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
              {indexImageBase64 && (
                <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                  ✓ फोटो लोड हो गई है!
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                या विषय-सूची के चैप्टर टाइप करें (Optional Text):
              </label>
              <textarea
                value={indexText}
                onChange={(e) => setIndexText(e.target.value)}
                rows={2}
                placeholder="Ch 1: Fractions, Ch 2: Evaporation, Ch 3: Measurement..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={isProcessingIndex}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              {isProcessingIndex ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI इंडेक्स प्रोसेस कर रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>इंडेक्स प्रोसेस करें व सेंट्रल लाइब्रेरी में सेव करें</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* FEEDBACK BANNER */}
      {uploadFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
            uploadFeedback.isCached
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold">{uploadFeedback.message}</p>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-white border shrink-0">
            {uploadFeedback.isCached ? '⚡️ 0 Tokens (Reused)' : '✨ Token Saved for Future'}
          </span>
        </div>
      )}

      {/* MAIN TWO-COLUMN DISPLAY: Books List & Chapters View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Registered Books in this Subject */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
            मौजूद किताबें (Available Books - {books.length})
          </span>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">किताबें लोड हो रही हैं...</div>
          ) : books.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <span className="text-2xl block">📖</span>
              <p className="text-xs font-bold text-slate-600">
                इस क्लास व सब्जेक्ट में अभी कोई किताब दर्ज नहीं है।
              </p>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="text-xs text-indigo-600 font-black hover:underline"
              >
                + पहली किताब का इंडेक्स अपलोड करें
              </button>
            </div>
          ) : (
            books.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBook(b)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedBook?.id === b.id
                    ? 'bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-400'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">
                    📖
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {b.bookName}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate">
                      {b.publisher || b.board} • {b.totalChapters} पाठ (Chapters)
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  ⚡️ 0 Tokens
                </span>
              </div>
            ))
          )}
        </div>

        {/* Right: Selected Book's Chapters & Voice Concept Explainer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedBook ? (
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {selectedBook.bookName}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {selectedBook.board}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    पब्लिशर: {selectedBook.publisher || 'Official Board'} | कुल पाठ: {selectedBook.totalChapters}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {playingChapterTitle && (
                    <button
                      type="button"
                      onClick={handleStopSpeech}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
                    >
                      ⏹️ आवाज़ रोकें
                    </button>
                  )}
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>सभी छात्रों के लिए कैश सेव्ड</span>
                  </span>
                </div>
              </div>

              {/* Live Voice Concept Explanation Banner */}
              {voiceExplanationScript && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-y-2 animate-fade-in shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-blue-200">
                      <Volume2 className="w-4 h-4 animate-pulse text-amber-300" />
                      शिक्षिका द्वारा पाठ परिचय व संकल्पना व्याख्या (4-Step Voice Pedagogy)
                    </span>
                    <button
                      type="button"
                      onClick={handleStopSpeech}
                      className="text-xs font-bold text-blue-200 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed bg-white/10 p-3 rounded-xl border border-white/20">
                    &quot;{voiceExplanationScript}&quot;
                  </p>
                </div>
              )}

              {/* Chapters List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {selectedBook.chapters.map((chap, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {chap.chapterNumber}
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          {chap.title}
                        </h5>
                        {chap.concept && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            अवधारणा: {chap.concept} {chap.units ? `• इकाइयाँ: ${chap.units}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExplainChapterVoice(chap)}
                      disabled={playingChapterTitle === chap.title}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                        playingChapterTitle === chap.title
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                      title="शिक्षिका से इस पाठ का परिचय बोलकर सुनें"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{playingChapterTitle === chap.title ? 'बोल रहे हैं...' : '🔊 पाठ परिचय सुनें'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed">
              कृपया बाईं तरफ से कोई किताब चुनें या नई किताब का इंडेक्स अपलोड करें।
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
