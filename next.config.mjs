/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker環境でのホットリロード用設定
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000, // 1秒ごとに変更をチェック
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
