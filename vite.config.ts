import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ["codemirror", "@codemirror/language-python", "@codemirror/commands", "@codemirror/lint", "@codemirror/state", "@codemirror/theme-one-dark"],
	},
};

export default config;
