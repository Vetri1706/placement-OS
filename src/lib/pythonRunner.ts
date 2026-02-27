type Pyodide = {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => any;
  };
};

declare global {
  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<Pyodide>;
    __pyodide__?: Pyodide;
    __pyodideLoading__?: Promise<Pyodide>;
  }
}

const PYODIDE_VERSION = "0.25.1";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-pyodide="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any).__loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load script")));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.pyodide = src;
    script.addEventListener("load", () => {
      (script as any).__loaded = true;
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    document.head.appendChild(script);
  });
}

export async function getPyodide(): Promise<Pyodide> {
  if (window.__pyodide__) return window.__pyodide__;
  if (window.__pyodideLoading__) return window.__pyodideLoading__;

  window.__pyodideLoading__ = (async () => {
    // Ensure loader is present
    if (!window.loadPyodide) {
      await loadScript(`${PYODIDE_INDEX_URL}pyodide.js`);
    }

    if (!window.loadPyodide) {
      throw new Error("Pyodide loader did not initialize");
    }

    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    window.__pyodide__ = pyodide;
    return pyodide;
  })();

  return window.__pyodideLoading__;
}

function toPlainJs(value: any): unknown {
  if (value && typeof value === "object" && typeof value.toJs === "function") {
    try {
      return value.toJs({ dict_converter: Object.fromEntries });
    } catch {
      return value.toJs();
    }
  }
  return value;
}

export async function runPythonSolve(userCode: string, input: unknown): Promise<unknown> {
  const pyodide = await getPyodide();

  // Provide input as JSON string to avoid PyProxy conversion issues.
  pyodide.globals.set("___input_json", JSON.stringify(input ?? null));

  const harness = [
    "import json",
    "__input = json.loads(___input_json)",
    "__result = solve(__input)",
  ].join("\n");

  const fullCode = `${userCode}\n\n${harness}\n`;

  await pyodide.runPythonAsync(fullCode);
  const result = pyodide.globals.get("__result");
  return toPlainJs(result);
}
