📅 2026-02-10
-하민
✅ 오늘 완료된 작업 (Today's Progress)

    Git Remote 설정 및 환경 동기화

        origin 저장소 연결 완료: https://github.com/CSE4Seoul/cse4seoul.git

        Codespaces 및 로컬 환경에서 개발 서버(npm run dev) 정상 구동 확인.

        현재 브랜치(main)와 원격 저장소 동기화 상태 유지.

    인프라 확장 준비

        Oracle Cloud Free Tier 가입 시도 및 결제 수단 검증(KB 트래블러스 체크카드 활용).

        서버 아키텍처 구상을 위한 MariaDB/Apache/PHP 환경 검토.

🚀 예정된 작업 (To-Do List)

    게시판(Board) 기능 구현

        Supabase를 활용한 Post 테이블 설계.

        Next.js 서버 컴포넌트를 이용한 게시글 리스트 렌더링.

    익명 채팅(Anonymous Chat) 기능

        Supabase Realtime 또는 Socket.io를 활용한 실시간 통신 구현.

        닉네임 랜덤 생성 로직 구축.

    회원 관리 시스템

        클랜원 인증 로직 및 NextAuth.js 연동 검토.

⚠️ 잠재적 취약점 및 개선 사항 (Security & Vulnerabilities)

    SQL Injection 및 권한 관리

        Supabase 활용 시 RLS(Row Level Security) 정책 설정 필수. 익명 채팅 시 타인의 메시지를 수정/삭제할 수 없도록 정책 검증 필요.

    입력값 검증 (XSS 방어)

        익명 게시판 및 채팅 특성상 사용자가 입력한 스크립트가 실행되지 않도록 데이터 새니타이징(Sanitizing) 처리 필요.

    인프라 가입 제한

        현재 Oracle Cloud 계정 생성 트랜잭션 오류 발생 중. 48시간 대기 후 IP 세탁(LTE 데이터 사용)을 통한 재시도 또는 AWS Educate로의 전환 플랜 B 고려.

## 📅 2026-02-11 (수) - 긴급 빌드 및 서버 액션 수정

### ✅ 해결된 기술 이슈
- **Next.js 15 Async Params 대응**
  - `PostDetailPage`에서 `params`를 비동기(`Promise`)로 처리하도록 수정하여 빌드 에러(`Uncached data was accessed outside of <Suspense>`) 해결.
- **Server Actions 구조 개선**
  - 게시판 작성 로직을 `app/actions.ts`로 분리하여 `Invalid Server Actions request` 에러 해결.
  - `@/` 경로 인식 오류를 상대 경로(`../actions`)로 수정하여 모듈 로딩 문제 해결.
- **Supabase 연동 버그 수정**
  - `utils` 내 오타(`wdadw`...) 제거 및 데이터 삽입(Insert) 로직 정상화.

### 🚀 다음 타격 목표
- **게시판 디자인 고도화**: Clash Royale 테마(파란색/금색 조합) 적용.
- **익명 채팅창 기능 설계**: Supabase Realtime 사용 여부 결정.

### ✅ 진행 상황
- **글쓰기 페이지(Write Page) 전면 개편**
  - '전략 본부 기밀 보고서' 컨셉의 다크 테마 UI 적용.
  - Lucide-react 아이콘 및 Tailwind 애니메이션을 활용한 하이엔드 UX 구현.
  - 익명 모드, 프리미엄 설정, 댓글 허용 등 세부 보안 옵션 기능 추가.
- **Client-Side 상태 관리**
  - `useState`를 활용한 제출 로딩 상태(isSubmitting) 처리 및 UX 피드백 강화.