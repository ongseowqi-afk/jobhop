import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jobhop/db", "@jobhop/types"],
};

export default nextConfig;
