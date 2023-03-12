<script lang="ts">
	import { Pulse } from 'svelte-loading-spinners';
	export let message = 'Loading...';
	let cls = 'items-center justify-center h-full flex flex-col';
	export { cls as class };
</script>

<div class={cls}>
	<Pulse size="60" color="#1F5082" unit="px" duration="1.5s" />
	<div class="font-mono text-slate-300 py-2">
		<p>{message}</p>
	</div>
</div>
