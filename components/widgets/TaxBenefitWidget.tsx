'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  DollarSign,
  PieChart,
  PlusCircle,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  FileText,
  Percent,
  Bus,
  Coins,
  ShieldCheck,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  Check,
  FileDown
} from 'lucide-react';

export interface TaxBenefitRecord {
  id: string;
  user_id?: string;
  record_type: 'tax' | 'benefit'; // 'tax' (세금) or 'benefit' (혜택/환급금)
  category: string;             // e.g. '배당소득세', 'K-패스 환급금', '근로소득세', etc.
  title: string;                // 적요/제목
  amount: number;               // 금액 (원)
  tax_rate?: number;            // 세율 (%) default 15.4 for dividend tax
  record_date: string;          // YYYY-MM-DD
  notes?: string;               // 비고
  created_at?: string;
  updated_at?: string;
}

interface TaxBenefitWidgetProps {
  userId: string;
}

// 기본 제공 카테고리 옵션
const TAX_CATEGORIES = [
  '배당소득세 (15.4%)',
  '근로소득세 / 종합소득세',
  '지방소득세',
  '양도소득세',
  '기타 세금'
];

const BENEFIT_CATEGORIES = [
  'K-패스 환급금 (대중교통)',
  '연말정산 / 세액공제 환급금',
  '청년수당 및 정부지원금',
  '건강보험 / 국민연금 환급금',
  '배당 실수령액',
  '기타 혜택 / 환급금'
];

