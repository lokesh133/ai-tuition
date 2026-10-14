'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Video,
  VideoOff,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Target,
  Radio,
  Camera,
  Play,
  RotateCcw,
} from 'lucide-react';

export interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  emoji: string;
  activeColor: string;
  themeColor: string;
  avatarRole: string;
  image?: string;
}

interface OnlineVideoTeacherProps {
  teacher: TeacherInfo;
  isSpeaking: boolean;
  isListening: boolean;
  activeStepIndex: number;
  totalSteps: number;
  currentSpeechText?: string;
  onPointerToggle?: (enabled: boolean) => void;
  pointerEnabled?: boolean;
  onUploadClick?: () => void;
  hasUploadedPage?: boolean;
  isAudioMuted?: boolean;
  onToggleMute?: () => void;
  onReplayAudio?: () => void;
}

export const OnlineVideoTeacher: React.FC<OnlineVideoTeacherProps> = ({
  teacher,
  isSpeaking,
  isListening,
  activeStepIndex,
  totalSteps,
  currentSpeechText = '',
  onPointerToggle,
  pointerEnabled = true,
  onUploadClick,
  hasUploadedPage = false,
  isAudioMuted = false,
  onToggleMute,
  onReplayAudio,
}) => {
  // Video States
  const [isStudentCameraOn, setIsStudentCameraOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic Lip Movement & Facial Animation states (100% Free, Canvas/SVG synced)
  const [mouthOpenFrame, setMouthOpenFrame] = useState(0);

  // References
  const studentVideoRef = useRef<HTMLVideoElement>(null);
  const studentStreamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic Talking Lip Movement Animation
  useEffect(() => {
    let animTimer: NodeJS.Timeout;
    if (isSpeaking) {
      animTimer = setInterval(() => {
        setMouthOpenFrame((prev) => (prev + 1) % 4);
      }, 140);
    } else {
      setMouthOpenFrame(0);
    }
    return () => clearInterval(animTimer);
  }, [isSpeaking]);

  // Student Camera Webcam Handler (Allows student to see themselves in class)
  const toggleStudentCamera = async () => {
    if (isStudentCameraOn) {
      if (studentStreamRef.current) {
        studentStreamRef.current.getTracks().forEach((track) => track.stop());
        studentStreamRef.current = null;
      }
      if (studentVideoRef.current) {
        studentVideoRef.current.srcObject = null;
      }
      setIsStudentCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        studentStreamRef.current = stream;
        if (studentVideoRef.current) {
          studentVideoRef.current.srcObject = stream;
        }
        setIsStudentCameraOn(true);
      } catch (err) {
        console.warn('Webcam permission denied:', err);
        alert('Camera permission allow karein taaki aap live class me apna video dekh sakein.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (studentStreamRef.current) {
        studentStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const teacherImageMap: Record<string, string> = {
    sharma: '/teachers/sharma.jpg',
    neha: '/teachers/neha.jpg',
    riya: '/teachers/riya.jpg',
    kabir: '/teachers/kabir.jpg',
  };
  const teacherPhoto = teacherImageMap[teacher.id] || '/teachers/sharma.jpg';

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-indigo-500/30 shadow-2xl flex flex-col select-none transition-all"
    >
      {/* 1. TOP VIDEO HEADER HUD */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-lg shadow-red-600/40 animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE CLASS</span>
          </div>

          {/* Teacher Badge */}
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-full text-xs shadow-md">
            <span className="text-base">{teacher.emoji}</span>
            <span className="font-extrabold text-white">{teacher.name}</span>
            <span className="text-[10px] text-amber-400 font-bold hidden sm:inline">• {teacher.subject}</span>
          </div>

          {/* Free Kid-Friendly Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Smart AI Teacher • Whiteboard Sync</span>
          </div>
        </div>

        {/* Action Controls in Top Bar */}
        <div className="flex items-center gap-2">
          {/* AUDIO MUTE / UNMUTE BUTTON */}
          <button
            onClick={onToggleMute}
            title={isAudioMuted ? 'Audio Unmute Karein' : 'Audio Mute Karein'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md ${
              isAudioMuted
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-indigo-600 text-white shadow-indigo-600/30'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            <span className="hidden sm:inline">Audio {isAudioMuted ? 'OFF' : 'ON'}</span>
          </button>

          {/* UPLOAD NOTEBOOK / QUESTION BUTTON (VERY PROMINENT FOR KIDS) */}
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
            title="Notebook Photo ya Sawaal Upload Karein"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Sawaal / Copy 📸</span>
          </button>

          {/* Laser/Chalk Pointer Toggle */}
          <button
            onClick={() => onPointerToggle && onPointerToggle(!pointerEnabled)}
            title={pointerEnabled ? 'Teacher Pointer: ON' : 'Teacher Pointer: OFF'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              pointerEnabled
                ? 'bg-rose-600 text-white shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pointer {pointerEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN TEACHER CLASSROOM STAGE (100% FREE, ZERO API KEY NEEDED) */}
      <div className="relative w-full h-[360px] sm:h-[430px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Base Teacher Classroom Frame with Natural Motion */}
        <div
          className={`relative w-full h-full transition-transform duration-300 ${
            isSpeaking ? 'scale-[1.03] translate-y-[-2px]' : 'scale-100'
          }`}
        >
          <Image
            src={teacherPhoto}
            alt={teacher.name}
            fill
            priority
            className={`object-cover object-top transition-all duration-300 ${
              isSpeaking ? 'brightness-105' : 'brightness-95'
            }`}
          />

          {/* Dynamic Talking Lip Movement Animation Overlay */}
          {isSpeaking && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="absolute w-12 h-6 rounded-full bg-black/15 blur-[2px] transition-all"
                style={{
                  top: '49%',
                  left: '49%',
                  transform: `translate(-50%, -50%) scale(${1 + mouthOpenFrame * 0.15})`,
                  opacity: mouthOpenFrame > 0 ? 0.6 : 0.1,
                }}
              />
            </div>
          )}
        </div>

        {/* Studio Lighting Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />

        {/* Active Speaking Glow Border */}
        {isSpeaking && (
          <div className="absolute inset-0 border-4 border-amber-400/50 shadow-[inset_0_0_50px_rgba(245,158,11,0.3)] pointer-events-none animate-pulse" />
        )}

        {/* Chalk / Laser Pointer Projecting towards Whiteboard */}
        {pointerEnabled && isSpeaking && (
          <div className="absolute top-1/3 right-8 pointer-events-none z-30 animate-pulse">
            <div className="relative flex items-center">
              <div className="w-36 sm:w-48 h-2 bg-gradient-to-r from-amber-600 via-rose-500 to-rose-400 rounded-full shadow-xl shadow-rose-500/60 -rotate-12 origin-left" />
              <div className="w-5 h-5 rounded-full bg-rose-500 ring-4 ring-rose-400/50 shadow-2xl shadow-rose-500 animate-ping" />
            </div>
          </div>
        )}

        {/* Teacher Classroom Stats Overlay */}
        <div className="absolute top-14 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 font-mono hidden md:flex flex-col gap-0.5 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">Live Classroom #101</span>
          </div>
          <div className="text-slate-400">Class 1st-8th • Board Sync Active</div>
        </div>

        {/* Quick Upload CTA Overlay directly on teacher video for kids */}
        {!hasUploadedPage && (
          <div className="absolute top-14 left-4 z-20">
            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md transition-all border border-indigo-400/30 transform hover:scale-105"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Apna Sawaal ya Copy Upload Karein ➔</span>
            </button>
          </div>
        )}

        {/* Speaking Status Caption Pill at bottom of teacher video */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 px-4 py-2 rounded-2xl shadow-2xl">
          {isSpeaking ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-300">
                {teacher.name} bol rahe hain (Step {activeStepIndex + 1}/{totalSteps || 1})...
              </span>
              {/* Real-time audio waveform equalizer */}
              <div className="flex items-center gap-0.5 ml-1">
                {[12, 20, 14, 26, 16, 22, 18].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1 bg-emerald-400 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </>
          ) : isListening ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-red-300">Aapki awaaz sun rahe hain...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-300 font-semibold">
                {teacher.name} is ready • Mic dabayein ya copy upload karein
              </span>
            </>
          )}

          {/* Replay step audio button */}
          {onReplayAudio && (
            <button
              onClick={onReplayAudio}
              title="Step ko dobara sunein"
              className="ml-2 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all border border-amber-500/30"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Dobara Sunein</span>
            </button>
          )}
        </div>

        {/* 3. STUDENT PICTURE-IN-PICTURE (PIP) WEBCAM OVERLAY */}
        <div
          className={`absolute bottom-4 right-4 z-20 transition-all duration-300 ${
            isStudentCameraOn
              ? 'w-36 h-28 sm:w-44 sm:h-32 rounded-2xl overflow-hidden border-2 border-indigo-400 shadow-2xl bg-slate-950'
              : 'w-auto'
          }`}
        >
          {isStudentCameraOn ? (
            <div className="relative w-full h-full">
              <video
                ref={studentVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute top-1.5 left-2 bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>You (Student)</span>
              </div>
              <button
                onClick={toggleStudentCamera}
                title="Camera band karein"
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white rounded-md transition-all"
              >
                <VideoOff className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={toggleStudentCamera}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-indigo-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-bold transition-all shadow-lg backdrop-blur-md"
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Turn on Student Cam</span>
              <span className="sm:hidden">My Cam</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
