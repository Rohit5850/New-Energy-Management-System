/** @type {import('next').NextConfig} */
const nextConfig = {
  // `pg` (PostgreSQL driver) is a Node package — keep it external so Next does
  // not try to bundle it.
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
