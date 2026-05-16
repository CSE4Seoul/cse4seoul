import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // 0. 로그인 여부 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'AI 기능은 로그인한 회원만 이용할 수 있습니다. 로그인을 먼저 해주세요.' }, 
        { status: 401 }
      );
    }

    const { model, prompt } = await req.json();
    
    // 환경변수가 제대로 들어오는지 확인용 로그
    console.log(
      '[AI Proxy] OLLAMA_URL 존재 여부:',
      !!process.env.OLLAMA_URL
    );

    console.log(
      '[AI Proxy] NODE_ENV:',
      process.env.NODE_ENV
    );

    const isProduction =
      process.env.NODE_ENV === 'production';

    const remoteUrlRaw =
      process.env.OLLAMA_URL?.replace(/\/$/, "");
    let remoteUrl: string | null = null;
    const urlsToTry: Array<{ name: string; url: string; fallbackModel: string; isLocal?: boolean }> = [];

    if (remoteUrlRaw && remoteUrlRaw.startsWith('http')) {
      // ngrok 등의 외부 주소가 유효한지 확인
      try {
        const parsed = new URL(remoteUrlRaw);
        if (parsed.host.includes('*')) {
          throw new Error('환경변수에 와일드카드(*)가 포함되어 있습니다. 실제 ngrok URL을 입력하세요.');
        }
        remoteUrl = parsed.toString();
      } catch (err: any) {
        console.error('[AI Proxy] 잘못된 OLLAMA_URL:', remoteUrlRaw, err.message);
      }
    }

    if (remoteUrl) {
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

        const targetUrl = new URL('/api/chat', item.url).toString();
        console.log(`[AI Proxy] 실제 호출 URL: ${targetUrl}`);

        const response = await fetch(targetUrl, {
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
                  '당신은 유쾌한 채팅 도우미입니다. 한국어로 짧게 한 문장으로 답변하세요. 당신은 CSE4Seoul의 전술 통신실을 담당하는 AI 어시스턴트입니다. 클래시 로얄 전략·덱·게임 이야기와 코딩·AI 학습 질문에 대해, 친근하고 예의 있게 한국어로 답변하세요. 짧게는 한두 문장, 설명이 필요하면 세네 문장까지 써도 되지만, 불필요하게 장황하게 쓰지 마세요. 모르는 정보나 확실하지 않은 내용은 아는 척하지 말고, 솔직하게 모른다고 말한 뒤, 어떻게 스스로 확인할 수 있을지 방향을 제안하세요.'
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
          const text = await response.text().catch(() => '응답 본문을 읽을 수 없습니다.');
          console.warn(
            `[AI Proxy] ❌ ${item.name} 응답 에러 (${response.status}) ${response.url} - ${text}`
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