import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Evita o Next escolher um package-lock.json de outra pasta como raiz.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
