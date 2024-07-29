/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'images.unsplash.com',
            },
          ],
      },
      env: {
        SERVER_URL: process.env.SERVER_URL,
        CLIENT_URL: process.env.CLIENT_URL,
    }
};

export default nextConfig;
