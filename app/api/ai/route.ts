// app/api/ai/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { model, prompt } = await req.json();

    const remoteUrl = process.env.OLLAMA_URL?.replace(/\/$/, "");
    const localUrl = "http://localhost:11434";

    const urlsToTry = [
      { name: "🚀 로컬 PC (ngrok)", url: remoteUrl, fallbackModel: model },
      { name: "🐢 Codespace (백업)", url: localUrl, fallbackModel: "qwen2.5:0.5b" }
    ].filter(item => !!item.url);

    for (const item of urlsToTry) {
      try {
        console.log(`[AI Proxy] ${item.name} 시도 중 (${item.fallbackModel})...`);
        
        const response = await fetch(`${item.url}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            model: item.fallbackModel,
            messages: [
              { role: 'system', content: '당신은 유쾌한 로비 도우미입니다. 한국어로 아주 짧게 한 문장으로 답변하세요.' },
              { role: 'user', content: prompt }
            ],
            stream: false,
          }),
          signal: AbortSignal.timeout(item.url === localUrl ? 20000 : 15000), 
        });

        if (response.ok) {
          const data = await response.json();

          console.log(`[AI Proxy] ✅ ${item.name} 응답 성공!`);

          return NextResponse.json({ 
            content: data.message.content,
            source: item.name 
          });
        }
      } catch (err: any) {
        console.warn(`[AI Proxy] ⚠️ ${item.name} 실패: ${err.message}`);
        continue; 
      }
    }

    return NextResponse.json(
      { error: '모든 AI 연결이 실패했습니다.' },
      { status: 500 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}