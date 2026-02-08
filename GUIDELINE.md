# 🛠️ CSE4Seoul Developer Guidelines

이 문서는 프로젝트에 기여하는 모든 개발자를 위한 가이드라인입니다.
**"깨끗한 코드가 최고의 주석입니다."**

## 1. 브랜치 전략 (Git Flow)
우리는 **GitHub Flow**를 따릅니다.

* **`main`**: 언제나 배포 가능한 상태(Production)입니다. **절대 직접 푸시하지 마십시오.**
* **`feature/기능명`**: 새로운 기능을 개발할 때 사용합니다. (예: `feature/login-page`)
* **`fix/버그명`**: 버그를 수정할 때 사용합니다. (예: `fix/header-typo`)
* **작업 순서:**
    1. `main`에서 브랜치 생성 (`git checkout -b feature/my-feature`)
    2. 작업 후 커밋 & 푸시
    3. GitHub에서 **Pull Request (PR)** 생성
    4. 코드 리뷰 후 Merge

## 2. 커밋 메시지 규칙 (Commit Convention)
명확한 히스토리 관리를 위해 아래 규칙을 엄수해주세요.

| 태그 | 설명 | 예시 |
| :--- | :--- | :--- |
| `feat` | 새로운 기능 추가 | `feat: Add login page layout` |
| `fix` | 버그 수정 | `fix: Resolve layout breakdown on mobile` |
| `docs` | 문서 수정 | `docs: Update README.md` |
| `style` | 코드 포맷팅 (로직 변경 없음) | `style: Fix indentation` |
| `refactor` | 코드 리팩토링 | `refactor: Optimize rank calculation logic` |
| `chore` | 기타 잡일 (빌드 설정 등) | `chore: Install framer-motion` |

## 3. 기술 스택 및 스타일 (Tech Stack)
* **Language:** TypeScript (엄격한 타입 사용, `any` 지양)
* **Styling:** Tailwind CSS (클래스 순서 정리 권장)
* **State Mgmt:** React Hooks / Supabase Client
* **Core Logic:** C++ (Wasm) - `src/cpp` 디렉토리 내 관리

## 4. 이슈 리포팅 (Issue Tracking)
새로운 아이디어나 버그는 구두로 말하지 말고, **Issues** 탭에 등록해주세요.

> **제목:** [Feat] 전적 검색 필터 추가
> **내용:** 최근 10경기만 볼 수 있는 필터가 필요합니다.

## 5. 협업 매너 (Etiquette)
* PR을 보낼 때는 **"어떤 변경사항인지"** 스크린샷과 함께 설명해주세요.
* 다른 사람의 코드를 비난하지 말고, **더 나은 대안**을 제시해주세요.
* 모르는 것은 부끄러운 게 아닙니다. 질문은 언제나 환영입니다.

---
**Happy Coding!** 💻