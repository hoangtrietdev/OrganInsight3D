import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Configure webpack to handle three.js examples modules
  webpack: (config) => {
    // Handle FBX and other 3D model files
    config.module.rules.push({
      test: /\.(fbx|glb|gltf)$/,
      type: 'asset/resource',
    });

    // Allow importing from three/examples
    config.resolve.alias = {
      ...config.resolve.alias,
      'three/examples/jsm': 'three/examples/jsm',
    };

    return config;
  },

  // Configure headers for static assets
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
