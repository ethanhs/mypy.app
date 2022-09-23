<script lang="ts">
	export let value = '';
	export let placeholder = 'Enter text here!';
</script>

<input
	type="text"
	bind:value
	{placeholder}
	class="
    bg-slate-200
    font-mono
    text-black
    m-4
    px-6
    py-2.5
    flex-1
    form-control
    block
    text-lg
    w-full
    bg-clip-padding
    rounded
    transition
    ease-in-out
    focus:bg-white focus:outline-none
"
/>
