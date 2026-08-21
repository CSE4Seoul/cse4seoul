'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import {
  Wallet,
  Briefcase,
  TrendingDown,
  TrendingUp,
  Calendar as CalendarIcon,
  PlusCircle,
  Edit3,
  Trash2,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Percent,
  Clock,
  Coins,
  FileDown,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Receipt,
  Search,
  Filter
} from 'lucide-react';

export interface AccountRecord {
  id: string;
  user_id?: string;
  record_type: 'wage' | 'income' | 'expense';
  record_date: string; // YYYY-MM-DD
  title: string;
  category: string;
  gross_amount: number;
  tax_type: 'none' | '3.3_freelance' | 'four_insurances' | 'custom';
  tax_rate: number;
  tax_amount: number;
  net_amount: number;
  work_hours?: number;
  hourly_wage?: number;
  extra_pay?: number;
  payment_method?: 'card' | 'cash' | 'transfer' | 'other';
  memo?: string;
  created_at?: string;
  updated_at?: string;
}

interface AccountBookWidgetProps {
  userId?: string | null;
}

// 기본 카테고리 프리셋
const WAGE_CATEGORIES = ['파트타임/알바', '일용직/일당', '월급/급여', '프리랜서 용역', '과외/강의', '기타 근로'];
const INCOME_CATEGORIES = ['용돈/지원금', '중고거래', '금융이자/배당', '상금/캐시백', '기타 수입'];
const EXPENSE_CATEGORIES = ['식비/카페', '교통/주유', '주거/통신/공과금', '쇼핑/생활용품', '문화/여가/취미', '의료/건강', '금융/보험/투자', '기타 지출'];

