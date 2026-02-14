📅 작업 타임라인
🗓️ 2026-02-10 (화)

- Supabase에서 이메일 인증을 활성화하려면
프로젝트 대시보드의 Authentication > Providers > Email에서 'Enable Sign-in with Email'을 키거나 끄면 됨
✅ 완료된 작업

    Git 환경 설정

        원격 저장소(origin) 연결: https://github.com/CSE4Seoul/cse4seoul.git

        Codespaces 및 로컬 개발 서버 정상 구동 확인

        main 브랜치 동기화 유지

    인프라 준비

        Oracle Cloud Free Tier 가입 시도 (KB 트래블러스 체크카드 사용)

        MariaDB/Apache/PHP 환경 검토 및 아키텍처 설계

🚀 예정 작업

    게시판 기능

        Supabase Post 테이블 설계

        Next.js 서버 컴포넌트로 게시글 리스트 렌더링

    익명 채팅

        Supabase Realtime 또는 Socket.io 연동

        랜덤 닉네임 생성 시스템

    회원 관리

        클랜원 인증 로직 구축

        NextAuth.js 연동 검토

⚠️ 보안 이슈

    SQL Injection 방지: Supabase RLS(Row Level Security) 정책 설정 필요

    XSS 방어: 사용자 입력값 Sanitizing 처리 필수

    인프라 문제: Oracle Cloud 계정 생성 오류 발생 → 48시간 후 재시도 또는 AWS Educate 전환 고려

🗓️ 2026-02-11 (수) - 긴급 빌드 및 기능 확장
🔧 해결된 기술 이슈

    Next.js 15 호환성

        PostDetailPage의 비동기 params 처리로 빌드 에러 해결

        Uncached data was accessed outside of <Suspense> 오류 수정

    Server Actions 구조

        app/actions.ts로 게시판 작성 로직 분리

        Invalid Server Actions request 에러 해결

        모듈 경로 오류 수정 (@/ → ../actions)

    Supabase 연동

        utils 내 오타 제거 및 데이터 삽입 로직 정상화

🎨 UI/UX 개선

    글쓰기 페이지 전면 개편

        '전략 본부 기밀 보고서' 컨셉의 다크 테마 적용

        Lucide-react 아이콘 + Tailwind 애니메이션 구현

        추가 기능: 익명 모드, 프리미엄 설정, 댓글 허용 옵션

    클라이언트 상태 관리

        useState로 제출 로딩 상태(isSubmitting) 관리

        사용자 피드백 강화

📊 시스템 기능 완성

    상세 조회 시스템

        동적 라우팅(/board/[id]) 구현 완료

        notFound()로 존재하지 않는 게시글 404 처리

    댓글 생태계

        comments 테이블 설계 (게시글-유저 1:N 관계)

        실시간 유사 댓글 시스템 (RevalidatePath 활용)

        익명/실명 댓글 모드 지원

    시스템 안정화

        대시보드에 '전략 게시판' 바로가기 배치

        웹 접근성 개선: type="button" 명시

        next.config.js 보안 설정으로 Server Action Origin 오류 방지

🚀 향후 개발 계획
📡 1. 실시간 익명 채팅 (우선순위: 높음)
데이터베이스

    messages 테이블 생성 및 RLS 보안 정책 설정

    Supabase Realtime Publication 활성화

사용자 인터페이스

    카카오톡/디스코드 스타일 채팅 UI 구현

    위치: app/(main)/chat/page.tsx

로직 구현

    supabase.channel().on()으로 실시간 메시지 구독

    새로고침 없이 실시간 메시지 표시

UX 개선

    새 메시지 도착 시 자동 스크롤(scrollRef 활용)

🛠️ 2. 게시판 기능 고도화
CRUD 확장

    본인 글/댓글만 수정/삭제 가능한 권한 시스템

    useTransition으로 삭제 시 UI 멈춤 현상 방지

멀티미디어 지원

    Supabase Storage 버킷 생성

    글쓰기 에디터에 이미지 첨부 기능 추가

성능 최적화

    페이지네이션 구현 (더 보기 버튼 또는 페이지 번호)

    100개 이상 게시글 로딩 속도 개선

🎨 3. 디자인 개선

    Clash Royale 테마 색상(파란색/금색) 일관성 적용

    게시판 디자인 고도화

📊 현재 상태 요약

    프로젝트 단계: 개발 중기 (핵심 기능 구현 완료, 고도화 진행 중)

    기술 스택: Next.js 15, TypeScript, Supabase, Tailwind CSS

    주요 완료 기능: 게시판 CRUD, 댓글 시스템, 동적 라우팅

    다음 마일스톤: 실시간 채팅 기능 구현

    인프라: Oracle Cloud/AWS Educate 검토 중

