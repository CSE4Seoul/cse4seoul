'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  RiCloseLine, RiUser3Line, RiShieldUserLine, RiMessage3Line, 
  RiEditBoxLine, RiSave3Line, RiLoader4Line, RiDeleteBin6Line 
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null; // 대상 유저 ID (null이면 본인 마이페이지)
  currentUserId: string | null;
  onOpenDM?: (targetUser: { id: string; name: string; avatar_url?: string }) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  userId,
  currentUserId,
  onOpenDM,
}: UserProfileModalProps) {
  const [supabase] = useState(() => createClient());
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const targetId = userId || currentUserId;
  const isSelf = targetId === currentUserId;

  const fetchProfile = async () => {
    if (!targetId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('프로필 로드 오류:', error);
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      } else {
        setProfile({
          id: targetId,
          full_name: '요원',
          role: 'user',
        });
        setFullName('요원');
      }
    } catch (err) {
      console.error('프로필 가져오기 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetId) {
      fetchProfile();
      setIsEditing(false);
    }
  }, [isOpen, targetId]);

  const handleSave = async () => {
    if (!currentUserId || !isSelf) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: currentUserId,
        full_name: fullName.trim(),
        username: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert('프로필이 성공적으로 저장되었습니다!');
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      console.error('프로필 저장 에러:', err);
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden text-white"
        >
          {/* Header */}
          <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <RiUser3Line className="text-lg" />
              <span>{isSelf ? '👤 마이페이지 (내 프로필)' : '🎯 요원 프로필'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            >
              <RiCloseLine className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col items-center gap-5">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center gap-2 text-gray-500 text-xs">
                <RiLoader4Line className="text-2xl animate-spin text-cyan-500" />
                <span>프로필 정보를 불러오는 중...</span>
              </div>
            ) : (
              <>
                {/* Avatar */}
                <div className="relative group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full border-2 border-cyan-500/50 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-2 border-cyan-400/30 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                      {fullName ? fullName[0] : '?'}
                    </div>
                  )}

                  {profile?.role === 'admin' && (
                    <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-lg border border-rose-400">
                      ADMIN
                    </span>
                  )}
                </div>

                {/* Information or Edit Form */}
                {!isEditing ? (
                  <div className="w-full flex flex-col items-center text-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-wide">
                      {profile?.full_name || profile?.username || '익명의 요원'}
                    </h2>
                    
                    {profile?.bio ? (
                      <p className="text-xs text-gray-300 bg-black/40 px-4 py-2 rounded-xl border border-white/5 max-w-full">
                        "{profile.bio}"
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 font-light italic">
                        소개글이 등록되지 않았습니다.
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                      <span className="bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
                        ID: {targetId?.slice(0, 13)}...
                      </span>
                      <span className="bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-800">
                        ROLE: {profile?.role || 'user'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">닉네임 / 코드네임</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        placeholder="이름 또는 닉네임을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">자기소개</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 h-20 resize-none"
                        placeholder="간단한 자기소개를 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">프로필 이미지 URL</label>
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="w-full pt-2 flex flex-col gap-2">
                  {isSelf ? (
                    !isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <RiEditBoxLine className="text-base" />
                        <span>프로필 편집하기</span>
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          {isSaving ? <RiLoader4Line className="animate-spin" /> : <RiSave3Line />}
                          <span>저장 완료</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
                        >
                          취소
                        </button>
                      </div>
                    )
                  ) : (
                    currentUserId && (
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenDM) {
                            onOpenDM({
                              id: targetId!,
                              name: profile?.full_name || profile?.username || '요원',
                              avatar_url: profile?.avatar_url,
                            });
                          }
                        }}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                      >
                        <RiMessage3Line className="text-base" />
                        <span>1:1 개인 암호화 메시지 보내기</span>
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
