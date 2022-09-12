<div>
  {#await loadPyodide}
  <Pulse size="60" color="#1F5082" unit="px" duration="1.5s"></Pulse>
  {:then _}
  <CodeMirror bind:value lang={python()} />
  <button 
    type="button"
    class="inline-block px-6 py-2.5 bg-blue-600 text-white"
    on:click="{runMypy}"></button>
  <div class="output">
    <p>{output}</p>
  </div>
  {:catch error}
      <p>Uh-oh, an error occured!</p>
  {/await}
</div>

<script lang=ts>
  import { Pulse } from 'svelte-loading-spinners';
  import CodeMirror from "svelte-codemirror-editor";
  import { python } from '@codemirror/lang-python';
  import { onMount } from 'svelte';
  import * as Comlink from "comlink";
  let worker: Worker | null = null;
  let output = "";
  let mypy_instance: any = undefined;
  let value = "'This should error' + 1";
  const loadPyodide = (async () => {
    const PythonWorker = await import('../lib/python.worker.ts?worker');
    worker = new PythonWorker.default();
    const MypyWebworker = Comlink.wrap(worker);
    // @ts-ignore
    mypy_instance = await new MypyWebworker();
    return await mypy_instance.ensurePyodideLoaded();
  })();
  async function runMypy() {
    // TODO: handle args
    const tmpfile_path = "/tmp/test.py";
    await mypy_instance.writeFile(tmpfile_path, value);
    let [retcode, stdout, stderr] = await mypy_instance.runMypy([tmpfile_path]);
    console.log(retcode);
    console.log(stdout);
    console.log(stderr);
    output = stdout + stderr;
  }
</script>