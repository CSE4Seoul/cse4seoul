# 🐾 조의ver with my neighbor 프로젝트 진행 리포트

본 문서는 `cse4seoul` 프로젝트 내 하위 미니게임인 **'조의ver 동물농장'**의 개발 과정과 주요 마일스톤을 기록합니다.

---

## 📅 프로젝트 개요
- **프로젝트명**: 조의ver with my neighbor (동물농장 오마주)
- **컨셉**: 2000년대 쥬니버 네이버 동물농장의 감성을 현대적 3D 클레이모피즘(Claymorphism)으로 재해석한 웹 게임.
- **주요 목표**: 고퀄리티 AI 에셋과 세련된 UI/UX를 결합한 인디 게임 데모 수준의 완성도 구현.

---

## 🛠️ 기술 스택 및 아키텍처
- **Framework**: Next.js (Pages Router 사용, App Router 프로젝트와 공존)
- **Styling**: Tailwind CSS (Y2K 레트로 테마)
- **State Management**: React Hooks (useState, useEffect)
- **Infrastructure**: Supabase (인증 및 데이터베이스 연동 완료)
- **Assets**: AI 생성 3D 클레이 스타일 이미지 (`public/assets/animal-farm/`)

---

## 🚀 주요 구현 내용

### 1. 프론트엔드 페이지 (Pages Router)
- **`pages/animal-farm/index.tsx`**: 내 농장 메인 UI. Supabase 연동을 통한 실시간 데이터 처리, 동물 선택 시스템 구현.
- **`pages/animal-farm/shop.tsx`**: 아이템 상점. 실제 DB 연동 구매 로직 및 포인트 차감 시스템 구현.
- **`pages/animal-farm/explore.tsx`**: 세계 탐험. 탐험 결과에 따른 랜덤 보상(포인트, 아이템) 지급 시스템 연동.

### 2. 백엔드 API (API Routes)
- **`/api/animal-farm/user`**: 유저의 동물 리스트 및 포인트 정보 조회 (Supabase 연동).
- **`/api/animal-farm/action`**: 동물 육성(훈련, 먹이주기) 및 스탯 업데이트 로직.
- **`/api/animal-farm/purchase`**: 아이템 구매 및 인벤토리 추가 처리.
- **`/api/animal-farm/explore`**: 탐험 보상 지급 처리.

### 3. 시스템 연동 및 진입점
- **대시보드 (`app/(main)/dashboard/page.tsx`)**: 로그인 직후 나타나는 메인 카드로 진입점 배치.
- **보드 (`app/(main)/board/page.tsx`)**: 전략 보드 내 우측 하단 플로팅 강아지 위젯(🐶) 배치.
- **뒤로가기 시스템**: 게임 내 모든 페이지에 기존 서비스로 복구 가능한 내비게이션 추가.

---

## 🎨 UI/UX 디자인 디테일
- **Multi-Animal Support**: 여러 마리의 동물을 키우고 선택하여 관리할 수 있는 사이드바 추가.
- **Real-time Synchronization**: 모든 액션이 즉시 DB에 반영되며 UI에 실시간으로 업데이트됨.
- **Enhanced Exploration**: 랜덤 보상 테이블 도입으로 탐험의 재미 요소 강화.
- **Asset Handler**: 이미지가 없을 경우 자동으로 `?` 기호와 대체 이모지를 띄워주는 스마트 에셋 디스플레이 시스템.

---

## 🔧 해결된 기술적 문제
1. **Supabase 연동**: Pages Router API Route에서 사용 가능한 `createPagesServerClient` 헬퍼 구현 및 연동.
2. **DB 스키마 구축**: 동물 정보, 유저 포인트, 인벤토리를 관리하기 위한 전용 테이블 및 RLS 정책 수립.
3. **상태 관리 최적화**: API 응답 결과를 바탕으로 로컬 상태를 부분 업데이트하여 부드러운 UX 제공.

---

## 📝 향후 과제 (Roadmap)
- [x] 실제 유저별 동물 데이터 Supabase DB 연동.
- [x] 상점 구매 아이템의 인벤토리 반영 기능.
- [x] 탐험 결과에 따른 랜덤 보상 테이블 및 애니메이션 강화.
- [ ] 인벤토리 아이템 사용 기능 (현재는 포인트로 직접 먹이주기만 가능).
- [ ] 배경 음악(BGM) 및 효과음(SFX) 삽입.
- [ ] 동물 진화 시스템 (특정 레벨 도달 시 외형 변화).

---
*Last Updated: 2026-05-24*
