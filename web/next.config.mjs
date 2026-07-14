import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This web app is a standalone package nested inside the Expo repo, which has
  // its own lockfile. Pin the tracing root to web/ so Next stops warning about
  // the parent lockfile.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
