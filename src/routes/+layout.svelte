<script>
  import "../app.css";
</script>

<div>
  <nav class="
    relative
    w-full
    flex flex-wrap
    items-center
    justify-between
    py-4
    shadow-sm
    navbar navbar-expand-lg navbar-light
    bg-sky-700
    ">
    <div class="collapse navbar-collapse flex-grow items-center p-1 pl-4">
      <!-- <img class="h-8 w-22" src="/mypy_logo.svg" alt="mypy logo"/> -->
      <h1 class="text-slate-200 font-mono text-2xl"><b>Mypy Editor</b></h1>
    </div>
    <div class="pr-4">
      <a class="px-2 py-1 font-mono text-slate-200" href="/">Editor</a>
      <a class="px-2 py-1 font-mono text-slate-200" href="/about">About</a>
    </div>
  </nav>
</div>

<slot/>