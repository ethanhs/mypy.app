<div class="
  relative
  h-full
  items-center
">
  {#await loadPyodide}
  <div class="flex flex-col items-center justify-center h-full m-36">
    <Pulse
      size="60"
      color="#1F5082"
      unit="px"
      duration="1.5s"
    />
    <div class="font-mono text-slate-500 py-2">
      <p>Loading Python and mypy...</p>
    </div> 
  </div>
  {:then _}
  <div class="
    w-full
    h-full
    p-0
  ">
    <CodeMirror
      bind:value
      lang={python()}
      theme={oneDark}
      extensions={extensions}
      tabSize={4}
    />
  </div>
  <div class="relative w-full flex flex-row">
    <button
    type="button"
    class="mr-auto px-6 py-2.5 bg-sky-700 text-slate-200"
    on:click="{runMypy}">Run mypy</button>
    <div class="output">
      <p>{output}</p>
    </div>
  </div>
  {:catch error}
      <p>Uh-oh, an error occured!</p>
  {/await}
</div>

<script lang=ts>
  import { Pulse } from 'svelte-loading-spinners';
  import CodeMirror from "svelte-codemirror-editor";
  import { python } from '@codemirror/lang-python';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { defaultKeymap, historyKeymap, history } from "@codemirror/commands";
  import { drawSelection, keymap, lineNumbers } from "@codemirror/view";
  import * as Comlink from "comlink";
  const extensions = [
    history(),
    drawSelection(),
    lineNumbers(),
    keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
    ])
  ];
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
