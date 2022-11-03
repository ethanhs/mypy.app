import { loadPyodide } from 'pyodide';
import * as Comlink from 'comlink';
import * as Sentry from '@sentry/browser';
import { logBreadcrumb } from '$lib/error';

Sentry.init({
	environment: `${import.meta.env.MODE}`,
	dsn: 'https://0439a0c382654a0782f092e6e8ab8e86@o4504090754351104.ingest.sentry.io/4504090756513792'
});

async function loadPyodideAndPackages(version = '0.21.2') {
	const pyodide = await loadPyodide({
		indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`
	});
	logBreadcrumb({ category: 'packages', message: 'Loaded pyodide', level: 'info' });
	await pyodide.loadPackage('micropip');
	let micropip = pyodide.pyimport('micropip');
	logBreadcrumb({ category: 'packages', message: 'Loaded micropip', level: 'info' });
	await micropip.install(['typing_extensions>=3.10', 'mypy_extensions>=0.4.3', 'tomli>=1.1.0']);
	await pyodide.loadPackage(
		'/mypy-0.980+dev.36709e317890623feb0b2d81b02fff8ae4346b2d.dirty-cp310-cp310-emscripten_3_1_14_wasm32.whl'
	);
	logBreadcrumb({ category: 'packages', message: 'Loaded mypy', level: 'info' });
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
		Sentry.addBreadcrumb({
			category: 'data',
			message: `Writing file to ${location}`,
			level: 'info'
		});
		const pyodide = await pyodidePromise;
		pyodide.FS.writeFile(location, input);
	}

	public async runMypy(args: string[]): Promise<[string, string, number]> {
		const pyodide = await pyodidePromise;
		const mypy_api = pyodide.pyimport('mypy.api');
		Sentry.addBreadcrumb({
			category: 'mypy',
			message: `Running mypy with args ${args.join(' ')}`,
			level: 'info'
		});
		return mypy_api.run(pyodide.toPy(args)).toJs();
	}

	public async splitFlags(flags: string): Promise<string[]> {
		const pyodide = await pyodidePromise;
		const shlex = pyodide.pyimport('shlex');
		return shlex.split(pyodide.toPy(flags)).toJs();
	}

	public async installPackage(package_name: string): Promise<string | null> {
		const pyodide = await pyodidePromise;
		let micropip = pyodide.pyimport('micropip');
		try {
			await micropip.install(package_name);
		} catch (error) {
			if (error instanceof pyodide.PythonError) {
				return error.toString();
			} else {
				throw error;
			}
		}
		logBreadcrumb({
			category: 'packages',
			message: `Successfully installed package ${package_name}`,
			level: 'info'
		});
		return null;
	}
}

Comlink.expose(MypyWebworkerInterface);

export {};
