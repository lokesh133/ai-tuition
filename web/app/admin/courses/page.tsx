'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  Database,
  Search,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const EXISTING_CHAPTERS = [
  { id: 1, class: 'Class 5', subject: 'Mathematics', title: 'Chapter 2: Shapes & Angles', board: 'CBSE / NCERT', pages: 18, indexedChunks: 142, status: 'Indexed' },
  { id: 2, class: 'Class 5', subject: 'Science', title: 'Chapter 1: Super Senses', board: 'CBSE / NCERT', pages: 14, indexedChunks: 110, status: 'Indexed' },
  { id: 3, class: 'Class 8', subject: 'Mathematics', title: 'Chapter 1: Rational Numbers', board: 'CBSE / NCERT', pages: 24, indexedChunks: 198, status: 'Indexed' },
  { id: 4, class: 'Class 9', subject: 'Physics', title: 'Chapter 8: Motion & Acceleration', board: 'CBSE / NCERT', pages: 32, indexedChunks: 260, status: 'Indexed' },
  { id: 5, class: 'Class 10', subject: 'Mathematics', title: 'Chapter 4: Quadratic Equations', board: 'CBSE / NCERT', pages: 28, indexedChunks: 230, status: 'Indexed' },
  { id: 6, class: 'Class 12', subject: 'Physics', title: 'Chapter 1: Electric Charges & Fields', board: 'CBSE / NCERT', pages: 46, indexedChunks: 380, status: 'Indexed' },
];

export default function AdminCourseRAGPage() {
  const [selectedBoard, setSelectedBoard] = useState('CBSE (NCERT)');
  const [selectedClass, setSelectedClass] = useState('Class 9th');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [chapterTitle, setChapterTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [chapters, setChapters] = useState(EXISTING_CHAPTERS);

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle) return;

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setChapters((prev) => [
        {
          id: Date.now(),
          class: selectedClass,
          subject: selectedSubject,
          title: chapterTitle,
          board: selectedBoard,
          pages: 22,
          indexedChunks: 175,
          status: 'Indexed',
        },
        ...prev,
      ]);
      setChapterTitle('');
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
            RAG Knowledge Base & Curriculum Management
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
            School Textbooks & Syllabus Uploader (Class 1 to 12)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Yahan se Admin kisi bhi class (1st se 12th) ki NCERT ya state board ki PDF upload karke Vector DB me sync karta hai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Vector DB Sync: Active (Pinecone/Milvus)</span>
          </div>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-600" />
          <span>Naya Course / Chapter PDF Add Karein</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          PDF upload hone ke baad AI automatically chunks banakar Vector Embeddings generate karega taaki AI teachers sirf isi syllabus se padhayein.
        </p>

        <form onSubmit={handleSimulateUpload} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Board Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Education Board</label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="CBSE (NCERT)">CBSE (NCERT)</option>
                <option value="ICSE">ICSE Board</option>
                <option value="UP Board">UP State Board</option>
                <option value="Bihar Board">Bihar State Board</option>
                <option value="Maharashtra Board">Maharashtra Board</option>
              </select>
            </div>

            {/* Class Selector (Class 1 to 12) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Class Standard</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="Class 1st">Class 1st</option>
                <option value="Class 2nd">Class 2nd</option>
                <option value="Class 3rd">Class 3rd</option>
                <option value="Class 4th">Class 4th</option>
                <option value="Class 5th">Class 5th</option>
                <option value="Class 6th">Class 6th</option>
                <option value="Class 7th">Class 7th</option>
                <option value="Class 8th">Class 8th</option>
                <option value="Class 9th">Class 9th (High School)</option>
                <option value="Class 10th">Class 10th (Board Prep)</option>
                <option value="Class 11th">Class 11th (Senior Secondary)</option>
                <option value="Class 12th">Class 12th (Board & Entrance)</option>
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science / EVS">Science / EVS</option>
                <option value="Physics">Physics (Class 9-12)</option>
                <option value="Chemistry">Chemistry (Class 9-12)</option>
                <option value="Biology">Biology (Class 9-12)</option>
                <option value="English">English Literature & Grammar</option>
                <option value="Social Studies">Social Studies / Geography</option>
                <option value="Hindi">Hindi & Vyakaran</option>
              </select>
            </div>

            {/* Chapter Name Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Chapter Title</label>
              <input
                type="text"
                placeholder="e.g. Chapter 3: Linear Equations"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                required
              />
            </div>
          </div>

          {/* Drag & Drop PDF Dropzone */}
          <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition-all cursor-pointer">
            <FileText className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              NCERT Textbook PDF yahan drag karein ya browse karein
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports .pdf, .epub up to 50MB per chapter. Automated OCR for Hindi & English text.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            {uploadSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Chapter successfully parsed & synced to Vector DB!
              </span>
            )}
            <button
              type="submit"
              disabled={isUploading}
              className="ml-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Chunks & Vector Embeddings...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Upload & Sync Course to AI Teachers</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Synced Syllabus Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Active Syllabus Knowledge Base</h3>
            <p className="text-xs text-slate-500">Currently indexed textbooks accessible by all AI Teacher avatars</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            {chapters.length} Chapters Indexed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Class & Subject</th>
                <th className="py-3 px-4">Chapter Title</th>
                <th className="py-3 px-4">Board</th>
                <th className="py-3 px-4">Pages / Chunks</th>
                <th className="py-3 px-4">Vector Sync</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chapters.map((ch) => (
                <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-bold text-indigo-600 block">{ch.class}</span>
                    <span className="text-[11px] text-slate-500">{ch.subject}</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800">{ch.title}</td>
                  <td className="py-4 px-4 text-slate-600">{ch.board}</td>
                  <td className="py-4 px-4 text-slate-600">
                    <span className="font-semibold">{ch.pages} Pages</span>
                    <span className="text-slate-400 block text-[10px]">({ch.indexedChunks} semantic vectors)</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {ch.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
