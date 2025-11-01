import React, { useEffect, useRef, useState } from "react";

type Subexpression = {
  text: string;
  source_start: number;
  source_end: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function App() {
  const [input, setInput] = useState("(52)/9");
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subexprs, setSubexprs] = useState<Subexpression[]>([]);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const wasmRef = useRef<any>(null);

  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    async function loadWasm() {
      try {
        // Assumes pkg files are served from /pkg in public folder
        const mod = await import("../pkg/typst_wasm.js");
        await mod.default();
        mod.init_panic_hook?.();
        wasmRef.current = { compile: mod.compile_math_with_subexpressions };
        setWasmLoaded(true);
      } catch (e: any) {
        setError("Failed to load WASM: " + (e?.message ?? e));
      }
    }
    loadWasm();
  }, []);

  async function renderMath() {
    if (!wasmRef.current) {
      setError("WASM not loaded");
      return;
    }
    setError(null);
    try {
      const result = wasmRef.current.compile(input);
      const data = JSON.parse(result);
      if (data.error) {
        setError(data.error);
        return;
      }
      setSubexprs(data.subexpressions || []);
      // inject SVG markup
      const svgHolder = svgContainerRef.current;
      if (svgHolder) {
        svgHolder.innerHTML = data.svg;
        // configure overlay viewBox/size to match rendered svg
        const svg = svgHolder.querySelector("svg");
        const overlay = overlayRef.current;
        if (svg && overlay) {
          const vb = svg.getAttribute("viewBox");
          if (vb) overlay.setAttribute("viewBox", vb);
          const w = svg.getAttribute("width");
          const h = svg.getAttribute("height");
          if (w) overlay.setAttribute("width", w);
          if (h) overlay.setAttribute("height", h);
        }
      }
    } catch (e: any) {
      setError("Render error: " + (e?.message ?? e));
    }
  }

  function clearOverlay() {
    const overlay = overlayRef.current;
    if (overlay) overlay.innerHTML = "";
    setHighlightIndex(null);
  }

  function highlight(i: number) {
    const sub = subexprs[i];
    const overlay = overlayRef.current;
    if (!sub || !overlay) return;
    overlay.innerHTML = ""; // clear
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(sub.x));
    rect.setAttribute("y", String(sub.y));
    rect.setAttribute("width", String(sub.width));
    rect.setAttribute("height", String(sub.height));
    rect.setAttribute("fill", "rgba(0,120,255,0.3)");
    overlay.appendChild(rect);
    setHighlightIndex(i);
  }

  function findSmallestAtPoint(x: number, y: number) {
    let idx = -1;
    let bestArea = Infinity;
    subexprs.forEach((s, i) => {
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
        const area = s.width * s.height;
        if (area < bestArea) {
          bestArea = area;
          idx = i;
        }
      }
    });
    return idx;
  }

  function handleMouseMove(e: React.MouseEvent) {
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const vb = svgEl.viewBox?.baseVal;
    if (!vb) return;
    const scaleX = vb.width / rect.width;
    const scaleY = vb.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX + vb.x;
    const mouseY = (e.clientY - rect.top) * scaleY + vb.y;
    const idx = findSmallestAtPoint(mouseX, mouseY);
    if (idx >= 0 && idx !== highlightIndex) highlight(idx);
    if (idx < 0 && highlightIndex != null) clearOverlay();
  }

  return (
    <div style={{ padding: 20, color: "#d4d4d4", background: "#1e1e1e", minHeight: "100vh" }}>
      <h1>Typst Math Subexpression Viewer</h1>
      <div>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") renderMath();
          }}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
        <button onClick={renderMath} style={{ marginTop: 8 }}>
          Render
        </button>
      </div>

      {error && <div style={{ color: "#f48771", marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 12, position: "relative", background: "#2d2d2d", padding: 20 }}>
        <div
          id="svg-container"
          ref={svgContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={clearOverlay}
          style={{ display: "inline-block", position: "relative" }}
        />
        <svg
          ref={overlayRef}
          style={{ position: "absolute", top: 20, left: 20, pointerEvents: "none" }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Subexpressions</h3>
        {subexprs.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => highlight(i)}
            onMouseLeave={() => clearOverlay()}
            style={{
              background: i === highlightIndex ? "#0e639c" : "#3e3e3e",
              padding: 8,
              marginTop: 6,
              fontFamily: "monospace",
            }}
          >
            &quot;{s.text}&quot; [{s.source_start}-{s.source_end}] @ ({s.x.toFixed(1)},{s.y.toFixed(1)}){" "}
            {s.width.toFixed(1)}x{s.height.toFixed(1)}
          </div>
        ))}
      </div>
    </div>
  );
}