"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ children }: { children?: React.ReactNode }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
      {children ?? '뒤로가기'}
    </button>
  );
}
