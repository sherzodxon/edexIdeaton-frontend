/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/admin/login', destination: '/admin', permanent: false, has: [{ type: 'cookie', key: 'ideaton_token' }] },
    ];
  },
};

module.exports = nextConfig;
