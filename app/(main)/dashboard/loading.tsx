export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white flex items-center justify-center">
      {/* 배경용 그리드 + 글로우 */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(147,51,234,0.2),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-md w-full px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(59,130,246,0.35)]">
          {/* 상단 상태 바 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-2">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              KERNEL CHANNEL / v1.3.7
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              SECURE BOOT
            </span>
          </div>

          <div className="px-8 py-10 flex flex-col items-center">
            {/* 메인 로더 */}
            <div className="relative w-28 h-28 mb-8">
              {/* 바깥 고리 */}
              <div className="absolute inset-0 rounded-full border border-slate-700/60" />
              <div className="absolute inset-1 rounded-full border border-slate-600/60" />

              {/* 회전 링 1 */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-cyan-400/80 animate-spin-slow" />
              {/* 회전 링 2 (반대 방향) */}
              <div className="absolute inset-2 rounded-full border-2 border-slate-700 border-b-violet-500/80 animate-spin-slower reverse-spin" />

              {/* 중심 글로우 + 텍스트 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-16 h-16 rounded-full bg-cyan-500/20 blur-2xl" />
                <div className="relative text-[10px] font-semibold tracking-[0.25em] text-slate-100/90 uppercase">
                  LOADING
                </div>
              </div>
            </div>

            {/* 메인 타이틀 */}
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-fuchsia-400 mb-3 tracking-wide">
              Accessing Kernel Interface...
            </h2>

            {/* 서브 문구 */}
            <p className="text-xs text-slate-300 font-mono mb-6 text-center">
              decrypting secure user data · establishing quantum-safe channel
            </p>

            {/* 프로그레스 바 */}
            <div className="w-full">
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 animate-loading-bar" />
              </div>
              <div className="mt-3 flex justify-between text-[10px] font-mono text-slate-400">
                <span>AUTH TOKEN</span>
                <span>0xA9F3:HANDSHAKE</span>
              </div>
            </div>

            {/* 하단 로그 느낌 텍스트 */}
            <div className="mt-6 w-full rounded-2xl bg-black/40 border border-white/5 px-4 py-3">
              <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                &gt; INIT_KERNEL() ✔<br />
                &gt; MOUNT /dev/secure-user-space ✔<br />
                &gt; APPLY_ENCRYPTION_LAYER( AES-256-GCM ) ...<br />
                &gt; AWAITING_INTERRUPT: USER_CONTEXT_BOOTSTRAP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 커스텀 애니메이션 유틸이 필요하면 tailwind.config에 추가 */}
    </div>
  );
}
