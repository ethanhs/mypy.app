<script lang="ts">
	export let text = 'Press me!';
	export let onclick = () => {};
</script>

<button
	type="button"
	class="
    m-4
    px-6
    py-2.5
    bg-[#2D323B]
    text-lg
    text-slate-300
    font-mono
    hover:text-slate-200
    active:text-slate-400
  "
	on:click={onclick}
>
	{text}
</button>