export default function TaxBenefitWidget({ userId }: TaxBenefitWidgetProps) {
  const supabase = useMemo(() => createClient(), []);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [records, setRecords] = useState<TaxBenefitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 폼 입력 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<'tax' | 'benefit'>('tax');
  const [category, setCategory] = useState<string>('배당소득세 (15.4%)');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [taxRate, setTaxRate] = useState<string>('15.4');
  const [recordDate, setRecordDate] = useState<string>(getTodayString());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 배당소득세 계산기 모달 / 아코디언 상태
  const [showDivCalc, setShowDivCalc] = useState(false);
  const [divGrossAmount, setDivGrossAmount] = useState<string>('100000');
  const [divCustomRate, setDivCustomRate] = useState<string>('15.4');

  // 필터 상태
  const [filterType, setFilterType] = useState<'ALL' | 'tax' | 'benefit'>('ALL');

  // 1. Supabase & LocalStorage 데이터 가져오기
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_benefit_records')
        .select('*')
        .eq('user_id', userId)
        .order('record_date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, checking localStorage fallback:', error.message);
        const localData = localStorage.getItem(`tax_benefit_${userId}`);
        if (localData) setRecords(JSON.parse(localData));
      } else if (data) {
        setRecords(data);
        localStorage.setItem(`tax_benefit_${userId}`, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      const localData = localStorage.getItem(`tax_benefit_${userId}`);
      if (localData) setRecords(JSON.parse(localData));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 카테고리 변경 시 타입 자동 변경
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (TAX_CATEGORIES.includes(cat)) {
      setRecordType('tax');
      if (cat.includes('15.4')) setTaxRate('15.4');
    } else if (BENEFIT_CATEGORIES.includes(cat)) {
      setRecordType('benefit');
    }
  };

  // 등록 / 수정 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !recordDate) {
      alert('제목, 유효한 금액(0원 초과), 및 날짜를 올바르게 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      user_id: userId,
      record_type: recordType,
      category,
      title: title.trim(),
      amount: numAmount,
      tax_rate: taxRate ? parseFloat(taxRate) : 15.4,
      record_date: recordDate,
      notes: notes.trim(),
    };

    try {
      if (editingId) {
        // 수정
        const { error } = await supabase
          .from('tax_benefit_records')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase update failed, saving locally:', error.message);
          const updated = records.map((r) =>
            r.id === editingId ? { ...r, ...payload, updated_at: new Date().toISOString() } : r
          );
          setRecords(updated);
          localStorage.setItem(`tax_benefit_${userId}`, JSON.stringify(updated));
        } else {
          await fetchRecords();
        }
      } else {
        // 등록
        const { data, error } = await supabase
          .from('tax_benefit_records')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert failed, saving locally:', error.message);
          const newRecord: TaxBenefitRecord = {
            id: `local-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString(),
          };
          const updated = [newRecord, ...records];
          setRecords(updated);
          localStorage.setItem(`tax_benefit_${userId}`, JSON.stringify(updated));
        } else if (data) {
          await fetchRecords();
        }
      }

      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setRecordType('tax');
    setCategory('배당소득세 (15.4%)');
    setTitle('');
    setAmount('');
    setTaxRate('15.4');
    setRecordDate(getTodayString());
    setNotes('');
  };

  const startEdit = (item: TaxBenefitRecord) => {
    setEditingId(item.id);
    setRecordType(item.record_type);
    setCategory(item.category);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setTaxRate(item.tax_rate ? item.tax_rate.toString() : '15.4');
    setRecordDate(item.record_date);
    setNotes(item.notes || '');
    window.scrollTo({ top: 700, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 세금/혜택 기록을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('tax_benefit_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase delete failed, deleting locally:', error.message);
        const updated = records.filter((r) => r.id !== id);
        setRecords(updated);
        localStorage.setItem(`tax_benefit_${userId}`, JSON.stringify(updated));
      } else {
        await fetchRecords();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // 배당소득세 계산 결과 (기본 15.4%)
  const calculatedDividendTax = useMemo(() => {
    const gross = parseFloat(divGrossAmount.replace(/,/g, '')) || 0;
    const rate = parseFloat(divCustomRate) || 15.4;
    const tax = Math.round(gross * (rate / 100));
    const net = gross - tax;
    return { gross, rate, tax, net };
  }, [divGrossAmount, divCustomRate]);

  // 계산된 배당소득세를 내 기록에 직접 추가
  const addDividendTaxToRecords = () => {
    const { tax, gross } = calculatedDividendTax;
    if (tax <= 0) return alert('유효한 배당금 총액을 입력해 주세요.');

    setRecordType('tax');
    setCategory('배당소득세 (15.4%)');
    setTitle(`배당소득세 (총배당금 ${gross.toLocaleString()}원)`);
    setAmount(tax.toString());
    setTaxRate(divCustomRate);
    setRecordDate(getTodayString());
    setNotes(`원천징수 배당소득세 ${divCustomRate}% 자동 계산 추가`);
    setShowDivCalc(false);
  };

  // 총계 통계 산출
  const totals = useMemo(() => {
    let totalTax = 0;
    let totalBenefit = 0;

    records.forEach((r) => {
      if (r.record_type === 'tax') totalTax += Number(r.amount);
      else if (r.record_type === 'benefit') totalBenefit += Number(r.amount);
    });

    const netBalance = totalBenefit - totalTax; // 순 혜택/환급
    const totalSum = totalTax + totalBenefit;
    const taxPercentage = totalSum > 0 ? (totalTax / totalSum) * 100 : 0;
    const benefitPercentage = totalSum > 0 ? (totalBenefit / totalSum) * 100 : 0;
    const benefitRatio = totalTax > 0 ? (totalBenefit / totalTax) * 100 : 0;

    return { totalTax, totalBenefit, netBalance, taxPercentage, benefitPercentage, benefitRatio };
  }, [records]);

  // 필터링된 기록 리스트
  const filteredRecords = useMemo(() => {
    if (filterType === 'ALL') return records;
    return records.filter((r) => r.record_type === filterType);
  }, [records, filterType]);

  // txt 요약 보고서 내보내기
  const exportStatementTxt = () => {
    if (records.length === 0) {
      alert('내보낼 세금/혜택 기록이 없습니다.');
      return;
    }

    let txt = `=========================================\n`;
    txt += `  CSE4SEOUL 세금 납부 vs 혜택/환급 비교 보고서\n`;
    txt += `  생성 일시: ${new Date().toLocaleString('ko-KR')}\n`;
    txt += `=========================================\n\n`;
    txt += `[종합 요약]\n`;
    txt += `• 총 납부 세금: ${totals.totalTax.toLocaleString()} 원\n`;
    txt += `• 총 혜택/환급금: ${totals.totalBenefit.toLocaleString()} 원\n`;
    txt += `• 순 손익 Balance: ${totals.netBalance >= 0 ? '+' : ''}${totals.netBalance.toLocaleString()} 원\n`;
    txt += `• 세금 대비 혜택 수령 비율: ${totals.benefitRatio.toFixed(1)}%\n\n`;
    txt += `-----------------------------------------\n`;
    txt += `[상세 기록 목록 (${records.length}건)]\n`;
    txt += `-----------------------------------------\n`;

    records.forEach((r, idx) => {
      const typeLabel = r.record_type === 'tax' ? '[세금 납부]' : '[혜택/환급]';
      txt += `${idx + 1}. ${typeLabel} [${r.record_date}] ${r.title}\n`;
      txt += `   - 카테고리: ${r.category}\n`;
      txt += `   - 금액: ${r.amount.toLocaleString()} 원 ${r.tax_rate ? `(세율 ${r.tax_rate}%)` : ''}\n`;
      if (r.notes) txt += `   - 비고: ${r.notes}\n`;
      txt += `\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `세금_혜택_비교_리포트_${getTodayString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative flex flex-col bg-gray-950 border border-emerald-900/50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-emerald-500/50 my-8">
      {/* 💚 상단 타이틀 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-950/90 via-gray-900/90 to-gray-950 border-b border-emerald-900/50 backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-600/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
            <Calculator size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                세금 납부 vs 혜택/환급금 비교 스마트 트래커
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-900/70 text-emerald-300 border border-emerald-700">
                TAX &amp; BENEFIT TRACKER
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              배당소득세(기본 15.4%), K-패스 환급금 등 내가 낸 세금과 받은 혜택을 등록/관리하고 세부 비교해 보세요.
            </p>
          </div>
        </div>

        {/* 상단 툴바: 배당소득세 계산기 모달 토글 & 보고서 다운로드 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowDivCalc(!showDivCalc)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/80 hover:bg-emerald-900 transition-all shadow-md"
          >
            <Percent size={14} />
            <span>배당소득세(15.4%) 자동 계산기</span>
          </button>
          <button
            onClick={exportStatementTxt}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all"
            title="텍스트 파일로 내보내기"
          >
            <FileDown size={14} />
            <span>보고서 .txt 추출</span>
          </button>
        </div>
      </div>

      {/* 🧮 배당소득세 (15.4%) Quick Calculator 펼침 뷰 */}
      {showDivCalc && (
        <div className="p-6 bg-gradient-to-b from-emerald-950/40 to-gray-900/90 border-b border-emerald-900/50 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-400">
              <Coins size={18} />
              <span>배당소득세 (원천징수 15.4%) 실시간 원터치 계산기</span>
            </div>
            <span className="text-[11px] text-emerald-300/80 font-mono">
              ※ 배당소득세율: 소득세 14% + 지방소득세 1.4% = 총 15.4%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold">배당금 총액 (Gross Dividend)</label>
              <input
                type="number"
                value={divGrossAmount}
                onChange={(e) => setDivGrossAmount(e.target.value)}
                placeholder="예: 100000"
                className="w-full bg-gray-900 border border-emerald-800/80 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold">적용 세율 (%)</label>
              <input
                type="number"
                step="0.1"
                value={divCustomRate}
                onChange={(e) => setDivCustomRate(e.target.value)}
                className="w-full bg-gray-900 border border-emerald-800/80 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addDividendTaxToRecords}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                <PlusCircle size={14} />
                <span>세금 기록 양식에 자동 입력</span>
              </button>
            </div>
          </div>

          {/* 계산 결과 칩 */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-black/60 border border-emerald-900/60 font-mono text-xs">
            <div>
              <span className="text-gray-500 block">배당 총액</span>
              <span className="text-white font-bold text-sm">{calculatedDividendTax.gross.toLocaleString()} 원</span>
            </div>
            <div>
              <span className="text-rose-400 block">원천징수 세금 (15.4%)</span>
              <span className="text-rose-400 font-bold text-sm">-{calculatedDividendTax.tax.toLocaleString()} 원</span>
            </div>
            <div>
              <span className="text-emerald-400 block">계좌 실수령액</span>
              <span className="text-emerald-400 font-bold text-sm">+{calculatedDividendTax.net.toLocaleString()} 원</span>
            </div>
          </div>
        </div>
      )}

      {/* 📊 SUMMARY COMPARISON DASHBOARD CARDS */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. 총 세금 납부액 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 to-gray-900 border border-rose-900/50 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
              <span>💸 총 납부 세금</span>
              <TrendingDown size={16} />
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {totals.totalTax.toLocaleString()} <span className="text-sm font-normal text-gray-400">원</span>
            </div>
            <p className="text-[11px] text-gray-400">배당소득세, 근로소득세 등 납부 세금</p>
          </div>

          {/* 2. 총 혜택 & 환급금 수령액 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-gray-900 border border-emerald-900/50 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
              <span>🎁 총 혜택 &amp; 환급금 수령</span>
              <TrendingUp size={16} />
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {totals.totalBenefit.toLocaleString()} <span className="text-sm font-normal text-gray-400">원</span>
            </div>
            <p className="text-[11px] text-gray-400">K-패스, 연말정산, 정부 수당 등</p>
          </div>

          {/* 3. 순 손익 Balance (혜택 - 세금) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-gray-900 border border-cyan-900/50 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-bold">
              <span>⚖️ 순 혜택 Balance</span>
              <ArrowRightLeft size={16} />
            </div>
            <div className={`text-2xl font-black tabular-nums ${totals.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totals.netBalance >= 0 ? '+' : ''}{totals.netBalance.toLocaleString()} <span className="text-sm font-normal text-gray-400">원</span>
            </div>
            <p className="text-[11px] text-gray-400">
              {totals.netBalance >= 0 ? '낸 세금보다 혜택이 더 큽니다!' : '혜택 대비 낸 세금이 더 많습니다.'}
            </p>
          </div>

          {/* 4. 세금 대비 혜택 회수율 (%) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-gray-900 border border-purple-900/50 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-purple-400 text-xs font-bold">
              <span>📈 혜택 환급 회수율</span>
              <PieChart size={16} />
            </div>
            <div className="text-2xl font-black text-purple-300 tabular-nums">
              {totals.benefitRatio.toFixed(1)} <span className="text-sm font-normal text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400">납부 세금 100원당 환급 혜택 비율</p>
          </div>
        </div>

        {/* 🟢/🔴 VISUAL RATIO COMPARISON BAR */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-rose-400 flex items-center gap-1">
              • 세금 납부 비율 ({totals.taxPercentage.toFixed(1)}%)
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              혜택 수령 비율 ({totals.benefitPercentage.toFixed(1)}%) •
            </span>
          </div>

          {/* 프로그래스 바 */}
          <div className="w-full h-4 bg-gray-950 rounded-full overflow-hidden flex border border-gray-800">
            <div
              style={{ width: `${totals.taxPercentage}%` }}
              className="bg-gradient-to-r from-rose-600 to-red-500 h-full transition-all duration-500"
              title={`세금: ${totals.totalTax.toLocaleString()}원`}
            />
            <div
              style={{ width: `${totals.benefitPercentage}%` }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
              title={`혜택: ${totals.totalBenefit.toLocaleString()}원`}
            />
          </div>
        </div>

        {/* ✍️ REGISTER / EDIT FORM */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-950 border border-gray-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-400">
              <PlusCircle size={16} />
              <span>{editingId ? '✏️ 세금/혜택 내역 수정하기' : '➕ 새로운 세금 또는 혜택/환급 내역 기재하기'}</span>
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
            {/* 구분 라디오 (세금 납부 vs 혜택/환급 수령) */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-gray-400">구분 선택:</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRecordType('tax');
                    setCategory('배당소득세 (15.4%)');
                    setTaxRate('15.4');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordType === 'tax'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  💸 세금 납부 (Tax)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecordType('benefit');
                    setCategory('K-패스 환급금 (대중교통)');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordType === 'benefit'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  🎁 혜택 / 환급금 수령 (Benefit)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 카테고리 선택 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <optgroup label="💸 세금 항목">
                    {TAX_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🎁 혜택 및 환급 항목">
                    {BENEFIT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 내역 제목/적요 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">내역 제목 (적요)</label>
                <input
                  type="text"
                  placeholder="예: 8월 삼성전자 배당소득세, 7월 K-패스 대중교통 환급..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* 금액 (원) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">금액 (원)</label>
                <input
                  type="number"
                  placeholder="예: 15400"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 발생 일자 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <Calendar size={13} className="text-emerald-400" />
                  발생/지출 일자
                </label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* 세율 (세금일 경우) */}
              {recordType === 'tax' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <Percent size={13} className="text-rose-400" />
                    세율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* 추가 비고/메모 */}
              <div className={`${recordType === 'tax' ? '' : 'sm:col-span-2'} space-y-1.5`}>
                <label className="text-xs font-bold text-gray-400">추가 메모 / 비고</label>
                <input
                  type="text"
                  placeholder="특이사항 메모..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{isSubmitting ? '저장 중...' : editingId ? '수정 완료' : '내역 저장하기'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 📋 RECORDS LIST VIEW & FILTER */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" />
              <span>기재된 세금 및 혜택 내역 목록 ({filteredRecords.length}건)</span>
            </h3>

            {/* 세금 / 혜택 타입 필터 */}
            <div className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'ALL' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterType('tax')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'tax' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                💸 세금만 보기
              </button>
              <button
                onClick={() => setFilterType('benefit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'benefit' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                🎁 혜택만 보기
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-gray-500 font-mono text-xs animate-pulse">
              세금 및 혜택 데이터를 불러오는 중입니다...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-gray-900/40 border border-dashed border-gray-800 text-gray-500 space-y-2">
              <Calculator size={32} className="mx-auto opacity-30 text-emerald-400" />
              <p className="text-sm font-bold text-gray-400">등록된 세금 또는 혜택/환급 기록이 없습니다.</p>
              <p className="text-xs">상단 입력창에서 배당소득세, K-패스 환급금 등을 등록해 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredRecords.map((item) => {
                const isTax = item.record_type === 'tax';
                return (
                  <div
                    key={item.id}
                    className={`group p-4 rounded-2xl bg-gray-900/60 border ${
                      isTax ? 'border-rose-900/40 hover:border-rose-500/50' : 'border-emerald-900/40 hover:border-emerald-500/50'
                    } transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono shrink-0 ${
                          isTax ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isTax ? '💸 세금' : '🎁 혜택'}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>
                          <span className="text-[11px] text-gray-500 font-mono">[{item.category}]</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          일자: {item.record_date} {item.tax_rate ? `| 적용세율: ${item.tax_rate}%` : ''} {item.notes ? `| 비고: ${item.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className={`text-base font-black font-mono tabular-nums ${isTax ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isTax ? '-' : '+'}{Number(item.amount).toLocaleString()} 원
                      </span>

                      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-emerald-900/60 text-gray-400 hover:text-emerald-300 transition-colors"
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
