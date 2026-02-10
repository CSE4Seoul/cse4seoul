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

        