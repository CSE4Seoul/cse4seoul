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
- **Infrastructure**: Supabase (인증 및 데이터베이스 연동 준비 완료)
- **Assets**: AI 생성 3D 클레이 스타일 이미지 (`public/assets/animal-farm/`)

---

## 🚀 주요 구현 내용

### 1. 프론트엔드 페이지 (Pages Router)
- **`pages/animal-farm/index.tsx`**: 내 농장 메인 UI. 동물과의 인터랙션(먹이주기, 쓰다듬기, 훈련) 및 실시간 스탯(Hunger, Exp) 관리.
- **`pages/animal-farm/shop.tsx`**: 아이템 상점. 모달 기반 결제 시스템 및 잔액 계산 로직 구현.
- **`pages/animal-farm/explore.tsx`**: 세계 탐험. 실시간 카운트다운 타이머 및 보상 수령 시스템 구현.
- **`pages/_app.tsx`**: Pages Router 환경에서 Tailwind CSS 정상 로드를 위한 공통 설정 파일.

### 2. 백엔드 API (API Routes)
- **`/api/animal-farm/user`**: 유저 정보 및 동물 리스트 데이터 제공 (Mock Data 구성).
- **`/api/animal-farm/action`**: 동물 육성 및 포인트 소모 로직 처리 핸들러.

### 3. 시스템 연동 및 진입점
- **대시보드 (`app/(main)/dashboard/page.tsx`)**: 로그인 직후 나타나는 메인 카드로 진입점 배치.
- **보드 (`app/(main)/board/page.tsx`)**: 전략 보드 내 우측 하단 플로팅 강아지 위젯(🐶) 배치.
- **뒤로가기 시스템**: 게임 내 모든 페이지에 기존 서비스로 복구 가능한 내비게이션 추가.

---

## 🎨 UI/UX 디자인 디테일
- **3D Claymation Style**: 두툼한 보더, 깊은 그림자, 파스텔톤 색감을 통한 입체감 구현.
- **Micro-interactions**: 버튼 클릭 시의 물리적 피드백, 하트(❤️) 연출, 게이지 바의 부드러운 애니메이션.
- **Asset Handler**: 이미지가 없을 경우 자동으로 `?` 기호와 대체 이모지를 띄워주는 스마트 에셋 디스플레이 시스템.

---

## 🔧 해결된 기술적 문제
1. **Tailwind CSS 미적용 이슈**: Pages Router 파일들이 `globals.css`를 참조하지 못하던 문제를 `pages/_app.tsx` 추가를 통해 해결.
2. **구문 오류 수정**: `board/page.tsx` 수정 중 발생했던 중복 `</div>` 태그 및 파싱 오류 해결.
3. **에셋 경로 표준화**: `public/assets/animal-farm/` 하위로 모든 자산을 구조화하여 관리 편의성 증대.

---

## 📝 향후 과제 (Roadmap)
- [ ] 실제 유저별 동물 데이터 Supabase DB 연동.
- [ ] 상점 구매 아이템의 인벤토리 반영 기능.
- [ ] 탐험 결과에 따른 랜덤 보상 테이블 및 애니메이션 강화.
- [ ] 배경 음악(BGM) 및 효과음(SFX) 삽입.

---
*Last Updated: 2026-05-24*
