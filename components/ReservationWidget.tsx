'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCalendarCheckLine, 
  RiTimeLine, 
  RiCheckLine, 
  RiCloseLine,
  RiInformationLine,
  RiFlashlightLine,
  RiCheckDoubleLine
} from 'react-icons/ri';
import { Calendar, Clock, CheckCircle2, User, Sparkles, Send } from 'lucide-react';

interface ReservationWidgetProps {
  user?: any;
  profile?: any;
  lang?: 'ko' | 'en';
}

interface ReservationSlot {
  id: string;
  timeLabel: string;
  startTime: string; // e.g. "10:00"
  endTime: string;   // e.g. "11:00"
  isReserved: boolean;
  reservedBy?: string;
  purpose?: string;
}

// 10:00 to 19:00 (7:00 PM) at 1-hour intervals
const TIME_SLOTS_CONFIG = [
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '13:00' },
  { startTime: '13:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '17:00' },
  { startTime: '17:00', endTime: '18:00' },
  { startTime: '18:00', endTime: '19:00' },
];

const widgetI18n = {
  ko: {
    title: '📅 실시간 타임 스케줄 예약 시스템',
    subtitle: '10:00부터 19:00(7시)까지 1시간 단위 타임 슬롯예약',
    selectDate: '예약 일자 선택',
    today: '오늘',
    tomorrow: '내일',
    availableSlots: '예약 가능 시간대 (1시간 간격)',
    selectedSlot: '선택된 시간',
    reserverName: '예약자 닉네임',
    reserverPlaceholder: '성함 또는 닉네임 입력',
    purpose: '예약 목적 / 메모',
    purposePlaceholder: '사용 목적이나 전달사항을 적어주세요 (선택사항)',
    confirmBtn: '예약 신청 확정하기',
    cancelBtn: '선택 취소',
    reservedStatus: '예약 완료',
    availableStatus: '예약 가능',
    selectedStatus: '선택됨',
    successMsg: '예약이 성공적으로 완료 되었습니다! 🎉',
    cancelConfirm: '해당 예약을 취소하시겠습니까?',
    noSlotSelected: '원하시는 시간 슬롯을 선택해주세요.',
    enterName: '예약자 닉네임을 입력해 주세요.',
    notice: '💡 10:00 ~ 19:00 매시 정각 1시간 단위로 예약이 진행됩니다.'
  },
  en: {
    title: '📅 Real-Time Reservation Schedule',
    subtitle: 'Hourly time slots from 10:00 AM to 7:00 PM (19:00)',
    selectDate: 'Select Date',
    today: 'Today',
    tomorrow: 'Tomorrow',
    availableSlots: 'Available Time Slots (1-Hour Interval)',
    selectedSlot: 'Selected Time',
    reserverName: 'Reserver Nickname',
    reserverPlaceholder: 'Enter your name or nickname',
    purpose: 'Purpose / Note',
    purposePlaceholder: 'Optional note or purpose for reservation',
    confirmBtn: 'Confirm Reservation',
    cancelBtn: 'Clear Selection',
    reservedStatus: 'Reserved',
    availableStatus: 'Available',
    selectedStatus: 'Selected',
    successMsg: 'Reservation confirmed successfully! 🎉',
    cancelConfirm: 'Do you want to cancel this reservation?',
    noSlotSelected: 'Please select a time slot.',
    enterName: 'Please enter your name.',
    notice: '💡 Hourly slots from 10:00 AM to 7:00 PM.'
  }
};

