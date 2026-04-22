// @ts-expect-error TODO: remover suppressão ampla
// 
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const nextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const cspReportUri = process.env.CSP_REPORT_URI ?? "";
const immutableAssetCache = "public, max-age=31536000, immutable";
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "";
const nextPublicEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const isWindows = process.platform === "win32";
const isDevelopmentLike =
  nextPublicEnvironment === "development" ||
  nextPublicEnvironment === "test" ||
  nextPublicEnvironment === "ci" ||
  nextPublicEnvironment === "ci-local";
const cspReportOnly =
  isDevelopmentLike && (process.env.NEXT_PUBLIC_CSP_REPORT_ONLY ?? "true") === "true";

const turbopackAliases = {
  "@birthub/config": pathToFileURL(path.join(repoRoot, "packages/config/dist/index.js")).href,
  "@birthub/config/web": pathToFileURL(path.join(repoRoot, "packages/config/dist/web.js")).href,
  "@birthub/config/web.js": pathToFileURL(path.join(repoRoot, "packages/config/dist/web.js")).href,
  "@birthub/logger": pathToFileURL(path.join(repoRoot, "packages/logger/dist/index.js")).href,
  "@birthub/utils": pathToFileURL(path.join(repoRoot, "packages/utils/dist/index.js")).href,
  "@birthub/utils/fetch": pathToFileURL(path.join(repoRoot, "packages/utils/dist/fetch.js")).href,
  "@birthub/workflows-core": pathToFileURL(path.join(repoRoot, "packages/workflows-core/dist/index.js")).href,
  "@birthub/workflows-core/nextjs": pathToFileURL(
    path.join(repoRoot, "packages/workflows-core/dist/nextjs.js")
  ).href
};

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${nextPublicApiUrl} https://*.ingest.sentry.io ${posthogHost ?? ""} ${
    isDevelopmentLike ? "ws: wss:" : ""
  }`,
  "font-src 'self' data:",
  "manifest-src 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  cspReportUri ? `report-uri ${cspReportUri}` : ""
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  {
    key: cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()"
  }
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  compress: true,
  crossOrigin: "anonymous",
  experimental: {
    sri: {
      algorithm: "sha384"
    }
  },
  transpilePackages: [],
  turbopack: {
    resolveAlias: turbopackAliases
  },
  output: isWindows ? undefined : "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  poweredByHeader: false,
  reactStrictMode: true,
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"]
    };

    return config;
  },
  headers() {
    return Promise.resolve([
      {
        headers: [
          {
            key: "Cache-Control",
            value: immutableAssetCache
          }
        ],
        source: "/_next/static/(.*)"
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: immutableAssetCache
          }
        ],
        source: "/(.*\\.(?:avif|css|gif|ico|jpg|jpeg|js|mjs|otf|png|svg|ttf|webp|woff|woff2))"
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "no-store"
          }
        ],
        source: "/((?!_next/static|_next/image|.*\\.(?:avif|css|gif|ico|jpg|jpeg|js|mjs|otf|png|svg|ttf|webp|woff|woff2)$).*)"
      },
      {
        headers: securityHeaders,
        source: "/(.*)"
      }
    ]);
  }
};

export default nextConfig;
