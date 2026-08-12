'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  BookOpen, 
  Calendar, 
  PlusCircle, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  FileDown, 
  RotateCcw,
  BookMarked,
  Layers
} from 'lucide-react';

export interface StudyLogItem {
  id: string;
  user_id?: string;
  log_date: string; // YYYY-MM-DD
  subject: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

interface DailyStudyWidgetProps {
  userId: string;
}

export default function DailyStudyWidget({ userId }: DailyStudyWidgetProps) {
  const supabase = useMemo(() => createClient(), []);

  // 오늘 날짜 기본값 (YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [logs, setLogs] = useState<StudyLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'record' | 'review'>('record');

  // 기록 작성 / 수정 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState<string>(getTodayString());
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  // 복습 모드 날짜 선택 상태
  const [reviewFilterMode, setReviewFilterMode] = useState<'all' | '7days' | '30days' | 'custom'>('all');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // 1. Supabase & LocalStorage 데이터 불러오기
  const fetchStudyLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed, checking localStorage fallback:', error.message);
        if (typeof window !== 'undefined') {
          const localData = localStorage.getItem(`study_logs_${userId}`);
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              setLogs(Array.isArray(parsed) ? parsed : []);
            } catch {
              setLogs([]);
            }
          } else {
            setLogs([]);
          }
        } else {
          setLogs([]);
        }
      } else if (data) {
        const logsArray = Array.isArray(data) ? data : [];
        setLogs(logsArray);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`study_logs_${userId}`, JSON.stringify(logsArray));
        }
      }
    } catch (err) {
      console.error('Error loading study logs:', err);
      if (typeof window !== 'undefined') {
        const localData = localStorage.getItem(`study_logs_${userId}`);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setLogs(Array.isArray(parsed) ? parsed : []);
          } catch {
            setLogs([]);
          }
        } else {
          setLogs([]);
        }
      } else {
        setLogs([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchStudyLogs();
  }, [fetchStudyLogs]);

  // 저장 처리 (추가 또는 수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDate || !subject.trim() || !content.trim()) {
      alert('날짜, 과목/주제, 줄글 공부 내용을 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      user_id: userId,
      log_date: logDate,
      subject: subject.trim(),
      content: content.trim(),
    };

    try {
      if (editingId) {
        // 수정
        const { error } = await supabase
          .from('study_logs')
          .update({
            log_date: payload.log_date,
            subject: payload.subject,
            content: payload.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase update failed, updating locally:', error.message);
          const currentLogs = Array.isArray(logs) ? logs : [];
          const updated = currentLogs.map((item) =>
            item.id === editingId ? { ...item, ...payload, updated_at: new Date().toISOString() } : item
          );
          setLogs(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`study_logs_${userId}`, JSON.stringify(updated));
          }
        } else {
          await fetchStudyLogs();
        }
      } else {
        // 생성
        const { data, error } = await supabase
          .from('study_logs')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert failed, storing locally:', error.message);
          const newItem: StudyLogItem = {
            id: `local-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString(),
          };
          const currentLogs = Array.isArray(logs) ? logs : [];
          const updated = [newItem, ...currentLogs];
          setLogs(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`study_logs_${userId}`, JSON.stringify(updated));
          }
        } else if (data) {
          await fetchStudyLogs();
        }
      }

      // 폼 초기화
      resetForm();
    } catch (err) {
      console.error('Failed to save study log:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정 취소 및 폼 리셋
  const resetForm = () => {
    setEditingId(null);
    setLogDate(getTodayString());
    setSubject('');
    setContent('');
  };

  // 항목 수정 클릭
  const startEdit = (item: StudyLogItem) => {
    if (!item) return;
    setEditingId(item.id);
    setLogDate(item.log_date || getTodayString());
    setSubject(item.subject || '');
    setContent(item.content || '');
    setActiveTab('record');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  // 항목 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 공부 기록을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('study_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase delete failed, deleting locally:', error.message);
        const currentLogs = Array.isArray(logs) ? logs : [];
        const updated = currentLogs.filter((l) => l.id !== id);
        setLogs(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`study_logs_${userId}`, JSON.stringify(updated));
        }
      } else {
        await fetchStudyLogs();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // unique 주제 목록
  const uniqueSubjects = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    const set = new Set(logs.map((l) => l?.subject || '').filter(Boolean));
    return Array.from(set);
  }, [logs]);

  // 필터링된 기록 목록 (기록 탭용)
  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    const query = (searchQuery || '').toLowerCase();
    return logs.filter((item) => {
      if (!item) return false;
      const itemSubject = (item.subject || '').toLowerCase();
      const itemContent = (item.content || '').toLowerCase();
      const itemDate = item.log_date || '';

      const matchesSearch =
        !query ||
        itemSubject.includes(query) ||
        itemContent.includes(query) ||
        itemDate.includes(query);

      const matchesSubject =
        selectedSubjectFilter === 'ALL' || item.subject === selectedSubjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [logs, searchQuery, selectedSubjectFilter]);

  // 복습 모드 대상 기록들 (날짜 정렬: 과거 -> 최신 순 또는 최신 순)
  const reviewLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    let result = [...logs];

    if (reviewFilterMode === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().split('T')[0];
      result = result.filter((l) => l && (l.log_date || '') >= past7Str);
    } else if (reviewFilterMode === '30days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      const past30Str = past30.toISOString().split('T')[0];
      result = result.filter((l) => l && (l.log_date || '') >= past30Str);
    } else if (reviewFilterMode === 'custom') {
      if (customStartDate) result = result.filter((l) => l && (l.log_date || '') >= customStartDate);
      if (customEndDate) result = result.filter((l) => l && (l.log_date || '') <= customEndDate);
      if (selectedDates.size > 0) {
        result = result.filter((l) => l && selectedDates.has(l.log_date));
      }
    }

    // 복습할 때는 날짜 오름차순(과거->현재)으로 보기 편하게 정렬
    return result.sort((a, b) => (a?.log_date || '').localeCompare(b?.log_date || ''));
  }, [logs, reviewFilterMode, customStartDate, customEndDate, selectedDates]);

  // 복습 텍스트 생성 [YYYY-MM-DD] 과목/공부 내용\n 줄글 내용...
  const combinedReviewText = useMemo(() => {
    if (!Array.isArray(reviewLogs) || reviewLogs.length === 0) return '복습할 공부 기록이 없습니다.';

    return reviewLogs
      .filter(Boolean)
      .map((item) => `[${item.log_date || ''}] ${item.subject || ''} 공부 내용\n${item.content || ''}`)
      .join('\n\n');
  }, [reviewLogs]);

  // 복사하기
  const handleCopy = () => {
    navigator.clipboard.writeText(combinedReviewText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // TXT 파일 내보내기 (추출 기능)
  const handleExportTxt = () => {
    if (reviewLogs.length === 0) {
      alert('내보낼 공부 기록이 없습니다.');
      return;
    }

    const header = `=========================================\n  CSE4SEOUL 매일 공부 기록 복습 노트\n  생성일: ${new Date().toLocaleString('ko-KR')}\n  총 기록 수: ${reviewLogs.length}건\n=========================================\n\n`;
    const fullText = header + combinedReviewText;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const firstDate = reviewLogs[0]?.log_date || getTodayString();
    const lastDate = reviewLogs[reviewLogs.length - 1]?.log_date || getTodayString();
    link.href = url;
    link.download = `공부기록_복습_${firstDate}_${lastDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 개별 날짜 체크박스 토글
  const toggleDateSelection = (dateStr: string) => {
    const newSet = new Set(selectedDates);
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }
    setSelectedDates(newSet);
    setReviewFilterMode('custom');
  };

  return (
    <div className="relative flex flex-col bg-gray-950 border border-blue-900/50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-blue-500/50 my-8">
      {/* 🔷 상단 타이틀 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-950/90 via-gray-900/90 to-gray-950 border-b border-blue-900/50 backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-950 border border-blue-600/60 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.35)]">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                매일 공부 기록 &amp; 복습/TXT 추출 노트
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-900/70 text-blue-300 border border-blue-700">
                DAILY STUDY LOG
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              매일의 공부 내용을 줄글로 작성하고, 지정 일자별로 묶어서 복습 및 TXT 파일로 추출하세요.
            </p>
          </div>
        </div>

        {/* 탭 버튼 전환 */}
        <div className="flex items-center bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800 shrink-0">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'record'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 size={14} />
            <span>기록 작성 및 목록</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'review'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookMarked size={14} />
            <span>일자별 복습 모드 ({reviewLogs.length}건)</span>
          </button>
        </div>
      </div>

      {/* 📝 TAB 1: 기록 작성 및 목록 관리 */}
      {activeTab === 'record' && (
        <div className="p-6 space-y-8">
          {/* 1. 작성 / 수정 입력 폼 카드 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-950 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-blue-400">
                <PlusCircle size={16} />
                <span>{editingId ? '✏️ 공부 기록 수정하기' : '📝 오늘의 공부 내용 줄글 기록하기'}</span>
              </div>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1 rounded-lg transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>수정 취소</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 날짜 선택 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-400" />
                    공부 일자
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* 과목 / 주제 */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <Layers size={13} className="text-cyan-400" />
                    과목 및 주요 주제 (예: 수학, 알고리즘, 영어)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 미적분학 3장, React 커스텀 훅..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* 줄글 공부 내용 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <FileText size={13} className="text-emerald-400" />
                    공부 내용 줄글 기록 (상세 소감, 배우고 이해한 내용)
                  </label>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {content.length}자 | {content.split('\n').length}줄
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="오늘 배운 핵심 개념, 문제 풀이 과정, 이해한 직관, 기억해야 할 내용들을 자유롭게 줄글로 적어보세요..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed resize-y font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  초기화
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>{isSubmitting ? '저장 중...' : editingId ? '수정 완료' : '공부 기록 저장하기'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. 기존 기록 조회 & 검색 필터 */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Clock size={16} className="text-blue-400" />
                <span>저장된 공부 기록 목록 ({filteredLogs.length}건)</span>
              </div>

              {/* 검색 및 과목 필터 */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="검색어 또는 날짜..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-40 sm:w-56"
                  />
                </div>

                {uniqueSubjects.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1 text-xs">
                    <Filter size={12} className="text-gray-500" />
                    <select
                      value={selectedSubjectFilter}
                      onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                      className="bg-transparent text-gray-300 focus:outline-none cursor-pointer font-bold"
                    >
                      <option value="ALL">모든 과목 전체</option>
                      {uniqueSubjects.map((sub) => (
                        <option key={sub} value={sub} className="bg-gray-900 text-white">
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 기록 카드리스트 */}
            {isLoading ? (
              <div className="py-12 text-center text-gray-500 font-mono text-xs animate-pulse">
                공부 기록 데이터를 불러오는 중입니다...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-gray-900/40 border border-dashed border-gray-800 text-gray-500 space-y-2">
                <BookOpen size={32} className="mx-auto opacity-30 text-blue-400" />
                <p className="text-sm font-bold text-gray-400">저장된 공부 기록이 없거나 검색 결과가 없습니다.</p>
                <p className="text-xs">상단 입력 폼에 매일 공부한 줄글 내용을 작성하여 기록을 시작해보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredLogs.map((item) => (
                  <div
                    key={item.id}
                    className="group relative p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 hover:border-blue-500/40 transition-all duration-200 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800/80">
                          [{item.log_date}]
                        </span>
                        <h4 className="text-base font-bold text-white tracking-tight">
                          {item.subject} 공부 내용
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-blue-900/60 text-gray-400 hover:text-blue-300 transition-colors"
                          title="수정하기"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-400 transition-colors"
                          title="삭제하기"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-wrap pl-1 border-l-2 border-blue-500/30">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📚 TAB 2: 일자별 공부 내용 복습 및 TXT 추출 모드 */}
      {activeTab === 'review' && (
        <div className="p-6 space-y-6">
          {/* 복습 범위 선택 컨트롤러 */}
          <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <BookMarked size={16} />
                <span>복습할 일자 범위 선택 및 추출 설정</span>
              </div>

              {/* TXT 파일 추출 버튼 & 복사 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all"
                >
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{isCopied ? '복사 완료!' : '복습 텍스트 전체 복사'}</span>
                </button>

                <button
                  onClick={handleExportTxt}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/30 transition-all"
                >
                  <FileDown size={14} />
                  <span>.txt 파일로 추출 다운로드</span>
                </button>
              </div>
            </div>

            {/* 필터 모드 선택 버튼들 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-bold mr-2">기간 프리셋:</span>
              <button
                onClick={() => setReviewFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilterMode === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                전체 공부 기록 ({logs.length}건)
              </button>
              <button
                onClick={() => setReviewFilterMode('7days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilterMode === '7days'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                최근 7일
              </button>
              <button
                onClick={() => setReviewFilterMode('30days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilterMode === '30days'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                최근 30일
              </button>
              <button
                onClick={() => setReviewFilterMode('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilterMode === 'custom'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                사용자 지정 날짜 선택
              </button>
            </div>

            {/* 커스텀 날짜 선택기 */}
            {reviewFilterMode === 'custom' && (
              <div className="p-4 rounded-xl bg-black/60 border border-gray-800 space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">시작일:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">종료일:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-white"
                    />
                  </div>
                </div>

                {/* 개별 날짜 체크박스 칩 */}
                {logs.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-gray-400">개별 일자 토글 선택:</span>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                      {logs.map((l) => {
                        const isSelected = selectedDates.has(l.log_date);
                        return (
                          <button
                            key={l.id}
                            onClick={() => toggleDateSelection(l.log_date)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                              isSelected
                                ? 'bg-cyan-600 text-white font-bold'
                                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                            }`}
                          >
                            [{l.log_date}] {l.subject}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 복습 텍스트 출력 영역 (요청된 포맷: [YYYY-MM-DD] 공부 내용 \n 내용...) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <FileText size={14} />
                복습 노트 텍스트 프리뷰 (포맷: [YYYY-MM-DD] 과목 공부 내용)
              </span>
              <span>선택된 기록 수: {reviewLogs.length}건</span>
            </div>

            <div className="relative rounded-2xl bg-black border border-cyan-900/40 p-6 font-mono text-sm leading-relaxed text-cyan-100 overflow-x-auto shadow-inner min-h-[300px] max-h-[600px] overflow-y-auto whitespace-pre-wrap select-text">
              {combinedReviewText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
