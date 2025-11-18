/** @type {import('@sveltejs/kit').Config} */
import adapter_node from '@sveltejs/adapter-node';
import adapter_netlify from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const adapter = !!process.env.NETLIFY ? adapter_netlify : adapter_node;

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;