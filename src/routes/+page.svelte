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
  <!--                                    vh - top bar -->
  <div class="flex justify-center h-[calc(100%-5rem)]">
    <CodeMirror
      bind:value
      lang={python()}
      theme={oneDark}
      extensions={extensions}
      tabSize={4}
      class="min-w-[50%] text-lg"
    />
    <div class="output flex-col justify-center flex-auto min-w-[50%] p-4 bg-zinc-900 text-slate-100 text-lg">
      <div class="flex-auto h-[50%]">
        {#if waiting_for_mypy}
          <div class="flex flex-col items-center justify-center">
            <Pulse
              size="60"
              color="#1F5082"
              unit="px"
              duration="1.5s"
            />
            <div class="font-mono text-slate-500 py-2">
              <p>Running mypy...</p>
            </div>
          </div>
        {:else}
          {@html output}
        {/if}
      </div>
      <div class="flex-auto h-[50%] border-t-2 border-t-slate-300">
        {#if waiting_for_pip}
          <div class="flex flex-col items-center justify-center">
            <Pulse
              size="60"
              color="#1F5082"
              unit="px"
              duration="1.5s"
            />
            <div class="font-mono text-slate-500 py-2">
              <p>Running pip...</p>
            </div>
          </div>
        {:else}
          <div class="flex flex-col justify-center">
            <div class="flex flex-row justify-center">
              <button
                type="button"
                class="m-4 px-6 py-2.5 bg-[#2D323B] text-lg text-slate-300 font-mono max-w-[10rem] flex-auto"
                on:click="{installPackage}">Install package</button>
              <input type="text" bind:value="{package_name}" placeholder="types-beautifulsoup4"
                class="
                    bg-slate-200
                    font-mono
                    text-black
                    m-4
                    flex-1
                    form-control
                    block
                    text-lg
                    w-full
                    px-3
                    py-1.5
                    bg-clip-padding
                    rounded
                    transition
                    ease-in-out
                    focus:bg-white focus:outline-none
              "/>
            </div>
            <div class="flex-auto">
              {@html piperror}
            </div>
            <div class="flex-auto">
              <h3>Installed packages:</h3>
              <ul>
                {#each Array.from(installed_packages) as installed_package}
                  <li>{installed_package}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
  <div class="bg-[#1F5082] flex flex-row justify-center">
    <button
    type="button"
    class="m-4 px-6 py-2.5 bg-[#2D323B] text-lg text-slate-300 font-mono max-w-[20rem] flex-auto"
    on:click|preventDefault="{runMypy}">Run mypy</button>
    <input type="text" bind:value="{flags}" placeholder="Mypy command line arguments go here..."
     class="
        bg-slate-200
        font-mono
        text-black
        m-4
        flex-1
        form-control
        block
        text-lg
        w-full
        px-3
        py-1.5
        bg-clip-padding
        rounded
        transition
        ease-in-out
        focus:bg-white focus:outline-none
      "/>
      <Modal
        show={$modal}
        classBg=""
        styleWindow={{ backgroundColor: '#1F5082', boxShadow: '0 2px 5px 0 rgba(0, 0, 0, 0.15)' }}
        styleCloseButton={{ backgroundColor: "rgb(203 213 225)", "border-color": "#2D323B"}}
      >
        <button class="m-4 px-6 py-2.5 bg-[#2D323B] text-lg text-slate-300 font-mono max-w-[20rem] flex-auto"
          on:click|preventDefault="{getShortUrl}"
        >Share</button>
      </Modal>
  </div>
</div>
{:catch error}
    <p>Uh-oh, an error occured! :( {error.toString()}</p>
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
  import { onMount } from "svelte";
  import { page } from '$app/stores';
  import { writable, type Writable } from 'svelte/store';
  import Modal, { bind } from 'svelte-simple-modal';
  import Popup from '$lib/components/Popup.svelte';
  const modal: Writable<string|null> = writable(null);
  const extensions = [
    history(),
    drawSelection(),
    lineNumbers(),
    keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
    ])
  ];
  let short = '';
  let worker: Worker | null = null;
  let convert = new Convert({newline: true});
  let output = "";
  let mypy_instance: any = undefined;
  let value = `def example(a: int, b: str) -> int:
    return a + b
`;
  let flags = "";
  let waiting_for_mypy = false;
  let package_name = "";
  let piperror = "";
  let waiting_for_pip = false;
  let installed_packages: Set<string> = new Set();
  onMount(async () => {
    const from = $page.url.searchParams.get("from");
    if (from != null) {
      const res = await fetch(
        `/short?from=${from}`,
        {
          method: 'GET',
        }
      );
      [flags, installed_packages, value] = await res.json();
      installed_packages = new Set(installed_packages);
      installed_packages.forEach(installed_package => {
        mypy_instance.installPackage(installed_package);
      });
    }
  })
  const loadPyodide = (async () => {
    const PythonWorker = await import('../lib/python.worker.ts?worker');
    worker = new PythonWorker.default();
    const MypyWebworker = Comlink.wrap(worker);
    // @ts-ignore
    mypy_instance = await new MypyWebworker();
    return await mypy_instance.ensurePyodideLoaded();
  })();
  async function getShortUrl() {
    let body = JSON.stringify([flags, Array.from(installed_packages), value]);
    const res = await fetch(
      `/short`,
      {
        method: 'POST',
        body: body,
      }
    );
    short = await res.text()
    modal.set(bind(Popup, {short: short}));
  }
  async function runMypy() {
    waiting_for_mypy = true;
    const tmpfile_path = "/tmp/test.py";
    await mypy_instance.writeFile(tmpfile_path, value);
    let args = await mypy_instance.splitFlags(flags);
    let [stdout, stderr, retcode] = await mypy_instance.runMypy([tmpfile_path, "--color-output", ...args]);
    console.log(retcode)
    waiting_for_mypy = false;
    output = convert.toHtml(stdout + stderr);
  }
  async function installPackage() {
    piperror = ""
    waiting_for_pip = true;
    const error = await mypy_instance.installPackage(package_name);
    if (error != null) {
      piperror = error;
    } else {
      // Assume if there was an error the package did not get installed correctly
      installed_packages.add(package_name);
    }
    package_name = ""
    waiting_for_pip = false;
  }
</script>
