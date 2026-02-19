import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server external packages for SQLite
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
