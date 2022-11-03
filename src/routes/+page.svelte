<script lang="ts">
	import CodeMirror from 'svelte-codemirror-editor';
	import { python } from '@codemirror/lang-python';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { defaultKeymap, historyKeymap, history } from '@codemirror/commands';
	import { drawSelection, keymap, lineNumbers } from '@codemirror/view';

	import * as Comlink from 'comlink';
	import { default as Convert } from 'ansi-to-html';

	import { page } from '$app/stores';
	import { writable, type Writable } from 'svelte/store';
	import Modal, { bind } from 'svelte-simple-modal';

	import Popup from '$lib/components/Popup.svelte';
	import Button from '$lib/components/Button.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import TextEntry from '$lib/components/TextEntry.svelte';

	import * as Sentry from '@sentry/svelte';
	import { BrowserTracing } from '@sentry/tracing';

	import { logBreadcrumb } from '$lib/error';
	Sentry.init({
		environment: `${import.meta.env.MODE}`,
		dsn: 'https://0439a0c382654a0782f092e6e8ab8e86@o4504090754351104.ingest.sentry.io/4504090756513792',
		// @ts-ignore
		integrations: [new BrowserTracing()],
		tracesSampleRate: 1.0
	});

	const modal: Writable<string | null> = writable(null);
	const extensions = [
		history(),
		drawSelection(),
		lineNumbers(),
		keymap.of([...defaultKeymap, ...historyKeymap])
	];
	let short = '';
	let worker: Worker | null = null;
	let convert = new Convert({ newline: true });
	let output = '';
	let mypy_instance: any = undefined;
	let src = `def example(a: int, b: str) -> int:
    return a + b
`;
	let flags = '';
	let waiting_for_mypy = false;
	let package_name = '';
	let piperror = '';
	let waiting_for_pip = false;
	let installed_packages: Set<string> = new Set();
	const loadPyodide = (async () => {
		const PythonWorker = await import('../lib/python.worker.ts?worker');
		worker = new PythonWorker.default();
		const MypyWebworker = Comlink.wrap(worker);
		// @ts-ignore
		mypy_instance = await new MypyWebworker();
		const from = $page.url.searchParams.get('from');
		if (from != null) {
			const res = await fetch(`/short?from=${from}`, {
				method: 'GET'
			});
			let packages;
			[flags, packages, src] = await res.json();
			installed_packages = new Set(packages);
		}

		if (installed_packages.size != 0) {
			await Promise.all(
				Array.from(installed_packages).map(async (installed_package) => {
					await mypy_instance.installPackage(installed_package);
					logBreadcrumb({ category: 'packages', message: `${installed_packages}`, level: 'info' });
				})
			);
		}
		return await mypy_instance.ensurePyodideLoaded();
	})();
	async function getShortUrl() {
		let body = JSON.stringify([flags, Array.from(installed_packages), src]);
		const res = await fetch(`/short`, {
			method: 'POST',
			body: body
		});
		short = await res.text();
		modal.set(bind(Popup, { short: short }));
	}
	async function runMypy() {
		waiting_for_mypy = true;
		const tmpfile_path = '/tmp/test.py';
		await mypy_instance.writeFile(tmpfile_path, src);
		let args = await mypy_instance.splitFlags(flags);
		let [stdout, stderr, retcode] = await mypy_instance.runMypy([
			tmpfile_path,
			'--color-output',
			...args
		]);
		let level = 'info';
		if (retcode != 0) {
			level = 'error';
		}
		logBreadcrumb({ category: 'mypy', message: `${stdout + stderr}`, level: level });
		waiting_for_mypy = false;
		output = convert.toHtml(stdout + stderr);
	}
	async function installPackage() {
		piperror = '';
		waiting_for_pip = true;
		const error: string = await mypy_instance.installPackage(package_name);
		if (error != null) {
			piperror = error.replace(/(?:\r\n|\r|\n)/g, '<br>');
			logBreadcrumb({
				category: 'packages',
				message: `Failed to install package ${package_name}`,
				level: 'error'
			});
		} else {
			// Assume if there was an error the package did not get installed correctly
			installed_packages.add(package_name);
		}
		package_name = '';
		waiting_for_pip = false;
	}
</script>

<div
	class="
flex-none
flex-col
justify-center
h-[calc(100%-5rem)]
"
>
	<!--                                    vh - top bar -->
	<div class="flex justify-center h-[calc(100%-5rem)]">
		<CodeMirror
			bind:value={src}
			lang={python()}
			theme={oneDark}
			{extensions}
			tabSize={4}
			class="min-w-[50%] text-lg"
		/>
		<div
			id="right_half"
			class="output flex-col justify-center flex-auto min-w-[50%] p-4 bg-zinc-900 text-slate-100 text-lg"
		>
			{#await loadPyodide}
				<div class="h-full items-center justify-center flex">
					<Loader message="Loading mypy and Python..." />
				</div>
			{:then _}
				<div id="output_area" class="flex-auto h-[50%]">
					{#if waiting_for_mypy}
						<Loader message="Running mypy..." />
					{:else}
						{@html output}
					{/if}
				</div>
				<div id="pip_area" class="flex-auto h-[50%] border-t-2 border-t-slate-300">
					{#if waiting_for_pip}
						<Loader message="Running pip..." />
					{:else}
						<div class="flex flex-col justify-center">
							<div class="flex flex-row justify-center">
								<div class="flex h-full max-w-[10rem] flex-auto">
									<Button onclick={installPackage} text="Install package" />
								</div>
								<TextEntry bind:value={package_name} placeholder="types-aiofiles" />
							</div>
							<div class="flex-auto">
								{@html piperror}
							</div>
							<div class="flex-auto">
								<h2>Installed packages:</h2>
								<ul>
									{#each Array.from(installed_packages) as installed_package}
										<li>
											• <a
												class="text-xl transition duration-300 ease-in-out mb-4 underline hover:text-slate-200"
												href="https://pypi.org/p/{installed_package}">{installed_package}</a
											>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					{/if}
				</div>
			{:catch error}
				<p>Uh-oh, an error occured! :( {error.toString()}</p>
			{/await}
		</div>
	</div>
	<div id="footer" class="bg-[#1F5082] flex flex-row justify-center">
		{#await loadPyodide}
			<div class="h-full" />
		{:then}
			<Button onclick={runMypy} text="Run mypy" />
		{:catch error}
			<p>Hmm something is horribly wrong.</p>
		{/await}
		<TextEntry bind:value={flags} placeholder="Mypy command line arguments go here..." />
		<Modal
			show={$modal}
			classBg=""
			styleWindow={{ backgroundColor: '#1F5082', boxShadow: '0 2px 5px 0 rgba(0, 0, 0, 0.15)' }}
			styleCloseButton={{ backgroundColor: 'rgb(203 213 225)', 'border-color': '#2D323B' }}
		>
			{#await loadPyodide}
				<div class="h-full flex" />
			{:then}
				<Button onclick={getShortUrl} text="Share" />
			{:catch error}
				<p>Hmm something is horribly wrong.</p>
			{/await}
		</Modal>
	</div>
</div>
