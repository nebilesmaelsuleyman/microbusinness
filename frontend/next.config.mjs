/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SEO: emit a trailing-slash-free canonical structure and allow remote avatars.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
