/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @platform/shared is a workspace package published from TS source (no prebuilt
  // dist on Vercel). Transpile it so Next compiles the source directly.
  transpilePackages: ['@platform/shared'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Webpack from bundling node-only modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        canvas: false,
        jsdom: false,
      };
    } else {
      // Mark node-only modules as external on the server so Webpack doesn't parse them
      config.externals = [...config.externals, 'canvas', 'jsdom'];
    }
    return config;
  },
};

module.exports = nextConfig;