import vercel from '@sveltejs/adapter-vercel'
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess({
		sourceMap: true,
		postcss: true,
	}),
	compilerOptions: {
		enableSourcemap: true,
	},
	kit: {
		adapter: vercel(),
	}
};

export default config;
