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
  FileText,
  SplitSquareVertical,
  CheckCircle,
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

  // 150+ Page Textbook PDF Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [bookUploadFileName, setBookUploadFileName] = useState<string>('RBSE_Class4_Ganit_Textbook.pdf');
  const [bookUploadFileSize, setBookUploadFileSize] = useState<string>('18.5 MB');
  const [bookUploadTotalPages, setBookUploadTotalPages] = useState<number>(150);
  const [bookUploadNotes, setBookUploadNotes] = useState<string>('');
  const [isParsingBook, setIsParsingBook] = useState<boolean>(false);
  const [bookParseSuccess, setBookParseSuccess] = useState<string | null>(null);
  const [bookParseError, setBookParseError] = useState<string | null>(null);

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

  // Add Subject Modal State
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectHindi, setNewSubjectHindi] = useState<string>('');
  const [newSubjectBook, setNewSubjectBook] = useState<string>('');
  const [newSubjectTeacher, setNewSubjectTeacher] = useState<string>('शर्मा सर');
  const [newSubjectEmoji, setNewSubjectEmoji] = useState<string>('💻');

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
        const activeSub = match || data.subjects[0] || null;
        setCurrentSubject(activeSub);
        if (activeSub) {
          setSelectedSubjectId(activeSub.id);
        }
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

  // Add New Subject to Class
  const handleAddNewSubject = async () => {
    if (!newSubjectName.trim()) {
      alert('कृपया विषय का नाम (English) दर्ज करें।');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_subject',
          board,
          className: selectedClass,
          data: {
            subject: newSubjectName.trim(),
            subjectHindi: newSubjectHindi.trim() || newSubjectName.trim(),
            bookName: newSubjectBook.trim() || `${newSubjectHindi || newSubjectName} - ${selectedClass}`,
            teacherName: newSubjectTeacher,
            emoji: newSubjectEmoji,
            chapters: [],
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddSubjectModalOpen(false);
        setNewSubjectName('');
        setNewSubjectHindi('');
        setNewSubjectBook('');
        await loadClassSyllabus(board, selectedClass);
        if (data.subject?.id) {
          setSelectedSubjectId(data.subject.id);
        }
        alert(`✅ विषय "${newSubjectHindi || newSubjectName}" सफलतापूर्वक जोड़ा गया! अब आप इसमें चैप्टर्स जोड़ सकते हैं।`);
      } else {
        alert(data.message || 'विषय जोड़ने में त्रुटि हुई।');
      }
    } catch (err: any) {
      alert('त्रुटि हुई: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Subject from Class
  const handleDeleteSubject = async (subId: string, subName: string) => {
    if (!confirm(`क्या आप वाकई विषय "${subName}" को ${selectedClass} से हटाना चाहते हैं?`)) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_subject',
          board,
          className: selectedClass,
          subjectId: subId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('विषय सफलतापूर्वक हटा दिया गया।');
        await loadClassSyllabus(board, selectedClass);
      } else {
        alert(data.message || 'विषय हटाने में त्रुटि हुई।');
      }
    } catch (err: any) {
      alert('त्रुटि हुई: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

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

  // Trigger 150+ Page Textbook PDF Parsing & Auto-Indexing
  const handleParseAndIndexBook = async () => {
    if (!currentSubject) return;
    setIsParsingBook(true);
    setBookParseError(null);
    setBookParseSuccess(null);
    try {
      const res = await fetch('/api/admin/syllabus/parse-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board,
          className: selectedClass,
          subjectId: currentSubject.id,
          bookName: currentSubject.bookName || `${currentSubject.subjectHindi} (${selectedClass})`,
          bookPdfName: bookUploadFileName || `${selectedClass}_${currentSubject.id}_Textbook.pdf`,
          bookPdfSize: bookUploadFileSize,
          totalPages: Number(bookUploadTotalPages) || 150,
          notes: bookUploadNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.subject) {
        setCurrentSubject(data.subject);
        setSubjectsList((prev) =>
          prev.map((s) => (s.id.toLowerCase() === data.subject.id.toLowerCase() ? data.subject : s))
        );
        setBookParseSuccess(data.message || `✅ ${bookUploadTotalPages} पेज की पुस्तक सफलतापूर्वक इंडेक्स हो गई!`);
        setTimeout(() => {
          setIsBookModalOpen(false);
          setBookParseSuccess(null);
        }, 2200);
      } else {
        setBookParseError(data.error || data.message || 'पुस्तक इंडेक्स नहीं हो सकी।');
      }
    } catch (err: any) {
      setBookParseError(err.message || 'नेटवर्क या सर्वर एरर');
    } finally {
      setIsParsingBook(false);
    }
  };

  // Open modal to add new chapter
  const handleOpenAddChapter = () => {
    const nextNum = (currentSubject?.chapters?.length || 0) + 1;
    const lastChapter = currentSubject?.chapters?.[currentSubject.chapters.length - 1];
    const nextStartPage = lastChapter?.endPage ? lastChapter.endPage + 1 : 1;
    const nextEndPage = nextStartPage + 11;

    setEditingChapter({
      id: `${board.toLowerCase()}-${selectedClass.replace(/\s+/g, '').toLowerCase()}-${selectedSubjectId}-${nextNum}`,
      chapterNumber: nextNum,
      titleEnglish: '',
      titleHindi: `अध्याय ${nextNum}: `,
      term: 'half_yearly',
      estimatedMinutes: 45,
      startPage: nextStartPage,
      endPage: nextEndPage,
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
      startPage: editingChapter.startPage !== undefined ? Number(editingChapter.startPage) : undefined,
      endPage: editingChapter.endPage !== undefined ? Number(editingChapter.endPage) : undefined,
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

      {/* Subject Tabs Header & Dynamic List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span>{selectedClass} के सभी विषय ({subjectsList.length})</span>
            <span className="text-[10px] text-slate-400 font-semibold">(क्लिक करके सेलेक्ट करें)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ नया विषय जोड़ें ({selectedClass})</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {subjectsList.map((sub) => {
            const isSelected = selectedSubjectId.toLowerCase() === sub.id.toLowerCase();
            const chapterCount = sub.chapters?.length || 0;

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-[1.02]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{sub.emoji || '📚'}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {chapterCount} पाठ
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight line-clamp-1">
                    {sub.subjectHindi || sub.subject}
                  </h3>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {sub.subject}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1 pt-1.5 border-t border-slate-100">
                  <GraduationCap className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">{sub.teacherName || 'शिक्षक'}</span>
                </p>
              </button>
            );
          })}

          {/* Quick Add Subject Card in grid */}
          <button
            type="button"
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="p-3.5 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/90 text-indigo-700 flex flex-col items-center justify-center gap-1.5 transition-all text-center min-h-[115px] group"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-600 group-hover:text-white" />
            </div>
            <div className="text-xs font-black">+ विषय जोड़ें</div>
            <div className="text-[10px] text-indigo-500">Computer, Sanskrit आदि</div>
          </button>
        </div>
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
                onClick={() => {
                  setBookUploadTotalPages(currentSubject.totalPages || 150);
                  setBookUploadFileName(currentSubject.bookPdfName || `${selectedClass}_${currentSubject.subject}_Textbook.pdf`);
                  setIsBookModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-blue-200" />
                <span>📖 150+ पेज PDF अपलोड व इंडेक्सिंग</span>
              </button>

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

              <button
                type="button"
                onClick={() => handleDeleteSubject(currentSubject.id, currentSubject.subjectHindi || currentSubject.subject)}
                title="इस विषय को इस क्लास से हटाएं"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>विषय हटाएं</span>
              </button>
            </div>
          </div>

          {/* 150+ Page Master Textbook & AI Chunking Overview Banner */}
          <div className="mx-5 mt-5 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-400" />
                    <span>Master Textbook PDF System</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                    📄 {currentSubject.bookPdfName || `${selectedClass}_${currentSubject.subject}_Textbook.pdf`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>कुल {currentSubject.totalPages || 150} पेज (1 से 8th क्लास)</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-emerald-400">⚡ AI Smart Page Chunking:</strong> जब छात्र इस विषय में कोई सवाल पूछता है, तो AI पूरी 150 पेज की किताब पढ़ने के बजाय सिर्फ संबंधित पाठ के <strong>10–12 पेज</strong> का संदर्भ लेता है। इससे AI का जवाब तत्काल और 100% पाठ्यपुस्तक के अनुसार आता है।
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setBookUploadTotalPages(currentSubject.totalPages || 150);
                    setBookUploadFileName(currentSubject.bookPdfName || `${selectedClass}_${currentSubject.subject}_Textbook.pdf`);
                    setIsBookModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-200" />
                  <span>पेज रेंज इंडेक्स बदलें</span>
                </button>
              </div>
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
                              {ch.startPage && ch.endPage ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-blue-500" />
                                  <span>
                                    पेज {ch.startPage}–{ch.endPage} ({ch.endPage - ch.startPage + 1} पृष्ठ)
                                  </span>
                                </span>
                              ) : null}
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

              {/* Textbook PDF Page Range Mapping */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>पाठ्यपुस्तक पेज रेंज (Textbook 150-Page Mapping)</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-700">
                    कुल {Math.max(1, ((editingChapter.endPage || 12) - (editingChapter.startPage || 1) + 1))} पृष्ठ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">
                      शुरुआती पेज (Start Page):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={currentSubject?.totalPages || 300}
                      value={editingChapter.startPage || 1}
                      onChange={(e) =>
                        setEditingChapter({
                          ...editingChapter,
                          startPage: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl font-black text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1 text-[11px]">
                      अंतिम पेज (End Page):
                    </label>
                    <input
                      type="number"
                      min={editingChapter.startPage || 1}
                      max={currentSubject?.totalPages || 300}
                      value={editingChapter.endPage || 12}
                      onChange={(e) =>
                        setEditingChapter({
                          ...editingChapter,
                          endPage: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl font-black text-slate-800 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-blue-600/80">
                  💡 AI छात्र के प्रश्नों के समय केवल पेज {editingChapter.startPage || 1} से {editingChapter.endPage || 12} का संदर्भ लेगा।
                </p>
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

      {/* ==================================================== */}
      {/* MODAL 3: 150+ PAGE TEXTBOOK PDF UPLOAD & SMART INDEXING */}
      {/* ==================================================== */}
      {isBookModalOpen && currentSubject && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30">
                  <BookOpen className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                    <span>150+ पेज पूरी किताब (PDF) अपलोड व इंडेक्सिंग</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                      Smart RAG
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {board} &bull; {selectedClass} &bull; {currentSubject.subjectHindi} ({currentSubject.bookName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isParsingBook) setIsBookModalOpen(false);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 space-y-1.5">
              <h4 className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>150 पेज की किताब कैसे मैनेज होगी? (Zero Token Waste Architecture)</span>
              </h4>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                जब आप 150 पेज की PDF अपलोड करते हैं, सिस्टम इसके <strong>इंडेक्स (Table of Contents)</strong> को स्कैन करके सभी पाठों को उनके <strong>पेज नंबर (उदा: पाठ 1: पेज 1–12, पाठ 2: पेज 13–24)</strong> के साथ मैप कर देता है। छात्र के सवाल पूछते ही AI सिर्फ उसी पाठ के 10–12 पेज पढ़ेगा, जिससे लागत न्यूनतम और गति बिजली जैसी तेज रहेगी।
              </p>
            </div>

            {/* Inputs Form */}
            <div className="space-y-4 text-xs">
              {/* PDF File Dropzone / Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  पाठ्यपुस्तक PDF फ़ाइल (Textbook PDF):
                </label>
                <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-4 bg-indigo-50/30 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-red-500 font-black text-xs shadow-sm">
                      PDF
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 text-xs">
                        {bookUploadFileName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        आकार: {bookUploadFileSize} &bull; 1 से 8th क्लास सपोर्टेड
                      </p>
                    </div>
                  </div>
                  <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 font-bold border border-indigo-200 text-xs shadow-sm cursor-pointer transition-all active:scale-95">
                    फ़ाइल बदलें
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBookUploadFileName(file.name);
                          setBookUploadFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Grid: Book Name & Total Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    पुस्तक का नाम (Book Name):
                  </label>
                  <input
                    type="text"
                    value={currentSubject.bookName}
                    onChange={(e) => {
                      setCurrentSubject({ ...currentSubject, bookName: e.target.value });
                    }}
                    placeholder="उदा: गणित (Math-Magic / Ganit)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    पुस्तक के कुल पृष्ठ (Total Book Pages):
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={bookUploadTotalPages}
                    onChange={(e) => setBookUploadTotalPages(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-black text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    (उदा: 150 पेज की किताब में 14 पाठ समान अनुपात में इंडेक्स होंगे)
                  </span>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  अतिरिक्त निर्देश या फोकस (Optional Instructions):
                </label>
                <input
                  type="text"
                  value={bookUploadNotes}
                  onChange={(e) => setBookUploadNotes(e.target.value)}
                  placeholder="उदा: राजस्थान बोर्ड सत्र 2025-26 के नवीनतम 14 अध्याय"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 bg-white"
                />
              </div>

              {/* Status / Errors */}
              {bookParseError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{bookParseError}</span>
                </div>
              )}
              {bookParseSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{bookParseSuccess}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                disabled={isParsingBook}
                onClick={() => setIsBookModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                रद्द करें
              </button>
              <button
                disabled={isParsingBook}
                onClick={handleParseAndIndexBook}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isParsingBook ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>150 पेज स्कैन व AI इंडेक्सिंग जारी...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>🚀 {bookUploadTotalPages} पेज की किताब का इंडेक्स बनाएं</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ ADD NEW SUBJECT MODAL */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{newSubjectEmoji}</span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    नया विषय जोड़ें (Add Subject to {selectedClass})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    बोर्ड: {board} • कक्षा: {selectedClass}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  विषय का नाम (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => {
                    setNewSubjectName(e.target.value);
                    if (!newSubjectBook) {
                      setNewSubjectBook(`${e.target.value} - ${selectedClass}`);
                    }
                  }}
                  placeholder="e.g. Computer, General Knowledge, Sanskrit, Social Science"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  विषय का नाम (हिंदी में)
                </label>
                <input
                  type="text"
                  value={newSubjectHindi}
                  onChange={(e) => setNewSubjectHindi(e.target.value)}
                  placeholder="उदा. कंप्यूटर (Computer), सामान्य ज्ञान (GK), संस्कृत"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  पुस्तक / पाठ्यपुस्तक का नाम
                </label>
                <input
                  type="text"
                  value={newSubjectBook}
                  onChange={(e) => setNewSubjectBook(e.target.value)}
                  placeholder="उदा. कंप्यूटर प्रवेशिका, रुचिरा प्रथमो भागः"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    शिक्षक का नाम
                  </label>
                  <input
                    type="text"
                    value={newSubjectTeacher}
                    onChange={(e) => setNewSubjectTeacher(e.target.value)}
                    placeholder="उदा. रोहन सर, पूजा मैम"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    इमोजी / आइकॉन
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['💻', '🌍', '🕉️', '🏛️', '📐', '🔬', '✍️', '📚', '🎨', '🎵'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewSubjectEmoji(em)}
                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border transition-all ${
                          newSubjectEmoji === em
                            ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500/30'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleAddNewSubject}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSaving ? 'सेव हो रहा है...' : 'विषय बनाएं व सुरक्षित करें'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
