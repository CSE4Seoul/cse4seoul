// app/(main)/board/write/page.tsx
import { createPost } from "../actions";

export default function WritePage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">새 작전 보고서 작성</h1>
      
      <form action={createPost} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제목</label>
          <input 
            name="title" 
            required 
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
            placeholder="제목을 입력하세요"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">내용</label>
          <textarea 
            name="content" 
            required 
            rows={10}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
            placeholder="내용을 입력하세요"
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_anonymous" id="anon" />
          <label htmlFor="anon" className="text-sm text-gray-400 font-bold">익명으로 작성</label>
        </div>

        <button 
          type="submit" 
          className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition"
        >
          보고서 제출
        </button>
      </form>
    </div>
  );
}