🔗 관련 파일 구조 (요약)
text

app/
├── actions.ts              # Server Actions
├── (main)/
│   ├── board/
│   │   ├── [id]/          # 동적 게시글 상세
│   │   └── write/         # 글쓰기 페이지
│   └── chat/              # 예정: 채팅 페이지
└── utils/                 # Supabase 유틸리티

이 문서는 2026년 2월 11일 기준 최신 상태를 반영합니다.

🗓️ 2026-02-12 (목)

어제 기준으로 정리되지 않은 내용들과 추가가 필요한 기능들은

채팅방과 게시판의 메세지 처리 보안 관련 로직 강화 (처리 완료)

게시판과 채팅방에서 dashboard로 넘어갈 수 있는 로직을 추가

app/auth/ 위치에 있는 forgot-password, update-password에 대한 로직 추가 필요

삭제 등의 버튼에서 생각보다 지연이 일어나는 것으로 보임. 이에 따라 지연 시 로딩 화면등을 처리하는 로직을 추가할 예정임

채팅이 24시간 내에 실제로 삭제되는지 확인해볼것 (처리 완료)

SQL 명령어

create extension if not exists pg_cron;

-- 2. 24시간 지난 메시지를 매분마다 체크해서 삭제하는 작업 등록
-- 작업 이름: 'delete-old-messages'
-- 스케줄: '0 * * * *' (매 시간 0분마다 실행)
select cron.schedule(
  'delete-old-messages',
  '0 * * * *',
  $$ delete from public.messages where created_at < now() - interval '24 hours' $$
);

/workspaces/cse4seoul/IMPLEMENTATION_GUIDE.md 파일에 암호화와 관련된 지침을 적어놓음


🗓️ 2026-02-13 (금)
테스터들을 통해 채팅 등의 실시간 상호 작용을 점검하였고, 암호화 등도 문제 없었음을 확인함.

🗓️ 2026-02-13 (토)
이미 언급된 개발 사항 외에 추가로 필요해보이는 기능들을 나열
- 프로필 정보 수정 기능(Board의 page.tsx에서 프로필을 직접 수정할 수 있는 버튼이나 추가 페이지 등을 개발하는 방식으로 진행)
- 오라클 서버를 구현하기 위해 이메일을 보냈으나 아직 회신이 없으므로 다음 주에 점검 후 그때에도 연락이 안오면 직접 재 회원가입 진행 시도 예정(회원가입 완료됨, 계정 생성 완료)
- 기존의 사용하던 복호화 키는 NEXT_public으로 설정되어 개발자 모드에서 키가 유출되는 문제가 있었음. 따라서 이를 암호화를 진행하는 로직의 기본 공개키로 전환하여 공개 모드(공개 채팅방)로 사용하고, 채팅방을 들어갈 때 선택한 암호키를 입력하게 해 그 입력키를 암호화키로 사용할 수 있도록 전면 로직을 수정함. 또한, 암호 키가 불일치하는 채팅들은 복호화 실패 문구가 아닌 null을 반환하도록 하여 아예 뜨지 않도록 처리함. 
## 🚀 v1.2 업데이트: 하이브리드 E2E 다중 통신망 구축 (2026-02-14)

### ✨ 주요 변경 사항
* **논리적 채널 분리 아키텍처 적용**
  * 단일 데이터베이스(Supabase) 테이블 구조를 유지하면서, AES-256-GCM 암호화 키의 일치 여부를 활용하여 '공개 통신망'과 '비밀 통신망'을 완벽하게 격리했습니다.
  * 복호화 함수의 예외 처리 로직(`null` 반환)을 UI 렌더링 필터와 결합하여, 서버의 추가 연산 없이 클라이언트 단에서 독립된 채팅방 경험을 제공합니다.

* **접속 보안 모달 및 하이브리드 모드 도입**
  * **공개 채팅 모드:** 아무 키도 입력하지 않을 시 기본 환경변수 키(`DEFAULT_KEY`)를 사용하여 누구나 소통할 수 있는 광장 역할을 합니다.
  * **비밀 통신망 모드:** 사용자 간 사전 합의된 작전 암호를 입력하면, 해당 키를 가진 요원들끼리만 복호화가 가능한 완벽한 E2EE 채널이 생성됩니다. 다른 주파수(키)의 메시지는 화면에 노출되지 않습니다.

### 🛡️ 보안 및 성능 최적화
* 컴포넌트 구조 분리(`SystemStatus`)를 통해 무한 리렌더링 문제를 해결하고, 실시간 트래픽 환경에서 하이드레이션 경고를 방지하여 성능을 대폭 개선했습니다.