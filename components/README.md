# C/C++ WebAssembly (Wasm) 컴파일 및 추가 지침

이 디렉토리(`components/`)에 C/C++ 소스 파일을 추가하고 Wasm으로 컴파일하여 Next.js 프론트엔드와 통합하는 방법에 대한 가이드입니다.

---

## 1. 소스 파일 작성 및 위치
* **디렉토리**: 새로운 C/C++ 소스 파일은 반드시 `components/` 디렉토리에 위치해야 합니다.
  * 예시: `components/hello.cpp`, `components/my_program.cpp`
* **C++ 코드 규칙**:
  * 외부(JavaScript/TypeScript)에서 호출해야 하는 C/C++ 함수는 반드시 `extern "C"` 블록 내에 정의하고, 컴파일러가 최적화로 함수를 제거하지 않도록 `EMSCRIPTEN_KEEPALIVE` 매크로를 선언해야 합니다.
  * `main()` 함수가 정의되어 있다면, CLI 명령어 실행 형태(`./[이름]`)로 호출할 때 자동으로 해당 `main()` 함수가 실행됩니다.

```cpp
#include <stdio.h>
#include <emscripten/emscripten.h>

extern "C" {
    // JS에서 직접 cwrap/ccall로 호출 가능한 함수 예시
    EMSCRIPTEN_KEEPALIVE
    int add(int a, int b) {
        return a + b;
    }
}

// CLI 형태의 가상 프로그램으로 실행하고 싶다면 main() 선언
int main() {
    printf("Hello from Wasm Executable!\n");
    return 0;
}
```

---

## 2. 컴파일 방법 (Wasm 빌드)
프로젝트 루트 폴더에서 미리 작성된 컴파일 스크립트(`scripts/compile-wasm.sh`)를 실행하여 C++ 코드를 JavaScript/Wasm 모듈로 빌드합니다.

```bash
# 1. 모든 components/*.cpp 소스 파일들을 한 번에 컴파일할 경우:
./scripts/compile-wasm.sh

# 2. 특정 소스 파일 하나만 지정하여 컴파일할 경우:
./scripts/compile-wasm.sh components/YourFile.cpp
```

* **빌드 결과물 위치**: 컴파일된 결과물은 파일명이 소문자로 변환되어 `lib/wasm/[파일명].js` 경로로 생성됩니다.
  * 예시: `components/MyProgram.cpp` -> `lib/wasm/myprogram.js`

---

## 3. 핵심 컴파일 옵션 주의사항 (중요 ⚠️)
Next.js(Webpack/Turbopack) 번들러 및 브라우저 dynamic import 환경에서 빌드 및 파싱 오류가 발생하지 않도록 아래의 Emscripten 옵션이 적용되어 있어야 합니다:
* `-s SINGLE_FILE=1`: Wasm 바이너리를 JS 파일 내부에 포함하여 단일 파일로 배포할 수 있게 합니다.
* `-s SINGLE_FILE_BINARY_ENCODE=0`: **(매우 중요)** Wasm 바이너리를 raw binary 대신 안전한 **Base64 문자열**로 인코딩하도록 강제합니다. raw binary 인코딩(`=1`) 시 Webpack 빌드 과정 또는 dynamic import 로드 시 문자열 파싱 오류(`'' literal not terminated before end of script`)가 발생합니다.

*이 설정은 `scripts/compile-wasm.sh`에 이미 기본으로 내장되어 있으므로 가급적 스크립트를 사용해 컴파일하십시오.*

---

## 4. 프론트엔드 연동 및 실행방법
새로 컴파일된 Wasm 파일은 `lib/wasm-service.ts`를 통해 자동으로 동적 로드되어 즉시 사용할 수 있습니다.

### A. 가상 CLI 명령어 등록 (채팅창 연동)
채팅창 등에서 `./[프로그램명]`을 입력했을 때 자동으로 동작하게 하려면 다음 파일들의 가상 프로그램 런처 UI에 등록해 줍니다:
1. `components/LobbyChatWidget.tsx`의 Wasm 가상 프로그램 런처 패널 부분
2. `app/(main)/chat/page.tsx`의 Wasm 가상 프로그램 런처 패널 부분

### B. TypeScript 코드 내 직접 호출
Wasm 함수나 모듈 인터페이스를 TypeScript 코드 내부에서 직접 사용하려는 경우, `lib/wasm-service.ts`에 해당 모듈 로드 래퍼 함수를 정의하여 연동하세요.
