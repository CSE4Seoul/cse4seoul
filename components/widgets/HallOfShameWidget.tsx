"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Flame, 
  ExternalLink, 
  ThumbsUp, 
  AlertTriangle,
  Skull,
  MessageSquare,
  Trophy,
  FileText,
  UserX,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface ShameRecord {
  id: string;
  targetUser: {
    nickname: string;
    playerTag: string;
    royaleApiUrl: string;
  };
  incident: {
    date: string;
    victor: string;
    score: string;
    abuseMessage: string;
    kickMessage: string;
  };
  evidenceImages?: {
    abuse?: string;
    battlelog?: string;
  };
  tags: string[];
  initialClaps?: number;
}

const DEFAULT_SHAME_RECORDS: ShameRecord[] = [
  {
    id: 'shame-001',
    targetUser: {
      nickname: 'MR. SMITTY',
      playerTag: '#QGPCYUU2',
      royaleApiUrl: 'https://royaleapi.com/player/QGPCYUU2/battles',
    },
    incident: {
      date: '2026.08.06',
      victor: '아이언크랩',
      score: '1 - 0',
      abuseMessage: '******* die you ******* worthless piece of ****',
      kickMessage: 'Your defeat will be posted on our site. I am glad that I can let you know this fact.',
    },
    evidenceImages: {
      abuse: '/assets/moment-gallery/아이언크랩_1.PNG',
      battlelog: '/assets/moment-gallery/아이언크랩_1.PNG',
    },
    tags: ['#BadManners', '#ClanRequestAbuse', '#1v1_Defeated', '#참교육완료'],
    initialClaps: 128,
  },
];

