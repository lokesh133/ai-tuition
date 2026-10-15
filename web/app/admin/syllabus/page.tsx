'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Plus,
  Save,
  Trash2,
  Edit3,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
  ArrowRight,
  Eye,
  X,
  FileCode,
} from 'lucide-react';
import { Chapter, SubjectCurriculum } from '@/lib/curriculum-data';

const CLASSES = [
  'Class 1st',
  'Class 2nd',
  'Class 3rd',
  'Class 4th',
  'Class 5th',
  'Class 6th',
  'Class 7th',
  'Class 8th',
];

const SUBJECT_DEFAULTS = [
  { id: 'math', label: 'गणित (Mathematics)', emoji: '📐', teacher: 'Sharma Sir' },
  { id: 'evs', label: 'पर्यावरण / विज्ञान (EVS/Science)', emoji: '🔬', teacher: 'Neha Mam' },
  { id: 'hindi', label: 'हिंदी (Hindi)', emoji: '✍️', teacher: 'Pooja Mam' },
  { id: 'english', label: 'अंग्रेजी (English)', emoji: '📚', teacher: 'Riya Didi' },
];

export default function AdminSyllabusPage() {
  const [board, setBoard] = useState<'RBSE' | 'CBSE'>('RBSE');
  const [selectedClass, setSelectedClass] = useState<string>('Class 4th');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('evs');

  const [subjectsList, setSubjectsList] = useState<SubjectCurriculum[]>([]);
  const [currentSubject, setCurrentSubject] = useState<SubjectCurriculum | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // AI Generation Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiPromptHint, setAiPromptHint] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiPreviewData, setAiPreviewData] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Edit / Add Chapter Modal State
  const [isChapterModalOpen, setIsChapterModalOpen] = useState<boolean>(false);
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);
  const [chapterFormConcepts, setChapterFormConcepts] = useState<string>('');
  const [chapterFormFormulas, setChapterFormFormulas] = useState<string>('');

  // Expandable chapter details
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // Load syllabus data on change of board/class
  const loadClassSyllabus = async (b: string, c: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/syllabus?board=${b}&class=${encodeURIComponent(c)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.subjects)) {
        setSubjectsList(data.subjects);
        // Find currently selected subject or first
        const match = data.subjects.find(
          (s: any) => s.id.toLowerCase() === selectedSubjectId.toLowerCase()
        );
        setCurrentSubject(match || data.subjects[0] || null);
      }
    } catch (err) {
      console.error('Failed to load syllabus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassSyllabus(board, selectedClass);
  }, [board, selectedClass]);

  // When selectedSubjectId changes, update currentSubject
  useEffect(() => {
    if (subjectsList.length > 0) {
      const match = subjectsList.find(
        (s) => s.id.toLowerCase() === selectedSubjectId.toLowerCase()
      );
      if (match) setCurrentSubject(match);
    }
  }, [selectedSubjectId, subjectsList]);

  // Trigger Save to backend
  const handleSaveSubject = async (subjectToSave = currentSubject) => {
    if (!subjectToSave) return;
    setIsSaving(true);
    setSaveNotification(null);
    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_subject',
          board,
          className: selectedClass,
          subjectId: subjectToSave.id,
          data: subjectToSave,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveNotification('✅ पाठ्यक्रम सफलतापूर्वक सर्वर में सेव हो गया!');
        setTimeout(() => setSaveNotification(null), 4000);
      } else {
        alert('त्रुटि: ' + (data.message || 'पाठ्यक्रम सेव नहीं हो सका।'));
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('त्रुटि: पाठ्यक्रम सेव नहीं हो सका।');
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Gemini AI Generation via API key
  const handleAiGenerate = async () => {
    setIsAiGenerating(true);
    setAiError(null);
    setAiPreviewData(null);
    try {
      const res = await fetch('/api/admin/syllabus/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board,
          className: selectedClass,
          subjectId: selectedSubjectId,
          promptHint: aiPromptHint,
        }),
      });

      const data = await res.json();
      if (data.success && data.generatedSubject) {
        setAiPreviewData(data.generatedSubject);
      } else {
        setAiError(data.message || data.error || 'AI द्वारा सिलेबस जनरेट नहीं हो सका।');
      }
    } catch (err: any) {
      setAiError(err.message || 'नेटवर्क या API एरर');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Apply AI previewed data to current subject
  const applyAiGeneratedSubject = () => {
    if (!aiPreviewData) return;
    const updated: SubjectCurriculum = {
      id: aiPreviewData.subjectId || selectedSubjectId,
      subject: aiPreviewData.subjectName || currentSubject?.subject || 'Subject',
      subjectHindi: aiPreviewData.subjectHindi || currentSubject?.subjectHindi || 'विषय',
      bookName: aiPreviewData.bookName || currentSubject?.bookName || 'Textbook',
      teacherId: (aiPreviewData.teacherId as any) || currentSubject?.teacherId || 'sharma',
      teacherName: aiPreviewData.teacherName || currentSubject?.teacherName || 'Teacher',
      emoji: aiPreviewData.emoji || currentSubject?.emoji || '📚',
      chapters: aiPreviewData.chapters || [],
    };

    setCurrentSubject(updated);
    setSubjectsList((prev) =>
      prev.map((s) => (s.id.toLowerCase() === updated.id.toLowerCase() ? updated : s))
    );
    setIsAiModalOpen(false);
    setAiPreviewData(null);
    // Auto save to persistent file
    handleSaveSubject(updated);
  };

  // Open modal to add new chapter
  const handleOpenAddChapter = () => {
    const nextNum = (currentSubject?.chapters?.length || 0) + 1;
    setEditingChapter({
      id: `${board.toLowerCase()}-${selectedClass.replace(/\s+/g, '').toLowerCase()}-${selectedSubjectId}-${nextNum}`,
      chapterNumber: nextNum,
      titleEnglish: '',
      titleHindi: `अध्याय ${nextNum}: `,
      term: 'half_yearly',
      estimatedMinutes: 45,
      sampleQuestions: [],
    });
    setChapterFormConcepts('');
    setChapterFormFormulas('');
    setIsChapterModalOpen(true);
  };

  // Open modal to edit existing chapter
  const handleOpenEditChapter = (ch: Chapter) => {
    setEditingChapter({ ...ch });
    setChapterFormConcepts(ch.concepts ? ch.concepts.join(', ') : '');
    setChapterFormFormulas(ch.keyFormulas ? ch.keyFormulas.join(', ') : '');
    setIsChapterModalOpen(true);
  };

  // Save chapter from modal into current subject
  const handleSaveChapterFromModal = () => {
    if (!editingChapter || !currentSubject) return;

    const conceptsArr = chapterFormConcepts
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const formulasArr = chapterFormFormulas
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const updatedChapter: Chapter = {
      id: editingChapter.id || `ch-${Date.now()}`,
      chapterNumber: Number(editingChapter.chapterNumber) || 1,
      titleEnglish: editingChapter.titleEnglish || 'New Chapter',
      titleHindi: editingChapter.titleHindi || 'नया पाठ',
      concepts: conceptsArr,
      keyFormulas: formulasArr,
      term: (editingChapter.term as any) || 'half_yearly',
      estimatedMinutes: Number(editingChapter.estimatedMinutes) || 45,
      sampleQuestions: editingChapter.sampleQuestions || [],
    };

    let newChapters = [...(currentSubject.chapters || [])];
    const existsIdx = newChapters.findIndex((c) => c.id === updatedChapter.id);
    if (existsIdx >= 0) {
      newChapters[existsIdx] = updatedChapter;
    } else {
      newChapters.push(updatedChapter);
    }
    newChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    const updatedSub: SubjectCurriculum = {
      ...currentSubject,
      chapters: newChapters,
    };

    setCurrentSubject(updatedSub);
    setSubjectsList((prev) =>
      prev.map((s) => (s.id.toLowerCase() === updatedSub.id.toLowerCase() ? updatedSub : s))
    );
    setIsChapterModalOpen(false);
    handleSaveSubject(updatedSub);
  };

  // Delete chapter
  const handleDeleteChapter = (chId: string) => {
    if (!currentSubject) return;
    if (!confirm('क्या आप वाकई इस पाठ को हटाना चाहते हैं?')) return;

    const filtered = currentSubject.chapters.filter((c) => c.id !== chId);
    const updatedSub: SubjectCurriculum = {
      ...currentSubject,
      chapters: filtered,
    };
    setCurrentSubject(updatedSub);
    setSubjectsList((prev) =>
      prev.map((s) => (s.id.toLowerCase() === updatedSub.id.toLowerCase() ? updatedSub : s))
    );
    handleSaveSubject(updatedSub);
  };

  // Export JSON file
  const handleExportJson = () => {
    if (!currentSubject) return;
    const blob = new Blob([JSON.stringify(currentSubject, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RBSE_${selectedClass.replace(/\s+/g, '_')}_${currentSubject.id}_Syllabus.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.chapters && Array.isArray(parsed.chapters)) {
          const updated: SubjectCurriculum = {
            id: parsed.id || currentSubject?.id || selectedSubjectId,
            subject: parsed.subject || currentSubject?.subject || 'Subject',
            subjectHindi: parsed.subjectHindi || currentSubject?.subjectHindi || 'विषय',
            bookName: parsed.bookName || currentSubject?.bookName || 'Textbook',
            teacherId: parsed.teacherId || currentSubject?.teacherId || 'sharma',
            teacherName: parsed.teacherName || currentSubject?.teacherName || 'Teacher',
            emoji: parsed.emoji || currentSubject?.emoji || '📚',
            chapters: parsed.chapters,
          };
          setCurrentSubject(updated);
          handleSaveSubject(updated);
          alert('✅ JSON पाठ्यक्रम सफलतापूर्वक अपलोड हो गया!');
        } else {
          alert('अमान्य JSON फ़ॉर्मेट: "chapters" एरे होना आवश्यक है।');
        }
      } catch (err) {
        alert('JSON फ़ाइल पढ़ने में त्रुटि: अमान्य सिंटैक्स');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              RBSE & CBSE पाठ्यक्रम प्रबंधन (Syllabus CMS)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              कक्षा 1st से 8th
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            राजस्थान बोर्ड (RBSE) और CBSE की आधिकारिक पुस्तकों का लाइव पाठ्यक्रम डेटाबेस। आप इसे 
            <strong className="text-indigo-300 font-semibold"> Gemini API Key </strong>
            से ऑटो-जनरेट / सिंक कर सकते हैं, या सीधे 
            <strong className="text-emerald-300 font-semibold"> एडमिन से मैन्युअल एडिट और अपलोड </strong> 
            कर सकते हैं।
          </p>
        </div>

        {/* Global Dual Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI से सिंक करें (API Key)</span>
          </button>

          <button
            onClick={() => handleSaveSubject()}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'सेव हो रहा है...' : 'बदलाव सुरक्षित करें'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveNotification}</span>
          </div>
          <button
            onClick={() => setSaveNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Class Selector Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">बोर्ड:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setBoard('RBSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                board === 'RBSE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RBSE (राजस्थान बोर्ड)
            </button>
            <button
              onClick={() => setBoard('CBSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                board === 'CBSE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CBSE
            </button>
          </div>
        </div>

        {/* Classes Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CLASSES.map((cls) => {
            const isSelected = selectedClass === cls;
            const isClass4 = cls === 'Class 4th';
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-900 text-white border-indigo-950 shadow-sm'
                    : isClass4
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cls} {isClass4 && '⭐'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUBJECT_DEFAULTS.map((subDef) => {
          const isSelected = selectedSubjectId.toLowerCase() === subDef.id.toLowerCase();
          const liveSub = subjectsList.find((s) => s.id.toLowerCase() === subDef.id.toLowerCase());
          const chapterCount = liveSub?.chapters?.length || 0;

          return (
            <button
              key={subDef.id}
              onClick={() => setSelectedSubjectId(subDef.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{subDef.emoji}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {chapterCount} पाठ
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                {subDef.label}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <span>{subDef.teacher}</span>
              </p>
            </button>
          );
        })}
      </div>

      {/* Subject Editor Card */}
      {currentSubject ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header with Book Name & Fast Action Toolbar */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentSubject.emoji}</span>
                <h2 className="text-base font-extrabold text-slate-900">
                  {currentSubject.subjectHindi} ({currentSubject.subject})
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black">
                  {selectedClass}
                </span>
              </div>

              {/* Editable Book Name */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">पुस्तक का नाम:</span>
                <input
                  type="text"
                  value={currentSubject.bookName}
                  onChange={(e) => {
                    const updated = { ...currentSubject, bookName: e.target.value };
                    setCurrentSubject(updated);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 max-w-md"
                  placeholder="आधिकारिक पुस्तक का नाम लिखें..."
                />
              </div>
            </div>

            {/* Actions for current subject */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenAddChapter}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>नया पाठ जोड़ें</span>
              </button>

              <button
                onClick={handleExportJson}
                title="JSON फ़ाइल डाउनलोड करें"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>

              <label
                title="JSON फ़ाइल से पाठ अपलोड करें"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>अपलोड</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Chapters Table / Cards */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700">कुल पाठ:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-200">
                  {currentSubject.chapters?.length || 0} Chapters
                </span>
                {selectedClass === 'Class 4th' && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    आधिकारिक RBSE पाठ्यक्रम लोड है
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                क्रम या पाठ के विवरण बदलने के लिए "एडिट" पर क्लिक करें
              </p>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-semibold">पाठ्यक्रम लोड हो रहा है...</p>
              </div>
            ) : !currentSubject.chapters || currentSubject.chapters.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  इस विषय में अभी कोई पाठ नहीं जुड़े हैं।
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  आप ऊपर <strong>"AI से सिंक करें (API Key)"</strong> बटन दबाकर पूरे राजस्थान बोर्ड
                  पाठ्यक्रम को 1 क्लिक में ला सकते हैं, या <strong>"नया पाठ जोड़ें"</strong> से खुद
                  लिख सकते हैं।
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI से ऑटो-जनरेट करें</span>
                  </button>
                  <button
                    onClick={handleOpenAddChapter}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>मैन्युअल जोड़ें</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentSubject.chapters.map((ch, idx) => {
                  const isExpanded = expandedChapterId === ch.id;

                  return (
                    <div
                      key={ch.id || idx}
                      className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                            {ch.chapterNumber || idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-900">
                                {ch.titleHindi}
                              </h4>
                              {ch.term && (
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    ch.term === 'half_yearly'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {ch.term === 'half_yearly' ? 'अर्धवार्षिक' : 'वार्षिक'}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                ⏱️ {ch.estimatedMinutes || 45} min
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {ch.titleEnglish}
                            </p>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-1.5 self-end md:self-center">
                          <button
                            onClick={() =>
                              setExpandedChapterId(isExpanded ? null : ch.id)
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{isExpanded ? 'कम देखें' : 'विस्तार'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenEditChapter(ch)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200"
                            title="पाठ संपादित करें"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteChapter(ch.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
                            title="हटाएं"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Concept Tags */}
                      {ch.concepts && ch.concepts.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400">कॉन्सेप्ट्स:</span>
                          {ch.concepts.map((concept, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expanded View: Formulas and Sample Questions */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 bg-slate-50/70 p-3 rounded-xl">
                          {ch.keyFormulas && ch.keyFormulas.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                                मुख्य सूत्र / नियम:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {ch.keyFormulas.map((f, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className="font-mono text-xs bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md"
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {ch.sampleQuestions && ch.sampleQuestions.length > 0 ? (
                            <div>
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                मॉडल प्रश्न (Sample Whiteboard Questions):
                              </span>
                              <div className="space-y-2">
                                {ch.sampleQuestions.map((q, qIdx) => (
                                  <div
                                    key={qIdx}
                                    className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs"
                                  >
                                    <div className="font-bold text-slate-900">
                                      प्र. {qIdx + 1}: {q.question}
                                    </div>
                                    {q.options && (
                                      <div className="grid grid-cols-2 gap-1 mt-1 text-[11px] text-slate-600">
                                        {q.options.map((opt, oIdx) => (
                                          <span key={oIdx} className="bg-slate-50 px-2 py-0.5 rounded">
                                            {opt}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
                                      उत्तर: {q.correctAnswer}
                                    </div>
                                    {q.explanation && (
                                      <p className="text-[10px] text-slate-500 mt-0.5 italic">
                                        व्याख्या: {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              इस पाठ के लिए अभी कोई मॉडल प्रश्न नहीं हैं।
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ==================================================== */}
      {/* MODAL 1: AI SYLLABUS GENERATION VIA GEMINI API KEY */}
      {/* ==================================================== */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Gemini API Key से पाठ्यक्रम ऑटो-जनरेट / सिंक
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {board} &bull; {selectedClass} &bull; {selectedSubjectId.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Generator Info */}
            <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl text-xs text-indigo-900 leading-relaxed">
              <p className="font-bold mb-1 flex items-center gap-1.5 text-indigo-950">
                <span>🤖</span> Google Gemini Live Vision & Curriculum Engine:
              </p>
              यह फीचर सीधे आपके <strong>GEMINI_API_KEY</strong> के जरिए राजस्थान माध्यमिक शिक्षा बोर्ड 
              (RBSE) और NCERT के आधिकारिक पाठ्यक्रम, पाठ्यपुस्तक के नाम, अध्यायों की सूची, मुख्य सूत्रों 
              और मॉडल प्रश्नों को सेकंडों में तैयार करता है।
            </div>

            {/* Custom Instructions Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                अतिरिक्त निर्देश / पुस्तक का नाम (वैकल्पिक):
              </label>
              <textarea
                value={aiPromptHint}
                onChange={(e) => setAiPromptHint(e.target.value)}
                placeholder="उदा: पुस्तक का नाम 'अपना परिवेश' रखें, 21 अध्याय लाएं या खास अध्यायों पर जोर दें..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={2}
              />
            </div>

            {/* Generation Status & Error */}
            {aiError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Preview of Generated Syllabus */}
            {aiPreviewData && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="font-extrabold text-xs text-slate-900">
                    {aiPreviewData.subjectHindi} &bull; पुस्तक: {aiPreviewData.bookName}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    {aiPreviewData.chapters?.length || 0} पाठ जनरेट हुए
                  </span>
                </div>

                <div className="space-y-1.5">
                  {aiPreviewData.chapters?.map((ch: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-indigo-700 mr-2">
                          {ch.chapterNumber || idx + 1}.
                        </span>
                        <span className="font-bold text-slate-900">{ch.titleHindi}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">
                          ({ch.titleEnglish})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {ch.concepts?.length || 0} कॉन्सेप्ट्स
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                रद्द करें
              </button>

              {aiPreviewData ? (
                <button
                  onClick={applyAiGeneratedSubject}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>यह सिलेबस लागू करें (Apply to Subject)</span>
                </button>
              ) : (
                <button
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Gemini API से प्राप्त हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>सिलेबस जनरेट करें</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: ADD / EDIT CHAPTER MANUALLY */}
      {/* ==================================================== */}
      {isChapterModalOpen && editingChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  {editingChapter.chapterNumber || 'New'}
                </div>
                <h3 className="font-black text-base text-slate-900">
                  {editingChapter.id?.includes('new') || !editingChapter.titleEnglish
                    ? 'नया पाठ जोड़ें (Add Chapter)'
                    : 'पाठ संपादित करें (Edit Chapter)'}
                </h3>
              </div>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Chapter Number & Term */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">पाठ क्रमांक (Number):</label>
                  <input
                    type="number"
                    value={editingChapter.chapterNumber || 1}
                    onChange={(e) =>
                      setEditingChapter({
                        ...editingChapter,
                        chapterNumber: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">परीक्षा अवधि (Term):</label>
                  <select
                    value={editingChapter.term || 'half_yearly'}
                    onChange={(e) =>
                      setEditingChapter({
                        ...editingChapter,
                        term: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="half_yearly">अर्धवार्षिक परीक्षा (Half Yearly)</option>
                    <option value="annual">वार्षिक परीक्षा (Annual Exam)</option>
                  </select>
                </div>
              </div>

              {/* Hindi Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">पाठ का नाम (हिंदी में):</label>
                <input
                  type="text"
                  value={editingChapter.titleHindi || ''}
                  onChange={(e) =>
                    setEditingChapter({ ...editingChapter, titleHindi: e.target.value })
                  }
                  placeholder="उदा: अध्याय 1: एक सुखद परिवार"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* English Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chapter Title (English):</label>
                <input
                  type="text"
                  value={editingChapter.titleEnglish || ''}
                  onChange={(e) =>
                    setEditingChapter({ ...editingChapter, titleEnglish: e.target.value })
                  }
                  placeholder="e.g. Chapter 1: A Happy Family (Family & Relationships)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800"
                />
              </div>

              {/* Concepts */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  मुख्य अवधारणाएं (कॉमा लगाकर लिखें):
                </label>
                <input
                  type="text"
                  value={chapterFormConcepts}
                  onChange={(e) => setChapterFormConcepts(e.target.value)}
                  placeholder="उदा: एकल परिवार, संयुक्त परिवार, पारिवारिक रिश्ते"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Key Formulas / Rules */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  मुख्य सूत्र / नियम (गणित या विज्ञान हेतु कॉमा लगाकर):
                </label>
                <input
                  type="text"
                  value={chapterFormFormulas}
                  onChange={(e) => setChapterFormFormulas(e.target.value)}
                  placeholder="उदा: 1 किग्रा = 1000 ग्राम, आयत का परिमाप = 2 × (लंबाई + चौड़ाई)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                रद्द करें
              </button>
              <button
                onClick={handleSaveChapterFromModal}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>पाठ सहेजें (Save Chapter)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
