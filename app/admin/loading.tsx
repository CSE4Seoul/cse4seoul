export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        {/* 로딩 스피너 애니메이션 */}
        <div className="w-12 h-12 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin" />
        
        <p className="text-gray-400 font-mono animate-pulse">
          Verifying Admin Access...
        </p>
      </div>
    </div>
  );
}