export default function AccountBookWidget({ userId }: AccountBookWidgetProps) {
  const supabase = useMemo(() => createClient(), []);

  // 오늘 날짜 문자열 반환 (KST 기준 YYYY-MM-DD)
  const getTodayString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const dateKST = new Date(d.getTime() - offset);
    return dateKST.toISOString().split('T')[0];
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 위젯 활성화(On/Off 및 접기) 상태
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 탭 상태: 'dashboard' | 'calendar' | 'record' | 'list'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'record' | 'list'>('dashboard');

  // 데이터 상태
  const [records, setRecords] = useState<AccountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 캘린더 연/월 상태 (기본값: 오늘 기준)
  const todayStr = useMemo(() => getTodayString(), []);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1); // 1 ~ 12
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // 폼 입력 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<'wage' | 'income' | 'expense'>('wage');
  const [recordDate, setRecordDate] = useState<string>(todayStr);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('파트타임/알바');
  
  // 근무/급여 관련 계산 입력
  const [workHours, setWorkHours] = useState<string>('5');
  const [hourlyWage, setHourlyWage] = useState<string>('10030'); // 2025/2026 최저시급 기준선
  const [extraPay, setExtraPay] = useState<string>('0');
  
  // 금액 및 세금 옵션
  const [grossAmount, setGrossAmount] = useState<string>('');
  const [taxType, setTaxType] = useState<'none' | '3.3_freelance' | 'four_insurances' | 'custom'>('3.3_freelance');
  const [customTaxRate, setCustomTaxRate] = useState<string>('3.3');
  const [customTaxAmount, setCustomTaxAmount] = useState<string>('0');
  
  // 지출 결제수단 및 메모
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer' | 'other'>('card');
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 리스트 필터 상태
  const [filterType, setFilterType] = useState<'ALL' | 'wage' | 'income' | 'expense'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. 데이터 가져오기 (로그인 유저인 경우에만 Supabase 쿼리 실행)
  const fetchRecords = useCallback(async () => {
    if (!userId) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('account_book_records')
        .select('*')
        .eq('user_id', userId)
        .order('record_date', { ascending: false });

      if (error) {
        console.error('Error fetching account records:', error);
        // Supabase 테이블이 아직 생성되지 않은 경우 로컬스토리지 백업
        const local = localStorage.getItem(`local_account_records_${userId}`);
        if (local) {
          try {
            setRecords(JSON.parse(local));
          } catch {
            setRecords([]);
          }
        }
      } else if (data) {
        setRecords(data as AccountRecord[]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) {
      fetchRecords();
    }
  }, [userId, fetchRecords]);

  // 카테고리 목록 자동 동기화
  useEffect(() => {
    if (recordType === 'wage') {
      if (!WAGE_CATEGORIES.includes(category)) setCategory(WAGE_CATEGORIES[0]);
    } else if (recordType === 'income') {
      if (!INCOME_CATEGORIES.includes(category)) setCategory(INCOME_CATEGORIES[0]);
    } else {
      if (!EXPENSE_CATEGORIES.includes(category)) setCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [recordType]);

  // 근무(Wage) 입력 시 시급/시간 기반 세전 금액 자동 계산
  useEffect(() => {
    if (recordType === 'wage') {
      const hours = parseFloat(workHours) || 0;
      const wage = parseFloat(hourlyWage) || 0;
      const extra = parseFloat(extraPay) || 0;
      const computedGross = Math.round(hours * wage + extra);
      setGrossAmount(computedGross > 0 ? computedGross.toString() : '');
    }
  }, [workHours, hourlyWage, extraPay, recordType]);

  // 세금 및 실질급여(Net Amount) 계산식
  const calculatedAmounts = useMemo(() => {
    const gross = parseFloat(grossAmount) || 0;
    if (recordType === 'expense') {
      return {
        gross,
        taxRate: 0,
        taxAmount: 0,
        netAmount: gross
      };
    }

    let rate = 0;
    let tax = 0;

    if (taxType === '3.3_freelance') {
      rate = 3.3;
      tax = Math.round(gross * 0.033);
    } else if (taxType === 'four_insurances') {
      // 4대보험 간이 공제 약 9.4% (국민연금 4.5% + 건보 3.545% + 장기요양 + 고용보험 0.9%)
      rate = 9.4;
      tax = Math.round(gross * 0.094);
    } else if (taxType === 'none') {
      rate = 0;
      tax = 0;
    } else if (taxType === 'custom') {
      rate = parseFloat(customTaxRate) || 0;
      tax = parseFloat(customTaxAmount) || Math.round((gross * rate) / 100);
    }

    const net = Math.max(0, gross - tax);
    return {
      gross,
      taxRate: rate,
      taxAmount: tax,
      netAmount: net
    };
  }, [grossAmount, taxType, customTaxRate, customTaxAmount, recordType]);

  // 폼 초기화
  const resetForm = () => {
    setEditingId(null);
    setRecordType('wage');
    setRecordDate(todayStr);
    setTitle('');
    setCategory(WAGE_CATEGORIES[0]);
    setWorkHours('5');
    setHourlyWage('10030');
    setExtraPay('0');
    setGrossAmount('');
    setTaxType('3.3_freelance');
    setCustomTaxRate('3.3');
    setCustomTaxAmount('0');
    setPaymentMethod('card');
    setMemo('');
  };

  // 수정 버튼 클릭 시 폼에 데이터 로드
  const handleEdit = (record: AccountRecord) => {
    setEditingId(record.id);
    setRecordType(record.record_type);
    setRecordDate(record.record_date);
    setTitle(record.title);
    setCategory(record.category);
    setGrossAmount(record.gross_amount.toString());
    setTaxType(record.tax_type || 'none');
    setCustomTaxRate(record.tax_rate?.toString() || '0');
    setCustomTaxAmount(record.tax_amount?.toString() || '0');
    setWorkHours(record.work_hours ? record.work_hours.toString() : '0');
    setHourlyWage(record.hourly_wage ? record.hourly_wage.toString() : '0');
    setExtraPay(record.extra_pay ? record.extra_pay.toString() : '0');
    setPaymentMethod(record.payment_method || 'card');
    setMemo(record.memo || '');
    setActiveTab('record');
  };

  // 등록 / 수정 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage({ type: 'error', text: '로그인 후 등록할 수 있습니다.' });
      return;
    }

    if (!title.trim()) {
      setMessage({ type: 'error', text: '제목(근무처 또는 적요)을 입력해주세요.' });
      return;
    }

    const { gross, taxRate, taxAmount } = calculatedAmounts;
    if (gross <= 0) {
      setMessage({ type: 'error', text: '금액을 0원보다 크게 입력해주세요.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // net_amount는 DB Generated Column이므로 페이로드에서 제외하여 무결성 유지
    const payload = {
      user_id: userId,
      record_type: recordType,
      record_date: recordDate,
      title: title.trim(),
      category: category,
      gross_amount: gross,
      tax_type: recordType === 'expense' ? 'none' : taxType,
      tax_rate: recordType === 'expense' ? 0 : taxRate,
      tax_amount: recordType === 'expense' ? 0 : taxAmount,
      work_hours: recordType === 'wage' ? parseFloat(workHours) || 0 : 0,
      hourly_wage: recordType === 'wage' ? parseFloat(hourlyWage) || 0 : 0,
      extra_pay: recordType === 'wage' ? parseFloat(extraPay) || 0 : 0,
      payment_method: paymentMethod,
      memo: memo.trim() || null
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('account_book_records')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', userId);

        if (error) throw error;
        setMessage({ type: 'success', text: '기록이 성공적으로 수정되었습니다! ✨' });
      } else {
        const { error } = await supabase
          .from('account_book_records')
          .insert([payload]);

        if (error) throw error;
        setMessage({ type: 'success', text: '새 기록이 정상적으로 등록되었습니다! 🎉' });
      }

      await fetchRecords();
      resetForm();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Submit error:', err);
      setMessage({ type: 'error', text: err.message || '저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 삭제 처리
  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 기록을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('account_book_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error('Delete error:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 이번 달 및 전체 통계 계산
  const stats = useMemo(() => {
    const currentMonthPrefix = `${calYear}-${String(calMonth).padStart(2, '0')}`;
    const monthRecords = records.filter((r) => r.record_date.startsWith(currentMonthPrefix));

    let totalGrossWage = 0;
    let totalWageTax = 0;
    let totalNetWage = 0;
    let totalWorkHours = 0;

    let totalIncome = 0;
    let totalExpense = 0;

    const expenseCategoryMap: Record<string, number> = {};

    monthRecords.forEach((r) => {
      if (r.record_type === 'wage') {
        totalGrossWage += Number(r.gross_amount || 0);
        totalWageTax += Number(r.tax_amount || 0);
        totalNetWage += Number(r.net_amount || (r.gross_amount - r.tax_amount) || 0);
        totalWorkHours += Number(r.work_hours || 0);
      } else if (r.record_type === 'income') {
        totalIncome += Number(r.net_amount || r.gross_amount || 0);
      } else if (r.record_type === 'expense') {
        const amt = Number(r.gross_amount || 0);
        totalExpense += amt;
        expenseCategoryMap[r.category] = (expenseCategoryMap[r.category] || 0) + amt;
      }
    });

    const totalRealTakeHome = totalNetWage + totalIncome; // 실제 총 손에 쥔 수입
    const netBalance = totalRealTakeHome - totalExpense; // 실수령 기준 순 잔여금

    return {
      monthRecordsCount: monthRecords.length,
      totalGrossWage,
      totalWageTax,
      totalNetWage,
      totalWorkHours,
      totalIncome,
      totalExpense,
      totalRealTakeHome,
      netBalance,
      expenseCategoryMap
    };
  }, [records, calYear, calMonth]);

  // 캘린더 날짜 렌더링용 계산
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay(); // 0(일) ~ 6(토)
    const totalDays = new Date(calYear, calMonth, 0).getDate(); // 해당 월 총 일수

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      hasWage: boolean;
      hasIncome: boolean;
      hasExpense: boolean;
      totalNetIncome: number;
      totalExpense: number;
    }> = [];

    // 빈 날짜 채우기 (이전 달 여백)
    for (let i = 0; i < firstDay; i++) {
      days.push({
        dateStr: '',
        dayNum: 0,
        isCurrentMonth: false,
        hasWage: false,
        hasIncome: false,
        hasExpense: false,
        totalNetIncome: 0,
        totalExpense: 0
      });
    }

    // 이번 달 날짜들
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecs = records.filter((r) => r.record_date === dateStr);

      const hasWage = dayRecs.some((r) => r.record_type === 'wage');
      const hasIncome = dayRecs.some((r) => r.record_type === 'income');
      const hasExpense = dayRecs.some((r) => r.record_type === 'expense');

      const totalNetIncome = dayRecs
        .filter((r) => r.record_type === 'wage' || r.record_type === 'income')
        .reduce((sum, r) => sum + Number(r.net_amount || (r.gross_amount - r.tax_amount) || 0), 0);

      const totalExp = dayRecs
        .filter((r) => r.record_type === 'expense')
        .reduce((sum, r) => sum + Number(r.gross_amount || 0), 0);

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        hasWage,
        hasIncome,
        hasExpense,
        totalNetIncome,
        totalExpense: totalExp
      });
    }

    return days;
  }, [calYear, calMonth, records]);

  // CSV 다운로드 기능
  const exportToCSV = () => {
    if (records.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = ['날짜', '구분', '제목', '카테고리', '세전금액', '세금유형', '세율(%)', '세금/공제액', '실질수령액/지출액', '근무시간', '시급', '수단', '메모'];
    const rows = records.map((r) => [
      r.record_date,
      r.record_type === 'wage' ? '근무/급여' : r.record_type === 'income' ? '기타수입' : '지출',
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.gross_amount,
      r.tax_type || 'none',
      r.tax_rate || 0,
      r.tax_amount || 0,
      r.net_amount,
      r.work_hours || 0,
      r.hourly_wage || 0,
      r.payment_method || 'card',
      `"${(r.memo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CSE4Seoul_가계부급여장부_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 필터링된 기록 목록
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchType = filterType === 'ALL' || r.record_type === filterType;
      const matchQuery =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.memo && r.memo.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchQuery;
    });
  }, [records, filterType, searchQuery]);

  // 선택된 날짜의 기록 목록
  const selectedDateRecords = useMemo(() => {
    return records.filter((r) => r.record_date === selectedDate);
  }, [records, selectedDate]);

  if (!isMounted) return null;

  return (
    <div className="mt-8 relative group rounded-3xl border border-white/[0.08] hover:border-emerald-500/25 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-500 overflow-hidden">
      {/* 상단 네온 하이라이트 라인 */}
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent z-10" />

      {/* 위젯 헤더 */}
      <div className="p-6 pb-4 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-wide">실질급여 & 가계부 장부</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                LEDGER v2.0
              </span>
            </div>
            <p className="text-xs text-gray-400">
              세금(3.3% / 4대보험) 공제 후 실질급여 자동 산출 및 일별 가계부 관리
            </p>
          </div>
        </div>

        {/* 위젯 우측 컨트롤: On/Off 접기 토글 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800 text-xs font-medium text-gray-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            title={isCollapsed ? '위젯 펼치기' : '위젯 접기'}
          >
            {isCollapsed ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>펼치기</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>접기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 비로그인 유저인 경우 (DB 절약을 위해 쿼리 없이 안내 배너 렌더링) */}
      {!userId ? (
        <div className="p-8 text-center bg-gray-950/40">
          <div className="max-w-md mx-auto flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">로그인 후 나만의 급여·가계부를 이용하세요</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              시급 기반 세전/세후 실질급여 자동 계산, 3.3% 및 4대보험 원터치 공제, 달력 기반 수입·지출 내역 관리를 안전하게 지원합니다.
            </p>
            <Link
              href="/login"
              className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>로그인하고 가계부 시작하기</span>
            </Link>
          </div>
        </div>
      ) : isCollapsed ? (
        // 접힌 상태 (요약 바)
        <div className="p-4 bg-gray-950/50 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              이번 달 실질수령액:{' '}
              <strong className="text-emerald-400 font-mono">
                {stats.totalRealTakeHome.toLocaleString()}원
              </strong>
            </span>
            <span>
              이번 달 총 지출:{' '}
              <strong className="text-rose-400 font-mono">
                {stats.totalExpense.toLocaleString()}원
              </strong>
            </span>
            <span>
              순 잔액:{' '}
              <strong
                className={`font-mono font-bold ${
                  stats.netBalance >= 0 ? 'text-teal-400' : 'text-rose-500'
                }`}
              >
                {stats.netBalance.toLocaleString()}원
              </strong>
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-emerald-400 hover:underline text-[11px]"
          >
            상세 보기 →
          </button>
        </div>
      ) : (
        // 펼쳐진 상태 본체
        <div className="p-6 pt-4 space-y-6">
          {/* 상단 탭 버튼 그룹 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-gray-950/60 rounded-xl border border-gray-800">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>월간 대시보드</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>달력 & 일별</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('record');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'record'
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{editingId ? '기록 수정' : '새 기록 추가'}</span>
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'list'
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>전체 내역 ({records.length})</span>
              </button>
            </div>

            {/* 월 변경 및 오늘 버튼 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-950/60 border border-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    if (calMonth === 1) {
                      setCalYear(calYear - 1);
                      setCalMonth(12);
                    } else {
                      setCalMonth(calMonth - 1);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition"
                  title="이전 달"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold font-mono text-gray-200">
                  {calYear}년 {calMonth}월
                </span>
                <button
                  onClick={() => {
                    if (calMonth === 12) {
                      setCalYear(calYear + 1);
                      setCalMonth(1);
                    } else {
                      setCalMonth(calMonth + 1);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition"
                  title="다음 달"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  const now = new Date();
                  setCalYear(now.getFullYear());
                  setCalMonth(now.getMonth() + 1);
                  setSelectedDate(todayStr);
                }}
                className="px-2.5 py-1.5 bg-gray-900 border border-gray-700/60 rounded-lg text-[11px] font-bold text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition"
              >
                오늘
              </button>
            </div>
          </div>

          {/* 알림 메시지 */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* ======================= TAB 1: 월간 대시보드 ======================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 핵심 지표 4단 카드 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. 세전 총 급여 & 근무시간 */}
                <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      근무 세전 급여
                    </span>
                    <span className="text-[10px] font-mono bg-blue-950/50 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900">
                      총 {stats.totalWorkHours}시간
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {stats.totalGrossWage.toLocaleString()}원
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    시급·수당 기준 총 발생액
                  </div>
                </div>

                {/* 2. 공제 세금 (3.3% / 4대보험) */}
                <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-amber-400" />
                      공제 세금/보험료
                    </span>
                    <span className="text-[10px] font-mono bg-amber-950/50 text-amber-400 px-1.5 py-0.5 rounded border border-amber-900">
                      공제액
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-400">
                    -{stats.totalWageTax.toLocaleString()}원
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    원천징수 및 4대보험 합산
                  </div>
                </div>

                {/* 3. 실제 손에 쥔 실질급여 (Net Take-home) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-500/40 flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Coins className="w-3.5 h-3.5 text-emerald-300" />
                      실질 수령 총액 (Net)
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700">
                      실수령
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-300">
                    {stats.totalRealTakeHome.toLocaleString()}원
                  </div>
                  <div className="text-[11px] text-emerald-400/70 mt-2">
                    급여 {stats.totalNetWage.toLocaleString()}원 + 기타 {stats.totalIncome.toLocaleString()}원
                  </div>
                </div>

                {/* 4. 총 지출 & 순 잔여금 */}
                <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                      총 지출 / 순잔여
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        stats.netBalance >= 0
                          ? 'bg-teal-950/50 text-teal-400 border-teal-900'
                          : 'bg-rose-950/50 text-rose-400 border-rose-900'
                      }`}
                    >
                      {stats.netBalance >= 0 ? '흑자' : '적자'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-bold font-mono text-rose-400">
                      -{stats.totalExpense.toLocaleString()}원
                    </div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        stats.netBalance >= 0 ? 'text-teal-400' : 'text-rose-500'
                      }`}
                    >
                      남음: {stats.netBalance.toLocaleString()}원
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    지출 제외 실질 저축 가능액
                  </div>
                </div>
              </div>

              {/* 지출 카테고리별 비중 및 빠른 액션 바 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 지출 카테고리 랭킹 */}
                <div className="p-5 rounded-2xl bg-gray-950/50 border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-rose-400" />
                      {calMonth}월 지출 카테고리 비중
                    </span>
                    <span className="text-gray-500">총 {stats.totalExpense.toLocaleString()}원</span>
                  </div>

                  {Object.keys(stats.expenseCategoryMap).length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500">
                      이번 달 등록된 지출 내역이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {Object.entries(stats.expenseCategoryMap)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, amt]) => {
                          const pct = stats.totalExpense > 0 ? Math.round((amt / stats.totalExpense) * 100) : 0;
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-300">
                                <span>{cat}</span>
                                <span className="font-mono text-gray-400">
                                  {amt.toLocaleString()}원 ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* 퀵 바로가기 및 가이드 */}
                <div className="p-5 rounded-2xl bg-gray-950/50 border border-gray-800 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      스마트 급여·가계부 팁
                    </h4>
                    <ul className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
                      <li>• <strong>3.3% 원천징수</strong>: 프리랜서, 용역, 사업소득세 공제 시 선택</li>
                      <li>• <strong>4대보험 간이 공제</strong>: 근로자 부담분(국민, 건강, 고용 등 약 9.4%) 자동 차감</li>
                      <li>• <strong>달력 연동</strong>: 달력에서 일한 날짜를 클릭하면 해당 날짜로 바로 등록/조회 가능</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800/80">
                    <button
                      onClick={() => {
                        resetForm();
                        setRecordType('wage');
                        setActiveTab('record');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>+ 오늘 일한 급여 등록</span>
                    </button>
                    <button
                      onClick={() => {
                        resetForm();
                        setRecordType('expense');
                        setActiveTab('record');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>+ 오늘 지출 등록</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB 2: 캘린더 & 일별 내역 ======================= */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 좌측: 인터랙티브 미니 캘린더 (7열) */}
              <div className="lg:col-span-7 bg-gray-950/60 p-4 rounded-2xl border border-gray-800">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-emerald-400" />
                    <span>
                      {calYear}년 {calMonth}월 달력
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 근무
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 수입
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> 지출
                    </span>
                  </div>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-gray-500 mb-2">
                  <div className="text-rose-400">일</div>
                  <div>월</div>
                  <div>화</div>
                  <div>수</div>
                  <div>목</div>
                  <div>금</div>
                  <div className="text-blue-400">토</div>
                </div>

                {/* 날짜 셀 그리드 */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((day, idx) => {
                    if (!day.isCurrentMonth) {
                      return <div key={`empty-${idx}`} className="h-14 rounded-xl bg-transparent" />;
                    }

                    const isSelected = day.dateStr === selectedDate;
                    const isToday = day.dateStr === todayStr;

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => setSelectedDate(day.dateStr)}
                        className={`h-14 p-1 rounded-xl border flex flex-col justify-between text-left transition-all duration-200 relative group/cell ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                            : isToday
                            ? 'bg-gray-900 border-emerald-500/50 hover:border-emerald-400'
                            : 'bg-gray-900/40 border-gray-800/80 hover:bg-gray-850 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isToday
                                ? 'text-emerald-400 underline underline-offset-2'
                                : isSelected
                                ? 'text-emerald-300'
                                : 'text-gray-300'
                            }`}
                          >
                            {day.dayNum}
                          </span>
                          {isToday && (
                            <span className="text-[8px] font-bold px-1 rounded bg-emerald-900/80 text-emerald-300">
                              오늘
                            </span>
                          )}
                        </div>

                        {/* 상태 점 뱃지 및 금액 */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            {day.hasWage && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="근무 기록" />}
                            {day.hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="기타 수입" />}
                            {day.hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="지출 기록" />}
                          </div>

                          {day.totalNetIncome > 0 && (
                            <div className="text-[8px] font-mono text-emerald-400 font-bold truncate">
                              +{Math.round(day.totalNetIncome / 1000)}k
                            </div>
                          )}
                          {day.totalExpense > 0 && (
                            <div className="text-[8px] font-mono text-rose-400 truncate">
                              -{Math.round(day.totalExpense / 1000)}k
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 우측: 선택된 날짜 상세 내역 리스트 (5열) */}
              <div className="lg:col-span-5 bg-gray-950/60 p-4 rounded-2xl border border-gray-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{selectedDate} 기록</span>
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        {selectedDate === todayStr ? '오늘 선택됨' : '선택된 일자'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        resetForm();
                        setRecordDate(selectedDate);
                        setActiveTab('record');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>이 날짜에 추가</span>
                    </button>
                  </div>

                  {/* 해당 일자 기록 목록 */}
                  {selectedDateRecords.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-500 space-y-2">
                      <p>이 날짜에 등록된 기록이 없습니다.</p>
                      <button
                        onClick={() => {
                          resetForm();
                          setRecordDate(selectedDate);
                          setActiveTab('record');
                        }}
                        className="text-emerald-400 hover:underline text-xs"
                      >
                        + 첫 번째 기록 작성하기
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {selectedDateRecords.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mt-0.5 ${
                                r.record_type === 'wage'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : r.record_type === 'income'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {r.record_type === 'wage' ? '💼' : r.record_type === 'income' ? '💰' : '💳'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{r.title}</span>
                                <span className="text-[10px] text-gray-400 px-1.5 py-0.2 rounded bg-gray-800">
                                  {r.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                {r.record_type === 'wage' ? (
                                  <span>
                                    {r.work_hours}h × {r.hourly_wage?.toLocaleString()}원 | 실질급여:{' '}
                                    <strong className="text-emerald-400">
                                      {r.net_amount?.toLocaleString()}원
                                    </strong>
                                    {r.tax_amount > 0 && ` (세금 -${r.tax_amount?.toLocaleString()}원)`}
                                  </span>
                                ) : r.record_type === 'income' ? (
                                  <span className="text-emerald-400 font-bold">
                                    +{r.net_amount?.toLocaleString()}원
                                  </span>
                                ) : (
                                  <span className="text-rose-400 font-bold">
                                    -{r.gross_amount?.toLocaleString()}원 ({r.payment_method})
                                  </span>
                                )}
                              </div>
                              {r.memo && <p className="text-[10px] text-gray-500 mt-1">{r.memo}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEdit(r)}
                              className="p-1 text-gray-400 hover:text-emerald-400 transition"
                              title="수정"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1 text-gray-400 hover:text-rose-400 transition"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 해당 일자 합계 바 */}
                <div className="pt-3 border-t border-gray-800 mt-3 flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-400">일일 순 손익</span>
                  <span className="font-bold text-white">
                    {selectedDateRecords
                      .reduce((sum, r) => {
                        if (r.record_type === 'wage' || r.record_type === 'income') {
                          return sum + Number(r.net_amount || (r.gross_amount - r.tax_amount) || 0);
                        }
                        return sum - Number(r.gross_amount || 0);
                      }, 0)
                      .toLocaleString()}
                    원
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB 3: 기록 등록 및 수정 폼 ======================= */}
          {activeTab === 'record' && (
            <form onSubmit={handleSubmit} className="bg-gray-950/60 p-5 rounded-2xl border border-gray-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {editingId ? '가계부/급여 기록 수정' : '새 가계부/급여 기록 작성'}
                  </h4>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>수정 취소 (새로 작성)</span>
                  </button>
                )}
              </div>

              {/* 1. 분류 선택 (근무/급여 vs 기타 수입 vs 지출) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">기록 구분 (3가지)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordType('wage')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      recordType === 'wage'
                        ? 'bg-blue-950/70 border-blue-500 text-blue-300 shadow-md shadow-blue-950'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>💼 근무 / 알바 급여</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('income')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      recordType === 'income'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>💰 기타 수입</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('expense')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      recordType === 'expense'
                        ? 'bg-rose-950/70 border-rose-500 text-rose-300 shadow-md shadow-rose-950'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>💳 지출 내역</span>
                  </button>
                </div>
              </div>

              {/* 2. 날짜 및 제목/카테고리 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 일한 날짜 / 거래 날짜 (기본값: 오늘) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>날짜 (기본값: 오늘)</span>
                  </label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                {/* 제목 (근무처명 / 사용처 / 적요) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-300">
                    {recordType === 'wage' ? '근무처명 / 업무명' : recordType === 'income' ? '수입 출처' : '지출 제목'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      recordType === 'wage'
                        ? '예: 강남 카페 주말 알바'
                        : recordType === 'income'
                        ? '예: 당근마켓 중고판매'
                        : '예: 점심 식사 (스타벅스)'
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* 카테고리 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-300">카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {(recordType === 'wage'
                      ? WAGE_CATEGORIES
                      : recordType === 'income'
                      ? INCOME_CATEGORIES
                      : EXPENSE_CATEGORIES
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. 근무/급여(Wage) 선택 시: 시급 & 시간 자동 계산기 */}
              {recordType === 'wage' && (
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-400" />
                      근무 시간 및 시급 설정
                    </span>
                    <span className="text-[11px] text-gray-400 font-normal">
                      시간 × 시급 + 수당 자동 계산
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400">근무 시간 (h)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={workHours}
                        onChange={(e) => setWorkHours(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white font-mono"
                        placeholder="5.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400">시급 (원)</label>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        value={hourlyWage}
                        onChange={(e) => setHourlyWage(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white font-mono"
                        placeholder="10030"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400">추가수당/주휴수당 (원)</label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={extraPay}
                        onChange={(e) => setExtraPay(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. 세금 공제 프리셋 선택 (3.3% vs 4대보험 vs 비과세) */}
              {recordType !== 'expense' && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      세금 및 공제 옵션 (원터치 프리셋)
                    </span>
                    <span className="text-[11px] text-gray-400 font-normal">
                      실수령액 자동 계산
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxType('3.3_freelance')}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                        taxType === '3.3_freelance'
                          ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 shadow'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="font-bold">3.3% 원천징수</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">프리랜서/용역/알바</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaxType('four_insurances')}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                        taxType === 'four_insurances'
                          ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 shadow'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="font-bold">4대보험 간이(9.4%)</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">국민+건보+고용 등</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaxType('none')}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                        taxType === 'none'
                          ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 shadow'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="font-bold">비과세 (0%)</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">세금 공제 없음</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaxType('custom')}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                        taxType === 'custom'
                          ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 shadow'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="font-bold">직접 입력</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">세율/세액 수기 지정</div>
                    </button>
                  </div>

                  {taxType === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] text-gray-400">세율 (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTaxRate}
                          onChange={(e) => setCustomTaxRate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400">공제 세액 직접 지정 (원)</label>
                        <input
                          type="number"
                          value={customTaxAmount}
                          onChange={(e) => setCustomTaxAmount(e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. 최종 금액 & 실시간 실수령액 미리보기 */}
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300">
                      {recordType === 'expense' ? '총 지출 금액 (원)' : '세전 총액 (원)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={grossAmount}
                      onChange={(e) => setGrossAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-xl text-sm font-bold font-mono text-white focus:outline-none focus:border-emerald-500 mt-1"
                      required
                    />
                  </div>

                  {recordType !== 'expense' && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400">공제 세금/보험료</label>
                        <div className="w-full px-3 py-2 bg-black/60 border border-gray-800 rounded-xl text-sm font-mono text-amber-400 mt-1">
                          -{calculatedAmounts.taxAmount.toLocaleString()}원 ({calculatedAmounts.taxRate}%)
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-emerald-400">실제 손에 쥐는 실질급여 (Net)</label>
                        <div className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-sm font-black font-mono text-emerald-300 mt-1">
                          {calculatedAmounts.netAmount.toLocaleString()}원
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 6. 지출 결제수단 및 비고 메모 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recordType === 'expense' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-300">결제 수단</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="card">💳 신용/체크카드</option>
                      <option value="transfer">🏦 계좌이체/페이</option>
                      <option value="cash">💵 현금</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                )}

                <div className={`space-y-1 ${recordType !== 'expense' ? 'sm:col-span-2' : ''}`}>
                  <label className="text-xs font-medium text-gray-300">메모 / 비고 (선택)</label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="특이사항, 주휴수당 포함 여부, 영수증 메모 등"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-medium transition"
                >
                  초기화
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? '저장 중...' : editingId ? '수정 완료' : '가계부에 저장'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================= TAB 4: 전체 내역 & CSV ======================= */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* 필터 및 검색 컨트롤 */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-950/60 p-3 rounded-2xl border border-gray-800">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  {(['ALL', 'wage', 'income', 'expense'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        filterType === t
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {t === 'ALL'
                        ? '전체'
                        : t === 'wage'
                        ? '💼 근무/급여'
                        : t === 'income'
                        ? '💰 기타수입'
                        : '💳 지출'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="제목, 카테고리, 메모 검색"
                      className="pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 w-44"
                    />
                  </div>

                  <button
                    onClick={exportToCSV}
                    className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-bold text-gray-200 transition flex items-center gap-1.5"
                    title="CSV 다운로드"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CSV 추출</span>
                  </button>
                </div>
              </div>

              {/* 내역 목록 테이블 */}
              {isLoading ? (
                <div className="text-center py-12 text-xs text-gray-500 font-mono">
                  데이터베이스 동기화 중...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500 bg-gray-950/40 rounded-2xl border border-gray-800/80">
                  조건에 맞는 기록이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-950 text-gray-400 font-mono text-[11px] border-b border-gray-800">
                      <tr>
                        <th className="p-3">날짜</th>
                        <th className="p-3">구분</th>
                        <th className="p-3">제목 / 카테고리</th>
                        <th className="p-3 text-right">세전금액</th>
                        <th className="p-3 text-right">공제세금</th>
                        <th className="p-3 text-right">실질수령 / 지출액</th>
                        <th className="p-3">메모 / 수단</th>
                        <th className="p-3 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 bg-gray-900/30">
                      {filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-850/50 transition">
                          <td className="p-3 font-mono text-gray-300">{r.record_date}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.record_type === 'wage'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : r.record_type === 'income'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {r.record_type === 'wage' ? '근무급여' : r.record_type === 'income' ? '기타수입' : '지출'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{r.title}</div>
                            <div className="text-[10px] text-gray-400">{r.category}</div>
                          </td>
                          <td className="p-3 text-right font-mono text-gray-300">
                            {r.gross_amount?.toLocaleString()}원
                          </td>
                          <td className="p-3 text-right font-mono text-amber-400">
                            {r.tax_amount > 0 ? `-${r.tax_amount.toLocaleString()}원` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            <span
                              className={
                                r.record_type === 'expense'
                                  ? 'text-rose-400'
                                  : 'text-emerald-300'
                              }
                            >
                              {r.record_type === 'expense' ? '-' : '+'}
                              {r.net_amount?.toLocaleString() || r.gross_amount?.toLocaleString()}원
                            </span>
                          </td>
                          <td className="p-3 text-gray-400 text-[11px]">
                            {r.memo || (r.payment_method ? `(${r.payment_method})` : '-')}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEdit(r)}
                                className="p-1 text-gray-400 hover:text-emerald-400 transition"
                                title="수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-1 text-gray-400 hover:text-rose-400 transition"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
