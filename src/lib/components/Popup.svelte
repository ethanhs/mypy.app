<script>
	export let short = '';

	async function copyToClipboard() {
		navigator.clipboard.writeText(`https://mypy.app/?from=${short}`);
	}
</script>

<div class="flex-col bg-[#1F5082]">
    <div class="flex-auto m-6 mt-12">
        <p class="
            text-xl
            text-center
            text-slate-300
            font-mono
            ">
            Your short-url is <a class="transition duration-300 ease-in-out mb-4 underline hover:text-slate-200" href={'https://mypy.app/?from=' + short}>https://mypy.app/?from={short}</a>
        </p>
    </div>
    <button class="
        m-4
        mt-1
        px-6
        py-2.5
        bg-[#2D323B]
        text-lg
        text-slate-300
        font-mono
        max-w-[20rem]
        flex-auto
        hover:text-slate-100
        active:text-slate-400
      "
      on:click="{copyToClipboard}"
    >Copy to clipboard</button>
</div>

