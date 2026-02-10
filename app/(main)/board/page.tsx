import { createClient } from '@/utils/supabase/server';
import Link from "next/link";

export default async function BoardPage() {
  const supabase = await createClient();
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <div className="p-6 text-red-500">에러 발생: {error.message}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      {/* 🚀 이제 버튼이 보입니다! */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">전략 게시판</h1>
        <Link 
          href="/board/write" 
          className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          새 작전 수립 🖋️
        </Link>
      </div>

      <div className="space-y-4">
        {posts?.map((post) => (
          <Link 
            key={post.id} 
            href={`/board/${post.id}`} 
            className="block p-5 border border-gray-800 rounded-2xl bg-gray-900/50 hover:bg-gray-800 transition-all"
          >
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-gray-400 text-sm mt-2">
              {post.is_anonymous ? '👤 익명의 요원' : `🎖️ ${post.author_name}`} • {new Date(post.created_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}