export default function HallOfShameWidget() {
  const [records] = useState<ShameRecord[]>(DEFAULT_SHAME_RECORDS);
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'abuse' | 'battle' | 'mandate'>>({
    'shame-001': 'abuse',
  });
  const [clapsMap, setClapsMap] = useState<Record<string, number>>({
    'shame-001': 128,
  });
  const [clappedState, setClappedState] = useState<Record<string, boolean>>({});

  const handleClap = (id: string) => {
    setClapsMap((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setClappedState((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setClappedState((prev) => ({ ...prev, [id]: false }));
    }, 600);
  };

  const setTab = (id: string, tab: 'abuse' | 'battle' | 'mandate') => {
    setActiveTabMap((prev) => ({ ...prev, [id]: tab }));
  };

  return (
    <div className="relative flex flex-col bg-gray-950 border border-rose-900/60 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-rose-500/50 group font-cyber">
      {/* 🔴 상단 헤더 & 비매너 경고 배지 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-950/80 via-gray-900/90 to-gray-950 border-b border-rose-900/50 backdrop-blur-md gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-600/60 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)] animate-pulse">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-rose-400 tracking-wider font-cyber">
                CSE4SEOUL HALL OF SHAME
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </div>
            <p className="text-xs text-rose-300/80 font-sans font-light">
              클랜원을 향한 몰상식한 비매너 행위는 사이트에 영구 보존됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/90 text-rose-300 border border-rose-700/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
            <Skull size={14} className="text-rose-400" />
            공식 블랙리스트
          </span>
        </div>
      </div>

      {/* 상단 붉은색 경고 마퀴 스트립 */}
      <div className="bg-rose-950/40 border-b border-rose-900/30 px-6 py-1.5 flex items-center justify-between text-[11px] font-mono text-rose-400/90">
        <span className="flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-amber-400" />
          <span>[WARNING] 몰상식한 가입 요청 테러 및 욕설 유저는 1v1 참교육 후 사이트에 영구 박제 처리됩니다.</span>
        </span>
        <span className="hidden md:inline text-[10px] text-rose-500 font-bold">
          EVIDENCE PRESERVED
        </span>
      </div>

      {/* 🖤 박제 카드 리스트 */}
      <div className="p-6 space-y-6 bg-gray-950/90">
        {records.map((record) => {
          const currentTab = activeTabMap[record.id] || 'abuse';
          const claps = clapsMap[record.id] || 0;
          const isClapping = clappedState[record.id] || false;

          return (
            <div
              key={record.id}
              className="relative flex flex-col rounded-2xl bg-gradient-to-b from-gray-900/80 to-gray-950 border border-rose-900/40 hover:border-rose-500/60 p-5 md:p-6 shadow-xl transition-all duration-300 space-y-5 group/card"
            >
              {/* 카드 헤더: 유저 배지 & RoyaleAPI 링크 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-600/50 flex items-center justify-center text-rose-400 text-xl font-bold shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                    <UserX size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-rose-400 tracking-wide">
                        {record.targetUser.nickname}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                        {record.targetUser.playerTag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      사건 일자: <span className="text-gray-300">{record.incident.date}</span>
                    </p>
                  </div>
                </div>

                {/* RoyaleAPI 직연동 버튼 */}
                <a
                  href={record.targetUser.royaleApiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-900/40 to-rose-950/60 border border-rose-600/60 hover:border-rose-400 text-rose-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:scale-105 active:scale-95 group/link shrink-0"
                >
                  <ExternalLink size={14} className="text-rose-400 group-hover/link:rotate-12 transition-transform" />
                  <span>RoyaleAPI 실시간 멸망 현황 보기</span>
                </a>
              </div>

              {/* 처단 기록 및 스코어 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">처단자:</span>
                  <span className="text-cyan-300 font-black flex items-center gap-1">
                    <Trophy size={14} className="text-amber-400" />
                    {record.incident.victor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">매치 스코어:</span>
                  <span className="text-emerald-400 font-black px-2 py-0.5 bg-emerald-950/50 rounded border border-emerald-800/60">
                    {record.incident.score} 승리 (완승)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">조치 상태:</span>
                  <span className="text-rose-400 font-black flex items-center gap-1">
                    <Flame size={14} className="text-rose-500 animate-pulse" />
                    사이트 영구 박제 완료
                  </span>
                </div>
              </div>

              {/* 📑 증거 섹션 (탭 전환) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setTab(record.id, 'abuse')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cyber transition-all flex items-center gap-1.5 shrink-0 ${
                      currentTab === 'abuse'
                        ? 'bg-rose-950 text-rose-300 border border-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>가입 신청 테러 증거</span>
                  </button>
                  <button
                    onClick={() => setTab(record.id, 'battle')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cyber transition-all flex items-center gap-1.5 shrink-0 ${
                      currentTab === 'battle'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Trophy size={13} />
                    <span>참교육 배틀 로그</span>
                  </button>
                  <button
                    onClick={() => setTab(record.id, 'mandate')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cyber transition-all flex items-center gap-1.5 shrink-0 ${
                      currentTab === 'mandate'
                        ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <FileText size={13} />
                    <span>추방 통보 서약</span>
                  </button>
                </div>

                {/* 탭 본문 내용 */}
                <div className="p-4 rounded-xl bg-black/60 border border-gray-800 text-xs leading-relaxed font-sans">
                  {currentTab === 'abuse' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-rose-400 font-mono font-bold text-[11px]">
                        <span>🚨 가입 요청 욕설 메시지 원문</span>
                        <span className="text-gray-500 font-normal">System Intercepted</span>
                      </div>
                      <p className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 font-mono text-rose-200 text-sm tracking-wide select-all">
                        "{record.incident.abuseMessage}"
                      </p>
                      <p className="text-[11px] text-gray-400 font-light">
                        ※ CSE4Seoul 클랜 가입 요청 창을 통해 무분별한 별표 욕설을 남긴 정황이 포착되었습니다.
                      </p>
                    </div>
                  )}

                  {currentTab === 'battle' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-cyan-400 font-mono font-bold text-[11px]">
                        <span>🏆 {record.incident.victor} 선수의 참교육 1v1 승리 기록</span>
                        <span className="text-emerald-400 font-bold">1 - 0 PERFECT</span>
                      </div>
                      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-cyan-900/60 bg-gray-900">
                        <Image
                          src={record.evidenceImages?.battlelog || '/assets/moment-gallery/아이언크랩_1.PNG'}
                          alt="Battle Result"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {currentTab === 'mandate' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-purple-400 font-mono font-bold text-[11px]">
                        <span>📜 추방 메시지 서약 및 사이트 박제 통보</span>
                        <span className="text-purple-300 font-mono">OFFICIAL STATEMENT</span>
                      </div>
                      <blockquote className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/50 font-mono text-purple-200 text-xs italic">
                        "{record.incident.kickMessage}"
                      </blockquote>
                      <p className="text-[11px] text-gray-400 font-light">
                        ※ 승리 후 클랜 추방 메세지를 통해 공식 웹사이트 박제 사실이 통보되었습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 태그 클라우드 & 사이다 박수 👏 버튼 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {record.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-950/50 text-rose-300 border border-rose-800/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* 사이다 / 참교육 박수 버튼 */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleClap(record.id)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-cyber text-xs font-extrabold transition-all border shrink-0 ${
                    isClapping
                      ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105'
                      : 'bg-amber-950/50 hover:bg-amber-900/70 text-amber-300 border-amber-700/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  }`}
                >
                  <ThumbsUp size={15} className={`transition-transform ${isClapping ? 'rotate-12 scale-125' : ''}`} />
                  <span>사이다 참교육 박수 👏</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-200 border border-amber-700 text-[10px] font-mono">
                    {claps}
                  </span>
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
