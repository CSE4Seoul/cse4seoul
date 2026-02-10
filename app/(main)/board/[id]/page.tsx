import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // URL 파라미터로 넘어온 ID로 글 하나만 조회
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!post) notFound(); // 글이 없으면 404 페이지로

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <Link href="/board" className="text-blue-400 hover:underline mb-6 block">
        ← 목록으로 돌아가기
      </Link>
      
      <article className="bg-gray-900/30 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm">
        <header className="mb-8 border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center text-gray-400 gap-3">
            <span className="font-semibold text-gray-200">
              {post.is_anonymous ? '익명의 요원' : post.author_name}
            </span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>
        </header>

        <div className="text-lg leading-relaxed whitespace-pre-wrap text-gray-200">
          {post.content}
        </div>
      </article>
    </div>
  );
}