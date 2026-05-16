import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { model, prompt } = await req.json();

    const isProduction = process.env.NODE_ENV === 'production';
    const remoteUrl = process.env.OLLAMA_URL?.replace(/\/$/, "");
    const urlsToTry: Array<{ name: string; url: string; fallbackModel: string; isLocal?: boolean }> = [];

    // 1. 외부 서버 (ngrok 주소가 설정되어 있을 때만)
    if (remoteUrl && remoteUrl.startsWith('http')) {
      urlsToTry.push({ 
        name: "🚀 외부 AI 서버 (로컬 PC)", 
        url: remoteUrl, 
        fallbackModel: model || 'gemma:2b'
      });
    }

    // 2. 개발 환경용 Codespace 로컬 백업
    if (!isProduction) {
      const localUrl = "http://localhost:11434";
      urlsToTry.push({ 
        name: "🐢 Codespace 로컬 백업", 
        url: localUrl, 
        fallbackModel: "qwen2.5:0.5b",
        isLocal: true,
      });
    }

    if (urlsToTry.length === 0) {
      return NextResponse.json(
        { error: '설정된 AI 서버 주소가 없습니다. .env.local 설정을 확인하세요.' }, 
        { status: 500 }
      );
    }

    for (const item of urlsToTry) {
      try {
        console.log(`[AI Proxy] ${item.name} 시도 중...`);
        
        // 타임아웃 처리를 위한 컨트롤러
        const controller = new AbortController();

        const timeoutId = setTimeout(
          () => controller.abort(),
          item.isLocal ? 25000 : 12000
        );

        const response = await fetch(`${item.url}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            model: item.fallbackModel,
            messages: [
              { 
                role: 'system',
                content:
                  '당신은 유쾌한 채팅 도우미입니다. 한국어로 짧게 한 문장으로 답변하세요.'
              },
              { 
                role: 'user',
                content: prompt
              }
            ],
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          console.log(`[AI Proxy] ✅ ${item.name} 성공!`);

          return NextResponse.json({ 
            content: data.message.content,
            source: item.name 
          });
        } else {
          console.warn(
            `[AI Proxy] ❌ ${item.name} 응답 에러 (${response.status})`
          );
        }

      } catch (err: any) {
        console.warn(
          `[AI Proxy] ⚠️ ${item.name} 연결 실패 또는 타임아웃: ${err.message}`
        );

        // 다음 URL 시도로 넘어감
      }
    }

    // 모든 시도가 실패했을 때
    return NextResponse.json(
      { 
        error:
          '모든 AI 서버가 응답하지 않습니다. (로컬 PC가 꺼져 있거나 Codespace Ollama가 준비되지 않았을 수 있습니다.)'
      }, 
      { status: 503 }
    );

  } catch (error: any) {
    console.error('[AI Proxy] 치명적 오류:', error.message);

    return NextResponse.json(
      { error: `서버 내부 오류: ${error.message}` }, 
      { status: 500 }
    );
  }
}