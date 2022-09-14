import vercel from '@sveltejs/adapter-vercel'
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess({
		postcss: true,
	}),

	kit: {
		vite: {
            build: {
                sourcemap: true
            }
        },
		adapter: vercel(),
	}
};

export default config;
