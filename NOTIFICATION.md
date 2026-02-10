# 📢 CSE4Seoul Project Notification

> **Status:** 🚀 Launch (v1.0)
> **Last Updated:** 2026.02.08

## 1. 프로젝트 비전 (Vision)
**"Game, Code, and Evolve."**
CSE4Seoul은 건국대, 동국대, 경희대, 가천대, 성균관대 등 서울권 대학 연합이 만드는 **Clash Royale 기반 개발자 커뮤니티**입니다.
우리는 단순히 게임 클랜을 운영하는 것을 넘어, **리눅스(Linux)의 오픈소스 정신(Bazaar Model)**을 계승하여 실패를 두려워하지 않는 실험적인 개발 문화를 지향합니다.

## 2. 핵심 철학 (Philosophy)
1.  **Fail Fast, Fix Faster:** 깨지는 것을 두려워하지 마십시오. 빠른 실패는 빠른 성장의 밑거름입니다.
2.  **Code is Law:** 모든 기획과 아이디어는 코드로 구현될 때 비로소 가치를 가집니다.
3.  **Open & Share:** 지식은 나눌수록 커집니다. 서로의 코드를 리뷰하고 배우십시오.
4.  **Ownership:** 이 프로젝트는 우리 모두의 포트폴리오이자, 우상향하는 자산(Asset)입니다.

## 3. 현재 개발 상태 (Current Status)
* **Frontend:** Next.js 14 (App Router) + Framer Motion
* **Backend:** Supabase (Auth & DB)
* **Deployment:** Vercel
* **Core Engine:** C++ WebAssembly (예정)

## 4. 로드맵 (Roadmap)
* [x] **Phase 1:** 프로젝트 셋업 및 랜딩 페이지 배포 (완료)
* [ ] **Phase 2:** Supabase 연동 및 클랜원 로그인 구현
* [ ] **Phase 3:** Clash Royale API 연동 및 전적 검색
* [ ] **Phase 4:** C++ 기반 승률 예측 알고리즘 탑재
* [ ] **Phase 5:** 커뮤니티 기능 (게시판, 랭킹) 오픈

---
**"Stay Hungry, Stay Foolish."**
Team CSE4Seoul


app/
├── layout.tsx           # (Global) 전역 레이아웃 (네비게이션 바, 푸터)
├── page.tsx             # (Public) 랜딩 페이지 (지금 만든 거)
│
├── (auth)/              # [인증 그룹] 로그인 관련 (URL에 (auth)는 안 보임)
│   ├── login/           # -> /login (로그인 페이지)
│   └── callback/        # -> /auth/callback (Supabase 인증 처리용)
│
├── (main)/              # [메인 앱 그룹] 로그인한 클랜원 전용 공간
│   ├── layout.tsx       # (App Layout) 사이드바, 유저 정보 표시
│   ├── dashboard/       # -> /dashboard (내 전적 요약, 오늘의 승률)
│   ├── clan/            # -> /clan (클랜원 명단, 대학별 소속 표시)
│   ├── analysis/        # -> /analysis (★ 핵심: C++ 승률 분석기)
│   └── community/       # -> /community (게시판, 훈수 두기)
│
└── api/                 # [백엔드] 서버 로직
    ├── clan/            # 클랜 정보 가져오기 (Clash Royale API)
    └── engine/          # C++ Wasm 연산 요청 처리
    