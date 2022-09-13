{#await loadPyodide}
<div class="flex flex-col items-center justify-center h-[calc(100%-5rem)]">
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
  flex-none
  flex-col
  justify-center
  h-[calc(100%-5rem)]
">
  <!--                                    vh - top bar + margin -->
  <div class="flex justify-center h-[calc(100%-5rem+4px)]">
    <CodeMirror
      bind:value
      lang={python()}
      theme={oneDark}
      extensions={extensions}
      tabSize={4}
      class="h-full min-w-[50%] text-lg"
    />
    <div class="output flex-auto min-w-[50%] h-full p-4 bg-zinc-900 text-slate-100 text-lg">
      {@html output}
    </div>
  </div>
  <div class="bg-[#1F5082]">
    <button
    type="button"
    class="m-4 px-6 py-2.5 bg-[#2D323B] text-slate-300 font-mono"
    on:click="{runMypy}">Run mypy</button>
  </div>
</div>
{:catch error}
    <p>Uh-oh, an error occured! :(</p>
{/await}

<script lang=ts>
  import { Pulse } from 'svelte-loading-spinners';
  import CodeMirror from "svelte-codemirror-editor";
  import { python } from '@codemirror/lang-python';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { defaultKeymap, historyKeymap, history } from "@codemirror/commands";
  import { drawSelection, keymap, lineNumbers } from "@codemirror/view";
  import * as Comlink from "comlink";
  import { default as Convert } from "ansi-to-html";
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
  let convert = new Convert({newline: true});
  let output = "";
  let mypy_instance: any = undefined;
  let value = `def example(a: int, b: str) -> int:
    return a + b
`;
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
    let [stdout, stderr, retcode] = await mypy_instance.runMypy([tmpfile_path, "--color-output"]);
    console.log(retcode);
    console.log(stdout);
    console.log(stderr);
    output = convert.toHtml(stdout + stderr);
  }
</script>
