<script lang="ts">
	import Button from './Button.svelte';

	export let short = '';

	async function copyToClipboard() {
		navigator.clipboard.writeText(`https://mypy.app/?from=${short}`);
	}
</script>

<div class="flex-col bg-[#1F5082] justify-center">
	<div class="flex-auto m-6 mt-12">
		<p
			class="
            text-xl
            text-center
            text-slate-300
            font-mono
            "
		>
			Your short-url is <a
				class="transition duration-300 ease-in-out mb-4 underline hover:text-slate-200"
				href={'https://mypy.app/?from=' + short}>https://mypy.app/?from={short}</a
			>
		</p>
	</div>
	<div class="flex justify-center h-full">
		<Button onclick={copyToClipboard} text="Copy to clipboard" />
	</div>
</div>
