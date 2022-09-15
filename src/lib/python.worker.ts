import { loadPyodide } from "pyodide";
import * as Comlink from "comlink";

async function loadPyodideAndPackages(version = "0.21.2") {
    const pyodide = await loadPyodide({indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`});
    console.log("Loaded pyodide");
    await pyodide.loadPackage("micropip")
    let micropip = pyodide.pyimport("micropip");
    console.log("Loaded micropip");
    await micropip.install([
        "typing_extensions>=3.10",
        "mypy_extensions>=0.4.3",
        "tomli>=1.1.0",
    ]);
    await pyodide.loadPackage("/mypy-0.980+dev.36709e317890623feb0b2d81b02fff8ae4346b2d.dirty-cp310-cp310-emscripten_3_1_14_wasm32.whl")
    return pyodide;
}

const pyodidePromise = loadPyodideAndPackages();

class MypyWebworkerInterface {

    /**
     * ensurePyodideLoaded
     * calls await loadPyodideandPackages
     */
    public async ensurePyodideLoaded() {
        await pyodidePromise;
    }

    // Writes input to the location in the Emscripten FS
    public async writeFile(location: string, input: string) {
        const pyodide = await pyodidePromise;
        pyodide.FS.writeFile(location, input);
    }

    public async runMypy(args: string[]): Promise<[string, string, number]> {
        const pyodide = await pyodidePromise;
        const mypy_api = pyodide.pyimport("mypy.api");
        return mypy_api.run(pyodide.toPy(args)).toJs();
    }

    public async splitFlags(flags: string): Promise<string[]> {
        const pyodide = await pyodidePromise;
        const shlex = pyodide.pyimport("shlex");
        return shlex.split(pyodide.toPy(flags)).toJs()
    }

    public async installPackage(package_name: string): Promise<string|null> {
        const pyodide = await pyodidePromise;
        let micropip = pyodide.pyimport("micropip");
        try {
            await micropip.install(package_name);
        } catch (error) {
            if (error instanceof pyodide.PythonError) {
                return error.toString();
            } else {
                throw error;
            }
        }
        console.log(`Successfully installed ${package_name}.`)
        return null;
        
    }
    
}

Comlink.expose(MypyWebworkerInterface);

export {};
