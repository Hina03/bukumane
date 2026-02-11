/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    watchOptions: {
      poll: 1000, // 1秒ごとに変更をチェック（Docker向け）
      aggregateTimeout: 300,
    },
  },
};

export default nextConfig;
