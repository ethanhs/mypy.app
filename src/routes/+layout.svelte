<script>
	import '../app.css';
</script>

<div class="h-[5rem]">
	<nav
		class="
    relative
    w-full
    flex flex-wrap
    items-center
    justify-between
    py-4
    shadow-sm
    navbar navbar-expand-lg navbar-light
    bg-[#1F5082]
    h-[5rem]
    "
	>
		<div class="collapse navbar-collapse flex-grow items-center p-1 pl-4">
			<!-- <img class="h-8 w-22" src="/mypy_logo.svg" alt="mypy logo"/> -->
			<h1 class="text-slate-100 font-mono text-2xl"><b>Mypy Editor</b></h1>
		</div>
		<div class="pr-4">
			<a class="px-2 py-1 font-mono text-slate-100" href="/">Editor</a>
			<a class="px-2 py-1 font-mono text-slate-100" href="/about">About</a>
		</div>
	</nav>
</div>

<slot class="h-[100%-5rem]" />
