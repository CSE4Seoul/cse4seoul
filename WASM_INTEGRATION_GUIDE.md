# WebAssembly (Wasm) 통합 가이드

이 문서는 Emscripten을 사용하여 C++ 코드를 프로젝트에 통합하는 방법과 구조에 대해 설명합니다.

## 1. 구조 및 경로

- **C++ 소스 파일**: `components/*.cpp`
  - 예: `components/Winpercent.cpp`, `components/value_score.cpp`
- **컴파일 스크립트**: `scripts/compile-wasm.sh`
  - C++ 파일을 컴파일하여 JS 파일을 생성합니다.
  - `--bind` 옵션을 지원하여 Embind를 사용하는 코드도 컴파일 가능합니다.
  - `-s ENVIRONMENT='web,worker'` 옵션을 사용하여 웹 환경에 최적화되어 있습니다.
- **Wasm JS 코드**: `lib/wasm/*.js`
  - 컴파일된 Wasm 바이너리가 내장된(Self-contained) 모듈입니다. (`SINGLE_FILE=1`)
- **Wasm 서비스**: `lib/wasm-service.ts`
  - Wasm 모듈을 동적으로 로드하고 React에서 사용할 수 있게 인터페이스를 제공합니다.

## 2. 컴파일 방법

새로운 C++ 코드를 작성하거나 기존 코드를 수정했을 때 아래 명령어를 실행합니다.

```bash
# 모든 components/*.cpp 파일을 컴파일
./scripts/compile-wasm.sh

# 특정 파일만 컴파일할 경우
./scripts/compile-wasm.sh components/YourFile.cpp
```

이 스크립트는 자동으로 다음 작업을 수행합니다:
1. `.cpp` 파일을 컴파일하여 `lib/wasm/`에 JS 파일을 생성합니다. (`SINGLE_FILE=1` 옵션을 사용하여 Wasm 바이너리가 JS 파일 안에 포함됩니다.)
2. 파일명을 모두 소문자로 변환하여 일관성을 유지합니다.

## 3. React에서 사용하기

`wasmService`를 사용하여 Wasm 기능을 호출할 수 있습니다.

```typescript
import { wasmService } from '@/lib/wasm-service';

// 예시: 승률 계산 기능 호출
const handleCalculate = async () => {
  const result = await wasmService.calculateRequiredWins(winCount, loseCount, targetPercent);
  console.log('필요한 승수:', result);
};
```

## 4. 확장 방법 (새로운 C++ 기능 추가)

1. **C++ 파일 작성**: `components/` 디렉토리에 새로운 `.cpp` 파일을 생성합니다.
   - 외부에서 호출할 함수는 `extern "C"` 블록 안에 작성하고 `EMSCRIPTEN_KEEPALIVE` 매크로를 붙여야 합니다.

   ```cpp
   #include <emscripten/emscripten.h>

   extern "C" {
     EMSCRIPTEN_KEEPALIVE
     int myNewFunction(int a, int b) {
       return a + b;
     }
   }
   ```

2. **컴파일**: `./scripts/compile-wasm.sh`를 실행합니다.

3. **서비스 업데이트**: `lib/wasm-service.ts`에 해당 모듈을 호출하는 메서드를 추가합니다.

   ```typescript
   async callMyFunction(a: number, b: number): Promise<number | null> {
     const module = await this.getModule('파일이름'); // 소문자 파일명
     if (!module) return null;
     
     const fn = module.cwrap('myNewFunction', 'number', ['number', 'number']);
     return fn(a, b);
   }
   ```

## 5. 주의 사항

- **파일명**: 컴파일 스크립트에서 파일명을 소문자로 변환하므로, `getModule('filename')` 호출 시 반드시 소문자를 사용해야 합니다.
- **메모리**: `ALLOW_MEMORY_GROWTH=1` 설정이 적용되어 있어 큰 데이터 처리 시에도 메모리가 자동으로 확장됩니다.
- **환경**: 이 기능은 클라이언트 사이드(`'use client'`)에서만 작동하도록 설계되었습니다.
