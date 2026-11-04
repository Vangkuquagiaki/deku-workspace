/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["livekit-server-sdk"]
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil"
    });

    if (isServer) {
      config.externals.push("livekit-server-sdk");
    }

    return config;
  },
  images: {
    domains: ["uploadthing.com", "utfs.io", "images.unsplash.com", "img.clerk.com"]
  },
  swcMinify: false
};

module.exports = nextConfig;