export default function ReservationWidget({ user, profile, lang = 'ko' }: ReservationWidgetProps) {
  const t = widgetI18n[lang];
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [reserverName, setReserverName] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [reservations, setReservations] = useState<{ [key: string]: ReservationSlot[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Initialize profile name if user exists
  useEffect(() => {
    if (profile?.nickname) {
      setReserverName(profile.nickname);
    } else if (user?.email) {
      setReserverName(user.email.split('@')[0]);
    }
  }, [user, profile]);

  // Load reservations from localStorage or memory
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cse4seoul_reservations');
      if (saved) {
        setReservations(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load reservations:', e);
    }
  }, []);

  // Save reservations to localStorage
  const saveReservations = (updated: { [key: string]: ReservationSlot[] }) => {
    setReservations(updated);
    try {
      localStorage.setItem('cse4seoul_reservations', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save reservations:', e);
    }
  };

  // Get current date's slots
  const currentSlots: ReservationSlot[] = TIME_SLOTS_CONFIG.map((cfg, index) => {
    const id = `${selectedDate}_${cfg.startTime}`;
    const dateReservations = reservations[selectedDate] || [];
    const existing = dateReservations.find(r => r.startTime === cfg.startTime);
    return {
      id,
      timeLabel: `${cfg.startTime} - ${cfg.endTime}`,
      startTime: cfg.startTime,
      endTime: cfg.endTime,
      isReserved: !!existing?.isReserved,
      reservedBy: existing?.reservedBy,
      purpose: existing?.purpose
    };
  });

  const handleSlotClick = (slot: ReservationSlot) => {
    if (slot.isReserved) return;
    if (selectedSlotId === slot.id) {
      setSelectedSlotId(null);
    } else {
      setSelectedSlotId(slot.id);
    }
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      alert(t.noSlotSelected);
      return;
    }
    if (!reserverName.trim()) {
      alert(t.enterName);
      return;
    }

    setIsSubmitting(true);
    const targetSlot = currentSlots.find(s => s.id === selectedSlotId);
    if (!targetSlot) return;

    const newSlot: ReservationSlot = {
      ...targetSlot,
      isReserved: true,
      reservedBy: reserverName.trim(),
      purpose: purpose.trim()
    };

    const dateList = reservations[selectedDate] || [];
    const updatedDateList = [...dateList.filter(r => r.startTime !== targetSlot.startTime), newSlot];
    const updatedReservations = { ...reservations, [selectedDate]: updatedDateList };

    setTimeout(() => {
      saveReservations(updatedReservations);
      setSelectedSlotId(null);
      setPurpose('');
      setIsSubmitting(false);
      showToast(t.successMsg);
    }, 400);
  };

  const handleCancelReservation = (startTime: string) => {
    if (!confirm(t.cancelConfirm)) return;
    const dateList = reservations[selectedDate] || [];
    const updatedDateList = dateList.filter(r => r.startTime !== startTime);
    const updatedReservations = { ...reservations, [selectedDate]: updatedDateList };
    saveReservations(updatedReservations);
    showToast(lang === 'ko' ? '예약이 취소되었습니다.' : 'Reservation cancelled.');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Quick date pickers
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="relative w-full rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-neutral-900/90 via-black/95 to-neutral-950/90 p-6 md:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Gloss background light pulse */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <RiCalendarCheckLine />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-white tracking-wide">{t.title}</h3>
            <p className="text-xs text-cyan-400 font-mono tracking-wider font-semibold mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setSelectedDate(getTodayStr())}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              selectedDate === getTodayStr()
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.today}
          </button>
          <button
            onClick={() => setSelectedDate(getTomorrowStr())}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              selectedDate === getTomorrowStr()
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.tomorrow}
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-black/60 border border-white/15 rounded-xl px-3 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
          />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-cyan-300/80 bg-cyan-950/30 border border-cyan-500/20 p-2.5 rounded-xl">
        <RiInformationLine className="text-cyan-400 shrink-0 text-sm" />
        <span>{t.notice}</span>
      </div>

      {/* Main Grid: Slots Layout */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {t.availableSlots}
          </h4>
          <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-400" />
              {t.availableStatus}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              {t.selectedStatus}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50" />
              {t.reservedStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentSlots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            return (
              <motion.div
                key={slot.id}
                whileHover={!slot.isReserved ? { scale: 1.02 } : {}}
                whileTap={!slot.isReserved ? { scale: 0.98 } : {}}
                onClick={() => handleSlotClick(slot)}
                className={`relative rounded-2xl border p-4 transition-all duration-300 select-none ${
                  slot.isReserved
                    ? 'bg-red-950/15 border-red-500/25 text-neutral-500 cursor-not-allowed'
                    : isSelected
                    ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50 cursor-pointer'
                    : 'bg-white/[0.02] border-white/10 hover:border-cyan-500/40 text-white cursor-pointer hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${slot.isReserved ? 'text-red-400/60' : isSelected ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
                    <span className={`text-sm font-black tracking-wider ${isSelected ? 'text-cyan-200' : ''}`}>
                      {slot.timeLabel}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    slot.isReserved
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {slot.isReserved ? t.reservedStatus : isSelected ? t.selectedStatus : t.availableStatus}
                  </span>
                </div>

                {/* Details if reserved */}
                {slot.isReserved && (
                  <div className="mt-2.5 pt-2 border-t border-red-500/15 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <div className="flex items-center gap-1.5 truncate max-w-[75%]">
                      <User className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-red-300 font-semibold truncate">{slot.reservedBy}</span>
                      {slot.purpose && <span className="text-neutral-500 truncate">({slot.purpose})</span>}
                    </div>
                    {/* Admin or user allow cancel */}
                    {(profile?.role === 'admin' || slot.reservedBy === reserverName) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelReservation(slot.startTime);
                        }}
                        className="text-[9px] text-red-400 hover:text-red-300 underline font-bold"
                      >
                        취소
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Reservation Input Form when slot is selected */}
      <AnimatePresence>
        {selectedSlotId && (
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            onSubmit={handleConfirmReservation}
            className="mt-6 p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md flex flex-col gap-4 font-mono"
          >
            <div className="flex items-center justify-between text-xs text-cyan-300 font-bold pb-2 border-b border-cyan-500/20">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {t.selectedSlot}: {currentSlots.find(s => s.id === selectedSlotId)?.timeLabel} ({selectedDate})
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlotId(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 font-bold">
                  {t.reserverName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reserverName}
                  onChange={(e) => setReserverName(e.target.value)}
                  placeholder={t.reserverPlaceholder}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 font-bold">
                  {t.purpose}
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={t.purposePlaceholder}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSlotId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white text-xs font-bold transition-all"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {t.confirmBtn}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-cyan-950 border border-cyan-400 text-cyan-200 px-5 py-3 rounded-2xl shadow-2xl font-mono text-xs flex items-center gap-2 backdrop-blur-lg"
          >
            <RiCheckDoubleLine className="text-cyan-400 text-lg" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
