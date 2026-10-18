'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  Filter,
  Search,
  BookOpen,
  Trash2,
  Sparkles,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  FileQuestion,
  Share2,
} from 'lucide-react';

export interface SavedWorksheetRecord {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  dateLabel: string; // e.g., "आज, 12:25 PM"
  subjectId: string;
  subjectName: string;
  teacherName: string;
  files: Array<{ id: string; name: string; url: string; type: string }>;
  detectedQuestions: string[];
  activeQuestion?: string;
  whiteboardSteps?: any[];
  whiteboardHeading?: string;
  timestamp: number;
}

interface WorksheetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyRecords: SavedWorksheetRecord[];
  onRestoreRecord: (record: SavedWorksheetRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onClearAllRecords: () => void;
  isDarkMode?: boolean;
}

export const WorksheetHistoryModal: React.FC<WorksheetHistoryModalProps> = ({
  isOpen,
  onClose,
  historyRecords,
  onRestoreRecord,
  onDeleteRecord,
  onClearAllRecords,
  isDarkMode = false,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter records based on Subject, Date, and Search Query
  const filteredRecords = useMemo(() => {
    if (!isOpen) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return historyRecords.filter((record) => {
      // 1. Subject Filter
      if (selectedSubjectFilter !== 'all') {
        const sId = record.subjectId.toLowerCase();
        if (selectedSubjectFilter === 'math' && !sId.includes('math')) return false;
        if (selectedSubjectFilter === 'science' && !sId.includes('sc') && !sId.includes('evs')) return false;
        if (selectedSubjectFilter === 'english' && !sId.includes('eng')) return false;
        if (selectedSubjectFilter === 'hindi' && !sId.includes('hindi')) return false;
      }

      // 2. Date Filter
      if (selectedDateFilter === 'today' && record.date !== todayStr) return false;
      if (selectedDateFilter === 'yesterday' && record.date !== yesterdayStr) return false;
      if (selectedDateFilter === 'week' && record.timestamp < weekAgoMs) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = record.title.toLowerCase().includes(q);
        const matchesSubject = record.subjectName.toLowerCase().includes(q);
        const matchesQuestions = record.detectedQuestions.some((ques) => ques.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubject && !matchesQuestions) return false;
      }

      return true;
    });
  }, [isOpen, historyRecords, selectedSubjectFilter, selectedDateFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-white shadow-indigo-950/50'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  पिछला रिकॉर्ड व वर्कशीट इतिहास
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  {filteredRecords.length} रिकॉर्ड
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                छात्र द्वारा पहले पूछी गई वर्कशीट, सवाल व फोटो का सुरक्षित रिकॉर्ड (1-क्लिक में पुनः खोलें)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyRecords.length > 0 && (
              <button
                type="button"
                onClick={onClearAllRecords}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  isDarkMode
                    ? 'border-rose-900/60 text-rose-400 hover:bg-rose-950/40'
                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                }`}
                title="सभी पुराना रिकॉर्ड हटाएं"
              >
                पूरा इतिहास साफ करें
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Search + Subject Filter + Date Filter) */}
        <div className={`p-4 border-b space-y-3 shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-white'
        }`}>
          {/* Search Bar */}
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="सवाल या वर्कशीट खोजें (जैसे: difference, round off, 10+10, गणित)..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border transition-all focus:outline-hidden ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-600'
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Subject Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] uppercase font-black tracking-wider mr-1 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                विषय:
              </span>
              {[
                { id: 'all', label: 'सभी विषय' },
                { id: 'math', label: '📐 गणित' },
                { id: 'science', label: '🔬 विज्ञान / EVS' },
                { id: 'english', label: '🔤 अंग्रेजी' },
                { id: 'hindi', label: '📖 हिंदी' },
              ].map((sub) => {
                const isActive = selectedSubjectFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(sub.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] uppercase font-black tracking-wider mr-1 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                तारीख:
              </span>
              {[
                { id: 'all', label: 'सभी' },
                { id: 'today', label: 'आज' },
                { id: 'yesterday', label: 'कल' },
                { id: 'week', label: 'पिछले 7 दिन' },
              ].map((dt) => {
                const isActive = selectedDateFilter === dt.id;
                return (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setSelectedDateFilter(dt.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-xs'
                        : isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {dt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Records Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
                📭
              </div>
              <h3 className="text-base font-bold">कोई रिकॉर्ड नहीं मिला</h3>
              <p className={`text-xs max-w-sm mx-auto leading-relaxed ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                जैसे ही आप कोई वर्कशीट अपलोड करेंगे या नया सवाल पूछेंगे, उसका पूरा इतिहास यहाँ सुरक्षित दिखेगा।
              </p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                  isDarkMode
                    ? 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950'
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                {/* Left: Thumbnail Preview & Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Thumbnail or Icon */}
                  {record.files && record.files.length > 0 && record.files[0].url ? (
                    <div className="w-16 h-16 rounded-xl border overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 relative group-hover:scale-105 transition-transform shadow-xs">
                      {record.files[0].type.includes('pdf') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/50 text-rose-500">
                          <span className="text-lg">📄</span>
                          <span className="text-[9px] font-black uppercase">PDF</span>
                        </div>
                      ) : (
                        <img
                          src={record.files[0].url}
                          alt={record.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {record.files.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded-sm font-bold">
                          +{record.files.length - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                      📝
                    </div>
                  )}

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                        {record.subjectName}
                      </span>
                      <span className={`text-[11px] font-medium flex items-center gap-1 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3 text-amber-500" />
                        {record.dateLabel}
                      </span>
                      <span className={`text-[10px] font-medium ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        | शिक्षक: {record.teacherName}
                      </span>
                    </div>

                    <h4 className="text-sm font-black truncate leading-snug">
                      {record.title}
                    </h4>

                    {/* Detected Questions Summary & Preview */}
                    {record.detectedQuestions && record.detectedQuestions.length > 0 ? (
                      <div className="space-y-1 pt-0.5">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {record.detectedQuestions.length} सवाल मिले थे
                        </span>
                        <p className={`text-xs truncate italic ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          &quot;{record.detectedQuestions[0]}&quot;
                        </p>
                      </div>
                    ) : record.activeQuestion ? (
                      <p className={`text-xs truncate italic ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        सवाल: &quot;{record.activeQuestion}&quot;
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(record.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      isDarkMode
                        ? 'border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
                        : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title="यह रिकॉर्ड हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRestoreRecord(record)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
                    title="इस वर्कशीट को पुनः व्हाइटबोर्ड पर लोड करें"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>पुनः खोलें व हल देखें</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/70 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
        }`}>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>रिकॉर्ड ब्राउज़र में सुरक्षित (Auto-Saved in Browser Storage)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-bold border transition-all ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
