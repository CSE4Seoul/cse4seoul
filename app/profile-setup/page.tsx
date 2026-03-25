'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Fingerprint, ShieldCheck, ArrowLeft, GraduationCap, Briefcase, Gamepad2, Mail, ChevronDown } from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  // 상태 관리
  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    role: '',
    clash_royale_tag: '',
  });
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null); // 현재 로그인한 사용자의 역할

  // 프로필 정보 + 현재 사용자 역할 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            university: profile.university || '',
            role: profile.role || '',
            clash_royale_tag: profile.clash_royale_tag || '',
          });
          setCurrentUserRole(profile.role || null);
        } else if (error && error.code !== 'PGRST116') {
          console.error('프로필 불러오기 실패:', error);
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  // 일반 input 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // role select 핸들러
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, role: e.target.value });
  };

  // 저장 로직
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      return alert('코드네임(이름)은 필수 입력 사항입니다!');
    }

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('보안 인가가 필요합니다.');

      // 업데이트할 데이터 구성
      const updateData: any = {
        id: user.id,
        email: user.email,
        full_name: formData.full_name.trim(),
        university: formData.university.trim(),
        clash_royale_tag: formData.clash_royale_tag.trim(),
        updated_at: new Date().toISOString(),
      };

      // 관리자만 role 업데이트 가능
      if (currentUserRole === 'admin') {
        updateData.role = formData.role.trim();
      } else {
        // 일반 사용자는 role 변경 불가 → 기존 role 유지
        // 이미 currentUserRole에 저장되어 있으므로, DB에서 가져온 값을 그대로 사용
        // 만약 현재 formData.role이 바뀌었더라도 무시됨
      }

      const { error } = await supabase.from('profiles').upsert(updateData);

      if (error) throw error;

      alert('신원 정보가 성공적으로 갱신되었습니다! 🎯');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('프로필 등록 실패:', error);
      alert('데이터 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        데이터 동기화 중...
      </div>
    );
  }

  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      <div className="z-10 bg-gray-900/80 p-8 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-md max-w-md w-full">
        {/* 상단 헤더 & 뒤로 가기 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center border border-emerald-500/30">
            <Fingerprint className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="w-9" />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          요원 상세 프로필 설정
        </h1>
        <p className="text-xs text-gray-400 mb-8 text-center">전략 통신망 시스템에 등록될 정보를 갱신합니다.</p>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Email (읽기 전용) */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={email}
              disabled
              className="w-full bg-black/30 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Full Name (필수) */}
          <div className="relative">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="코드네임 / 이름 (필수)"
              className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Role – 관리자만 드롭다운으로 표시, 일반 사용자는 숨김 */}
          {isAdmin ? (
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-10 text-white focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="admin">최고 관리자</option>
                <option value="sub_admin">부 관리자</option>
                <option value="clan_member">클랜원</option>
                <option value="outsider">외부인</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            // 일반 사용자에게는 role 입력 필드를 아예 보여주지 않음 (권한 없음)
            null
          )}

          {/* University */}
          <div className="relative">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="소속 대학 (예: Konkuk University)"
              className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Clash Royale Tag */}
          <div className="relative">
            <Gamepad2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="clash_royale_tag"
              value={formData.clash_royale_tag}
              onChange={handleChange}
              placeholder="Clash Royale Tag (선택)"
              className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating || !formData.full_name.trim()}
            className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              '동기화 중...'
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" /> 프로필 업데이트
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}