'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Search,
  ArrowUpDown,
  Book,
  Save,
  ChevronLeft,
  Loader2,
  FileText,
  Bookmark,
  Hash,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  GraduationCap
} from 'lucide-react';

interface BookTracker {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  cover_image: string | null;
  total_pages: number | null;
  current_page: number;
  status: 'reading' | 'completed' | 'paused' | 'to_read';
  created_at: string;
  updated_at: string;
}

interface BookNote {
  id: string;
  book_tracker_id: string;
  user_id: string;
  page_number: number | null;
  chapter: string | null;
  passage: string;
  thoughts: string | null;
  created_at: string;
  updated_at: string;
}

const STUDY_TEMPLATES = [
  {
    name: '일반 기록 (General Note)',
    icon: '📝',
    placeholder: '구절을 읽고 느낀 점이나 기록해둘 생각을 적어보세요.'
  },
  {
    name: '개념 요약 (Key Concept)',
    icon: '💡',
    placeholder: '이 구절의 핵심 개념을 요약하고, 왜 중요한지 정리해보세요.\n\n[핵심 단어]:\n[한줄 요약]:\n[배운 점]:'
  },
  {
    name: '질문 & 탐구 (Question & Inquiry)',
    icon: '❓',
    placeholder: '구절을 읽으며 들었던 의문점이나 추가로 공부해볼 주제를 적어보세요.\n\n[의문점]:\n[가설/추측]:\n[찾아볼 레퍼런스]:'
  },
  {
    name: '실천 계획 (Action Item)',
    icon: '🏃',
    placeholder: '책의 내용을 내 삶이나 업무에 어떻게 적용할지 구체적인 실행 계획을 작성해보세요.\n\n[실천할 행동]:\n[목표 일시]:\n[기대 효과]:'
  }
];

