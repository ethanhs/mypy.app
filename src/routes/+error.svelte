<script>
	import { page } from '$app/stores';
</script>

<h1>Oops! {$page.status}: {$page.error?.message}</h1>
