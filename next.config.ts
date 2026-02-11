import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "scaling-space-meme-9756v47rrw9x3xvxj-3000.app.github.dev", // 에러 메시지에 뜬 그 주소!
        "localhost:3000"
      ],
    },
  },
};

export default nextConfig;
