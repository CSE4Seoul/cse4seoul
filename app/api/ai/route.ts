import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { model, prompt } = await req.json();

    const isProduction = process.env.NODE_ENV === 'production';
    const remoteUrl = process.env.OLLAMA_URL?.replace(/\/$/, "");
    const localUrl = "http://localhost:11434";

    const urlsToTry = [];

    // 1. 외부 서버 (ngrok 등)
    if (remoteUrl) {
      urlsToTry.push({ 
        name: "🚀 외부 AI 서버", 
        url: remoteUrl, 
        fallbackModel: model 
      });
    }

    // 2. 개발 환경용 로컬 백업
    if (!isProduction) {
      urlsToTry.push({ 
        name: "🐢 Codespace 로컬", 
        url: localUrl, 
        fallbackModel: "qwen2.5:0.5b" 
      });
    }

    // 만약 시도할 URL이 아예 없는 경우
    if (urlsToTry.length === 0) {
      return NextResponse.json({ 
        content: "🤖 현재 AI를 구동할 수 있는 환경이 설정되지 않았습니다. 관리자에게 문의하세요."
      });
    }

    for (const item of urlsToTry) {
      try {
        console.log(`[AI Proxy] ${item.name} 연결 시도...`);
        
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
                content: '당신은 유쾌한 로비 도우미입니다. 한국어로 아주 짧게 한 문장으로 답변하세요.' 
              },
              { 
                role: 'user', 
                content: prompt 
              }
            ],
            stream: false,
          }),
          // 타임아웃
          signal: AbortSignal.timeout(
            item.url === localUrl ? 20000 : 12000
          ), 
        });

        if (response.ok) {
          const data = await response.json();

          return NextResponse.json({ 
            content: data.message.content,
            source: item.name 
          });
        }
      } catch (err: any) {
        console.warn(
          `[AI Proxy] ${item.name} 실패 또는 응답 지연: ${err.message}`
        );

        continue; 
      }
    }

    // 모든 시도가 실패한 경우
    return NextResponse.json({ 
      content:
        "🤖 죄송합니다. 현재 AI 서버가 응답하지 않거나 연결할 수 없는 환경입니다. (로컬 PC가 꺼져 있을 수 있습니다.)",
      status: "offline"
    });

  } catch (error: any) {
    return NextResponse.json({ 
      content: "🤖 AI 연결 중 예상치 못한 에러가 발생했습니다.",
      error: error.message 
    });
  }
}