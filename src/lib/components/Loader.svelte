<script lang="ts">
	import Pulse from 'svelte-loading-spinners/dist/Pulse.svelte';
	export let message = 'Loading...';
</script>

<div class="flex flex-col items-center justify-center h-full">
	<Pulse size="60" color="#1F5082" unit="px" duration="1.5s" />
	<div class="font-mono text-slate-400 py-2">
		<p>{message}</p>
	</div>
</div>
