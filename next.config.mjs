/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', '@ai-sdk/ollama', 'ai'],
  },
};

export default nextConfig;
