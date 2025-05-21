/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  // 如果使用了basePath,取消下面的注释
  // basePath: '',
  typescript: {
    // 构建时不进行类型检查，加快构建速度
    ignoreBuildErrors: true,
  },
  eslint: {
    // 构建时不进行ESLint检查，加快构建速度
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
