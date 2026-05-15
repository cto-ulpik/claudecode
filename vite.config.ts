import type { ClientRequest } from "node:http";
import { defineConfig, loadEnv } from "vite";
import type { ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const openaiKey = env.OPENAI_API_KEY?.trim() ?? "";

  const proxy: Record<string, ProxyOptions> = {
    "/api": {
      target: "http://127.0.0.1:3001",
      changeOrigin: true,
    },
  };

  if (openaiKey.length > 0) {
    proxy["/openai-proxy"] = {
      target: "https://api.openai.com",
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/openai-proxy/, ""),
      configure(proxy) {
        proxy.on("proxyReq", (proxyReq: ClientRequest) => {
          proxyReq.setHeader("Authorization", `Bearer ${openaiKey}`);
        });
      },
    };
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  };
});
