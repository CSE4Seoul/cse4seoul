'use client'; // 🚨 (필수) onClick이나 alert를 쓰려면 맨 위에 꼭 넣어야 합니다!

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ProfilePage() {
  // 1. 유저가 입력할 닉네임과 상태를 관리할 변수들
  const [username, setUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 2. 아까 제가 짜드렸던 그 핵심 함수! (컴포넌트 안에 쏙 넣습니다)
  const updateProfile = async () => {
    if (!username.trim()) return alert('닉네임을 입력해주세요!');
    
    setIsUpdating(true);
    const supabase = createClient();

    try {
      // 내 로그인 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // DB에 프로필 정보 넣기 (아까 설정한 RLS가 여기서 작동합니다!)
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, // (RLS 통과 조건!)
        username: username,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert("요원 프로필이 성공적으로 등록되었습니다! 🎯");
      
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">요원 프로필 설정</h1>
      
      <div className="flex flex-col gap-4 max-w-sm">
        {/* 닉네임 입력칸 */}
        <input 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="사용할 코드네임을 입력하세요" 
          className="p-3 rounded bg-gray-800 text-white border border-gray-700"
        />
        
        {/* 저장 버튼 누르면 updateProfile 함수 실행! */}
        <button 
          onClick={updateProfile} 
          disabled={isUpdating}
          className="bg-blue-600 p-3 rounded font-bold hover:bg-blue-500 disabled:bg-gray-600"
        >
          {isUpdating ? '등록 중...' : '프로필 저장하기'}
        </button>
      </div>
    </div>
  );
}