export default function BookTrackerPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 데이터 상태
  const [books, setBooks] = useState<BookTracker[]>([]);
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // 검색/필터/정렬 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title_asc' | 'title_desc' | 'recent'>('title_asc');

  // 책 추가 모달/폼 상태
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookPublisher, setNewBookPublisher] = useState('');
  const [newBookTotalPages, setNewBookTotalPages] = useState<number | ''>('');

  // 노트 추가 상태
  const [newNotePassage, setNewNotePassage] = useState('');
  const [newNoteThoughts, setNewNoteThoughts] = useState('');
  const [newNotePage, setNewNotePage] = useState<number | ''>('');
  const [newNoteChapter, setNewNoteChapter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // 책 수정 상태
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editCurrentPage, setEditCurrentPage] = useState<number | ''>('');
  const [editTotalPages, setEditTotalPages] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<BookTracker['status']>('reading');

  useEffect(() => {
    async function checkUserAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchBooks(user.id);
      }
      setLoading(false);
    }
    checkUserAndLoad();
  }, []);

  useEffect(() => {
    if (selectedBookId) {
      fetchNotes(selectedBookId);
    } else {
      setNotes([]);
    }
  }, [selectedBookId]);

  // 책 목록 불러오기
  const fetchBooks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('book_trackers')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setBooks(data || []);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  // 특정 책의 노트 불러오기
  const fetchNotes = async (bookId: string) => {
    try {
      const { data, error } = await supabase
        .from('book_notes')
        .select('*')
        .eq('book_tracker_id', bookId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  // 책 추가
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newBookTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('book_trackers')
        .insert({
          user_id: user.id,
          title: newBookTitle.trim(),
          author: newBookAuthor.trim() || null,
          publisher: newBookPublisher.trim() || null,
          total_pages: newBookTotalPages ? Number(newBookTotalPages) : null,
          current_page: 0,
          status: 'reading'
        })
        .select()
        .single();

      if (error) throw error;

      setBooks([data, ...books]);
      setSelectedBookId(data.id);
      setShowAddBook(false);
      // 입력 초기화
      setNewBookTitle('');
      setNewBookAuthor('');
      setNewBookPublisher('');
      setNewBookTotalPages('');
    } catch (err) {
      console.error('Error adding book:', err);
      alert('책 등록 실패: 정보를 다시 확인해주세요.');
    }
  };

  // 노트 추가 (독서 기록 / 공부 요약)
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBookId || !newNotePassage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('book_notes')
        .insert({
          book_tracker_id: selectedBookId,
          user_id: user.id,
          page_number: newNotePage ? Number(newNotePage) : null,
          chapter: newNoteChapter.trim() || null,
          passage: newNotePassage.trim(),
          thoughts: newNoteThoughts.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      // 입력 초기화
      setNewNotePassage('');
      setNewNoteThoughts('');
      setNewNotePage('');
      setNewNoteChapter('');
    } catch (err) {
      console.error('Error adding note:', err);
      alert('기록 등록 실패');
    }
  };

  // 책 수정 저장
  const handleUpdateBookProgress = async (bookId: string) => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const updatedFields = {
        current_page: editCurrentPage !== '' ? Number(editCurrentPage) : book.current_page,
        total_pages: editTotalPages !== '' ? Number(editTotalPages) : book.total_pages,
        status: editStatus
      };

      const { data, error } = await supabase
        .from('book_trackers')
        .update(updatedFields)
        .eq('id', bookId)
        .select()
        .single();

      if (error) throw error;

      setBooks(books.map(b => b.id === bookId ? data : b));
      setEditingBookId(null);
    } catch (err) {
      console.error('Error updating book:', err);
      alert('책 정보 업데이트 실패');
    }
  };

  // 책 삭제
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('이 책과 관련된 모든 독서 기록/공부 노트가 영구적으로 삭제됩니다. 계속하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('book_trackers')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      setBooks(books.filter(b => b.id !== bookId));
      if (selectedBookId === bookId) {
        setSelectedBookId(null);
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      alert('책 삭제 실패');
    }
  };

  // 노트 삭제
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('book_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('기록 삭제 실패');
    }
  };

  // 공부 템플릿 적용 도우미
  const applyTemplate = (index: number) => {
    setSelectedTemplate(index);
    setNewNoteThoughts(STUDY_TEMPLATES[index].placeholder);
  };

  // 검색, 필터, 정렬 가공
  const filteredAndSortedBooks = books
    .filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title, 'ko');
      } else if (sortBy === 'title_desc') {
        return b.title.localeCompare(a.title, 'ko');
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  const selectedBook = books.find(b => b.id === selectedBookId);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-400">데이터 스캔 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6 animate-pulse" />
        <h1 className="text-2xl font-bold mb-2">보안 접속 세션 없음</h1>
        <p className="text-gray-400 max-w-md mb-8">
          이 기능은 CSE4Seoul 커뮤니티의 로그인된 유저들만 접근 가능합니다. 본인 전용 데이터 공간으로 안전하게 보호됩니다.
        </p>
        <Link
          href="/login"
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-lg transition-all"
        >
          로그인 페이지로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 relative overflow-hidden font-sans">
      {/* 배경 데코레이션 */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 상단 바 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-gray-800 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/dashboard"
                className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-gray-900/60 backdrop-blur-sm border border-gray-800/80 rounded-md hover:bg-cyan-950/20 hover:border-cyan-800/50 hover:text-cyan-400 transition-all duration-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>커맨드 센터</span>
              </Link>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950/50 text-cyan-400 border border-cyan-900">
                SECURE RECORD MODULE v1.2
              </span>
            </div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              Personal Study & Book Tracker
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              나만의 책장 & 인상깊은 구절과 생각을 영구적으로 요약/보관하는 RLS 보안 공간입니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-green-400 font-mono bg-green-950/30 px-3 py-1.5 rounded-lg border border-green-900/40">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span>RLS ACTIVE: ONLY {user.email?.split('@')[0]} ACCESSIBLE</span>
          </div>
        </div>

        {/* 메인 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 왼쪽 열 - 책 책장 (Grid Col 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* 검색 및 필터 패널 */}
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 p-4 rounded-xl">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="책 제목 또는 저자 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={() => setShowAddBook(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-bold flex items-center gap-1 shadow-lg shadow-cyan-950/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>등록</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 items-center justify-between text-xs">
                {/* 필터 탭 */}
                <div className="flex gap-1 bg-black p-1 rounded-md border border-gray-805">
                  {['all', 'reading', 'completed', 'to_read'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        statusFilter === tab
                          ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-900/50'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab === 'all' && '전체'}
                      {tab === 'reading' && '읽는 중'}
                      {tab === 'completed' && '완독'}
                      {tab === 'to_read' && '읽을 책'}
                    </button>
                  ))}
                </div>

                {/* 정렬 셀렉트 */}
                <div className="flex items-center gap-1 text-gray-400">
                  <ArrowUpDown className="w-3 h-3 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none text-xs text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="title_asc" className="bg-black text-white">책이름 (오름차순)</option>
                    <option value="title_desc" className="bg-black text-white">책이름 (내림차순)</option>
                    <option value="recent" className="bg-black text-white">최근 업데이트순</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 책 등록 폼 모달/드롭다운 */}
            <AnimatePresence>
              {showAddBook && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddBook}
                  className="bg-gray-900/50 border border-cyan-900/40 p-4 rounded-xl overflow-hidden space-y-3"
                >
                  <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                    <Book className="w-4 h-4" /> 새 도서 등록
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-400 mb-1">책 제목 *</label>
                      <input
                        type="text"
                        required
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        placeholder="이펙티브 타입스크립트"
                        className="w-full px-3 py-1.5 bg-black border border-gray-800 rounded text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">저자</label>
                      <input
                        type="text"
                        value={newBookAuthor}
                        onChange={(e) => setNewBookAuthor(e.target.value)}
                        placeholder="댄 밴더캄"
                        className="w-full px-3 py-1.5 bg-black border border-gray-800 rounded text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">총 페이지</label>
                      <input
                        type="number"
                        min="1"
                        value={newBookTotalPages}
                        onChange={(e) => setNewBookTotalPages(e.target.value ? Number(e.target.value) : '')}
                        placeholder="350"
                        className="w-full px-3 py-1.5 bg-black border border-gray-800 rounded text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowAddBook(false)}
                      className="px-3 py-1.5 bg-gray-850 hover:bg-gray-855 border border-gray-800 rounded text-gray-300 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-bold transition-colors"
                    >
                      등록하기
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* 책 리스트 컨테이너 */}
            <div className="flex-1 max-h-[60vh] lg:max-h-[68vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredAndSortedBooks.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/10 text-gray-500">
                  <Bookmark className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm">등록된 책이 없거나 검색 결과가 없습니다.</p>
                  <p className="text-xs text-gray-600 mt-1">우측 상단 [등록] 버튼으로 책을 추가해보세요.</p>
                </div>
              ) : (
                filteredAndSortedBooks.map((book) => {
                  const isSelected = book.id === selectedBookId;
                  const isEditing = book.id === editingBookId;
                  const progressPct = book.total_pages ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0;

                  return (
                    <div
                      key={book.id}
                      onClick={() => {
                        if (!isEditing) {
                          setSelectedBookId(book.id);
                        }
                      }}
                      className={`group p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/40 to-blue-950/20 border-cyan-700/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-gray-900/20 hover:bg-gray-900/40 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {book.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {book.author || '저자 미상'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {/* 상태 뱃지 */}
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                            book.status === 'reading' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' :
                            book.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                            book.status === 'paused' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                            'bg-gray-900 text-gray-400 border border-gray-800'
                          }`}>
                            {book.status === 'reading' && '읽는 중'}
                            {book.status === 'completed' && '완독'}
                            {book.status === 'paused' && '보류'}
                            {book.status === 'to_read' && '읽을 책'}
                          </span>
                        </div>
                      </div>

                      {/* 페이지 진행률 바 */}
                      {book.total_pages && (
                        <div className="mt-4 space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-gray-500">
                            <span>진행도: {book.current_page} / {book.total_pages} pg</span>
                            <span className="font-mono text-cyan-400 font-bold">{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-gray-800 animate-pulse">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* 수정 및 관리 인터페이스 */}
                      {isEditing ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-4 pt-3 border-t border-gray-800 space-y-3"
                        >
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[9px] text-gray-400 mb-0.5">현재 페이지</label>
                              <input
                                type="number"
                                min="0"
                                max={editTotalPages || undefined}
                                value={editCurrentPage}
                                onChange={(e) => setEditCurrentPage(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-2 py-1 bg-black border border-gray-800 rounded text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-gray-400 mb-0.5">총 페이지</label>
                              <input
                                type="number"
                                min="1"
                                value={editTotalPages}
                                onChange={(e) => setEditTotalPages(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-2 py-1 bg-black border border-gray-800 rounded text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-gray-400 mb-0.5">상태</label>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as any)}
                                className="w-full px-1.5 py-1 bg-black border border-gray-800 rounded text-xs text-white"
                              >
                                <option value="reading">읽는 중</option>
                                <option value="completed">완독</option>
                                <option value="paused">보류</option>
                                <option value="to_read">읽을 책</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-1.5 text-[11px]">
                            <button
                              onClick={() => setEditingBookId(null)}
                              className="px-2 py-1 bg-gray-800 rounded text-gray-400 hover:bg-gray-700"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleUpdateBookProgress(book.id)}
                              className="px-3 py-1 bg-cyan-700 rounded text-white font-bold hover:bg-cyan-600 flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> 저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>최근 갱신: {new Date(book.updated_at).toLocaleDateString()}</span>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingBookId(book.id);
                                setEditCurrentPage(book.current_page);
                                setEditTotalPages(book.total_pages || '');
                                setEditStatus(book.status);
                              }}
                              className="hover:text-cyan-400 flex items-center gap-0.5"
                            >
                              <Edit3 className="w-3 h-3" /> 진행 수정
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="hover:text-red-400 flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" /> 삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 오른쪽 열 - 선택된 책의 독서 노트/공부 섹션 (Grid Col 7) */}
          <div className="lg:col-span-7 flex flex-col min-h-[50vh] lg:min-h-[75vh]">
            
            {selectedBook ? (
              <div className="bg-gray-900/10 border border-gray-800 rounded-xl p-6 flex-1 flex flex-col gap-6">
                
                {/* 책 상세 정보 헤더 */}
                <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                      {selectedBook.title}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedBook.author ? `${selectedBook.author} 지음` : '저자 미상'} 
                      {selectedBook.publisher && ` | ${selectedBook.publisher}`}
                    </p>
                  </div>
                  
                  {/* 공부용 모듈 요약 */}
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-mono">기록된 세션 수</span>
                    <span className="text-xl font-bold text-cyan-400 font-mono">{notes.length} notes</span>
                  </div>
                </div>

                {/* 독서 기록 작성 폼 (인상깊은 구절 + 생각 적기) */}
                <form onSubmit={handleAddNote} className="bg-gray-900/30 border border-gray-800 p-4 rounded-xl space-y-4 font-sans">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> 인상깊은 구절 & 학습 생각 기록
                    </h3>
                    
                    {/* 위치 입력 (페이지, 챕터) */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 font-mono">pg.</span>
                        <input
                          type="number"
                          placeholder="페이지"
                          value={newNotePage}
                          onChange={(e) => setNewNotePage(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 bg-black border border-gray-800 rounded text-center text-xs text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 font-mono">ch.</span>
                        <input
                          type="text"
                          placeholder="챕터/제목"
                          value={newNoteChapter}
                          onChange={(e) => setNewNoteChapter(e.target.value)}
                          className="w-24 px-1.5 py-0.5 bg-black border border-gray-800 rounded text-center text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 인상깊은 구절 입력 */}
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 flex items-center gap-1">
                      <span className="w-1 h-1 bg-cyan-400 rounded-full"></span> 
                      인상깊은 구절 또는 핵심 내용 *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="한 눈에 들어왔던 책의 구절이나, 공부하고 있는 핵심 단락을 그대로 옮겨 적어보세요."
                      value={newNotePassage}
                      onChange={(e) => setNewNotePassage(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  {/* 공부 템플릿 선택 및 자신의 생각 입력 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] text-gray-400 flex items-center gap-1">
                        <span className="w-1 h-1 bg-purple-400 rounded-full"></span> 
                        자신의 생각 또는 분석/요약
                      </label>
                      
                      {/* 공부 도우미 템플릿 */}
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-purple-400" />
                        학습 템플릿:
                      </span>
                    </div>

                    {/* 템플릿 단축 칩 */}
                    <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                      {STUDY_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyTemplate(idx)}
                          className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors flex items-center gap-1 ${
                            selectedTemplate === idx
                              ? 'bg-purple-950 text-purple-400 font-bold border border-purple-900/50'
                              : 'bg-black text-gray-400 hover:text-white border border-gray-800'
                          }`}
                        >
                          <span>{tmpl.icon}</span>
                          <span>{tmpl.name.split(' (')[0]}</span>
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={4}
                      placeholder="구절에 대한 나만의 해석, 비판적 시각, 혹은 실천 계획을 적어보세요. (공부용 템플릿을 선택하면 프레임이 자동 입력됩니다)"
                      value={newNoteThoughts}
                      onChange={(e) => setNewNoteThoughts(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!newNotePassage.trim()}
                      className="px-5 py-2 bg-gradient-to-r from-purple-700 to-cyan-700 hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md shadow-purple-950/20 active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>기록 저장</span>
                    </button>
                  </div>
                </form>

                {/* 노트 리스트 / 공부 타임라인 */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-3 flex items-center gap-1 uppercase">
                    <FileText className="w-3.5 h-3.5" /> STUDY LOGS TIMELINE
                  </h3>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar max-h-[350px] lg:max-h-[400px]">
                    {notes.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-900/5 text-gray-600">
                        <Lightbulb className="w-8 h-8 mx-auto mb-1.5 text-gray-755 animate-pulse" />
                        <p className="text-xs">이 책에 기록된 독서 노트가 아직 없습니다.</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">상단 폼을 채워 첫 인상깊은 구절과 생각을 남겨보세요!</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-gray-950/50 hover:bg-gray-950/80 border border-gray-800 hover:border-gray-700 p-4 rounded-xl relative group transition-all"
                        >
                          {/* 위치 인디케이터 (페이지, 챕터) */}
                          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono">
                            {(note.page_number || note.chapter) && (
                              <span className="px-2 py-0.5 rounded bg-gray-900 text-cyan-400 font-bold border border-gray-800 flex items-center gap-0.5">
                                <Hash className="w-2.5 h-2.5" />
                                {note.chapter && `${note.chapter}`}
                                {note.page_number && ` p.${note.page_number}`}
                              </span>
                            )}
                            <span className="text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>

                          {/* 구절 표시 */}
                          <div className="pl-3 border-l-2 border-cyan-500 text-xs italic text-gray-200 mb-3 bg-cyan-950/10 py-1.5 pr-2 rounded-r-md">
                            &ldquo;{note.passage}&rdquo;
                          </div>

                          {/* 생각 표시 */}
                          {note.thoughts && (
                            <div className="bg-purple-950/10 border border-purple-950/30 p-3 rounded-lg text-xs text-gray-300 font-sans whitespace-pre-wrap leading-relaxed">
                              <span className="text-[9px] text-purple-400 font-bold block mb-1 uppercase tracking-wider font-mono">
                                [ Operator Reflections ]
                              </span>
                              {note.thoughts}
                            </div>
                          )}

                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
                            title="기록 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-gray-900/10 border border-dashed border-gray-800 rounded-xl p-12 flex-1 flex flex-col items-center justify-center text-center">
                <Book className="w-16 h-16 text-gray-700 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-400 mb-1">도서 선택 대기 중</h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  왼쪽 책장 리스트에서 책을 선택하거나, 새 책을 등록하여 독서 공부 노트를 작성해보세요.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
