import Link from 'next/link';
import { 
  MessageSquare, 
  FileText, 
  Shield, 
  AlertTriangle, 
  Trophy, 
  ChevronLeft, 
  ArrowRight,
  Mail,
  Code2
} from 'lucide-react';

export default function CommunityHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              COMMUNITY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-sky-300" />
            커뮤니티
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            게시판과 실시간 대화, 클랜 활동을 위한 공간을 둘러보세요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/developers"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-medium transition-colors w-fit"
          >
            <Code2 className="w-4 h-4" />
            <span>개발 구성원 소개</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-medium transition-colors w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/board"
          className="group rounded-xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-300 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>전술 기록 게시판</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-300 transition-colors" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              작전 회의록, 개발 아키텍처 토론 및 클랜 덱 전략을 영구 보존하고 공유합니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
            게시판 바로가기 →
          </div>
        </Link>

        <Link
          href="/chat"
          className="group rounded-xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-300 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>보안 전략 통신실</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-300 transition-colors" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              구성원 간 대화를 나누고 운영 관련 정보를 공유할 수 있는 공간입니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
            통신실 입장 →
          </div>
        </Link>

        <Link
          href="/community/lobby"
          className="group rounded-xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-300 mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>익명 로비 채팅실</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-300 transition-colors" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              누구나 텍스트 채팅과 그림 퀴즈를 이용할 수 있고, 로그인 회원은 이모티콘과 프로필 기능을 사용할 수 있습니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
            로비 채팅 입장 →
          </div>
        </Link>

        <Link
          href="/community/inquiries"
          className="group rounded-xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-300 mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>문의 센터</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-300 transition-colors" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              가입 신청, 클랜 대항전 제안, 운영진 문의를 접수하고 처리 상태를 확인합니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
            문의 작성 및 상태 확인 →
          </div>
        </Link>

        <Link
          href="/animal-farm"
          className="group rounded-xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-4">
              🐾
            </div>
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>조의ver 동물농장</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-300 transition-colors" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              나만의 동물 친구들과 함께하는 힐링 미니게임 공간. 탐험, 상점, 포인트 육성을 즐기세요.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
            동물농장 놀러가기 →
          </div>
        </Link>

        <Link
          href="/community/moments"
          className="group rounded-xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-300 mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>영광의 순간 갤러리</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-300 transition-colors" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              클랜 리그전 우승 및 전설 승급 순간의 하이라이트 스크린샷 아카이브입니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
            갤러리 감상하기 →
          </div>
        </Link>

        <Link
          href="/community/shame"
          className="group rounded-xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-300 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>비매너 박제소 (Hall of Shame)</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-300 transition-colors" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              잠수, 클랜전 불참, 트롤링 행위를 영구 박제하여 건전한 클랜 문화를 수호합니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
            블랙리스트 조회 →
          </div>
        </Link>
      </div>
    </div>
  );
}
