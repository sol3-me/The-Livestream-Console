import { readFileSync } from 'fs';
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	env: {
		NEXT_PUBLIC_APP_VERSION: version,
	},
	// Enable the instrumentation.ts hook that validates env vars at startup
	experimental: {
		instrumentationHook: true
	},
	eslint: {
		ignoreDuringBuilds: false
	}
};

export default nextConfig;
