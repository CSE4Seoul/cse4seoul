# 메인 페이지 기능 개발: 최고관리자 공지사항 및 다국어 토글 기능

메인 페이지(`app/page.tsx`)에 공지사항을 연동하고, 최고관리자(`role === 'admin'`)가 웹 UI에서 직접 공지를 등록/수정/삭제/게시할 수 있는 제어 패널과 API를 구축합니다. 또한 메인 페이지의 핵심 텍스트 영역을 한/영 다국어 데이터로 변환하고, 이를 토글할 수 있는 스위치 위젯을 구현합니다.

## User Review Required

> [!IMPORTANT]
> - **공지사항 만료 제어**: 
>   - 공지 작성 시 **"상단 고정(Pinned)"**을 설정할 수 있습니다.
>   - 고정되지 않은 공지는 만료 기한(`expires_at`)이 적용되며, 설정하지 않을 시 **기본 24시간(1일)**로 자동 지정됩니다.
>   - 프론트엔드는 현재 시간 기준으로 `is_pinned = true` 이거나 `expires_at > NOW()` 상태인 유효한 공지사항들만 필터링하여 노출합니다.
> - **다국어 대상**: 로비 채팅 등 타 위젯을 제외한 메인 페이지 주요 소개 텍스트만 다국어 변환 대상으로 한정합니다.

## Proposed Changes

### Database Migration

#### [NEW] [008_create_notices_table.sql](file:///workspaces/cse4seoul/supabase/migrations/008_create_notices_table.sql)
- `notices` 테이블을 생성합니다.
  - `id`: uuid (기본키)
  - `content`: text (공지 내용)
  - `is_pinned`: boolean (고정 여부, 기본값: `false`)
  - `expires_at`: timestamptz (만료 일시, 기본값: `now() + interval '1 day'`)
  - `created_at`: timestamptz
  - `created_by`: uuid (profiles 테이블 외래키)
- RLS 활성화 및 권한 설정:
  - 누구나 읽을 수 있는 RLS 정책(`Allow public read notices`)을 정의합니다.
  - 최고관리자만 쓸 수 있는 RLS 정책(`Allow admin to manage notices` - `check_is_admin(auth.uid())` 활용)을 정의합니다.

---

### Backend API Route

#### [NEW] [route.ts](file:///workspaces/cse4seoul/app/api/notice/route.ts)
- `POST /api/notice`
  - 요청 바디: `{ content: string, is_pinned: boolean, expires_in_hours?: number }`
  - `expires_in_hours`가 넘어오면 해당 시간 후로 `expires_at`을 설정하고, 기본값은 `24`시간(1일)로 처리합니다.
  - 로그인한 세션 유저의 `role`이 `admin`인지 검증하여 위반 시 `403 Forbidden`을 반환합니다.
  - 성공 시 `notices` 테이블에 공지사항을 등록합니다.
- `DELETE /api/notice`
  - 요청 쿼리 또는 바디로 공지사항 ID를 전달받아 레코드를 삭제하거나 만료 처리합니다.
  - 동일하게 관리자 권한(`role === 'admin'`) 검증을 거칩니다.
- `GET /api/notice`
  - 고정되어 있거나 만료되지 않은 활성 상태의 공지사항 목록을 시간 역순으로 조회하여 반환합니다.

---

### Frontend Components & Pages

#### [MODIFY] [page.tsx](file:///workspaces/cse4seoul/app/page.tsx)
- **다국어 토글**:
  - `lang` 상태(`'ko' | 'en'`)에 따라 메인 타이틀, 히어로 설명글, 3가지 기능 카드 설명, 하단 보안 강조 문구, 모달 상세 내용을 번역 렌더링합니다. (로비 채팅/환율 위젯 등은 기존대로 유지)
  - 헤더 영역에 어울리는 현대적이고 반응성이 좋은 한/영 토글 스위치 버튼을 추가합니다.
- **공지사항 배너**:
  - 활성화된 공지가 존재할 경우 메인 화면 상단에 배너 형태로 띄웁니다.
  - 고정 공지(`is_pinned === true`)인 경우 "📌 고정 공지" 아이콘을 표기하고, 일반 한시 공지인 경우 만료 시점(예: "몇 시간 남음" 또는 "내일 만료")을 표시합니다.
- **최고관리자 공지 관리 패널 위젯**:
  - 로그인한 유저의 프로필 `role`이 `'admin'`인 경우 메인 화면 또는 프로필 하단에 별도의 미려한 공지 관리 위젯을 노출합니다.
  - 기능 구성:
    - 공지내용 인풋 필드
    - "상단 고정" 체크박스 (체크 해제 시 노출 기한 설정 활성화)
    - 노출 기한 선택기 (1시간, 6시간, 12시간, 24시간(기본), 3일 등)
    - 등록 버튼 및 현재 게재 중인 공지 목록 (삭제/해제 가능)
    - 삭제 버튼을 클릭하면 실시간으로 API를 호출하여 배너에서 즉각 사라지도록 처리합니다.

## Verification Plan

### Automated Tests
- 없음

### Manual Verification
- **공지사항 관리 위젯 검증**:
  - 최고관리자 계정으로 로그인 후 "공지 관리 위젯"을 통해 고정 공지 등록 -> 상단에 📌 핀 뱃지와 함께 공지가 뜨는지 확인.
  - 고정을 해제하고 1시간 만료 공지를 등록 -> 남은 시간 정보가 잘 표현되는지 및 DB에 `expires_at`이 알맞게 잡히는지 확인.
  - 게재 중인 공지 옆의 "삭제" 버튼을 클릭하여 즉각 노출이 해제되는지 테스트.
- **API 보안 검증**:
  - 비로그인 유저 또는 일반 유저 토큰으로 `POST/DELETE /api/notice` 요청 시 `403 Forbidden` 처리 및 차단 확인.
- **다국어 토글 검증**:
  - 메인 페이지의 주요 설명 텍스트 번역 상태 스위칭 검증.
