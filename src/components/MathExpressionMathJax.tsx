import React, { JSX, useEffect, useMemo, useRef, useState } from "react"
import { SubExpressionCore, SubExpressionCoreWithIndex } from "../core/SubExpression"
import {
  ProofStateSelectionContext,
  StatementAddress,
  ProofStateLocationContext,
  areStatementAddressesEqual,
} from "../core/ProofStateSelectionContext"
import { areProofStateIdsEqual, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import {
  LatexNode,
  parseLatex,
  getLeaves,
  flattenNodes,
  restructureInfixOps,
} from "../core/LatexParser"

// ---------------------------------------------------------------------------
// MathJax CDN loader (once per page)
// ---------------------------------------------------------------------------

type MathJaxInstance = {
  typeset: (elements: HTMLElement[]) => void
  startup: { promise: Promise<void>; defaultReady: () => void }
}

declare global {
  interface Window { MathJax: MathJaxInstance & Record<string, unknown> }
}

let mathJaxLoadPromise: Promise<void> | null = null

function ensureMathJax(): Promise<void> {
  if (mathJaxLoadPromise) return mathJaxLoadPromise
  mathJaxLoadPromise = new Promise((resolve, reject) => {
    ;(window as unknown as Record<string, unknown>)["MathJax"] = {
      tex: {
        inlineMath: [["$", "$"]],
        packages: { "[+]": ["ams", "boldsymbol"] },
      },
      svg: { fontCache: "global" },
      startup: {
        ready() {
          window.MathJax.startup.defaultReady()
          resolve()
        },
      },
    }
    const s = document.createElement("script")
    s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
    s.async = true
    s.onerror = () => reject(new Error("Failed to load MathJax"))
    document.head.appendChild(s)
  })
  return mathJaxLoadPromise
}

// ---------------------------------------------------------------------------
// Rendered sub-expression record
// ---------------------------------------------------------------------------

export type MathJaxSubExpression = SubExpressionCore & {
  /** Bounding rect in pixels, relative to the container element's top-left. */
  x: number; y: number; width: number; height: number
  /** Pre-computed area for hit-testing (width × height). */
  area: number
  /** The corresponding AST node (for depth ordering & parent lookup). */
  node: LatexNode
}

// ---------------------------------------------------------------------------
// Sub-expression extraction
// ---------------------------------------------------------------------------

type Rect = { x: number; y: number; x2: number; y2: number }

/** Union of two rects. */
function unionRect(a: Rect, b: Rect): Rect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x2), y2: Math.max(a.y2, b.y2) }
}

/**
 * Walk the SVG and build a list of selectable sub-expressions.
 *
 * Algorithm:
 *  1. Parse LaTeX → structural AST (mirrors MathJax's MML tree)
 *  2. Collect leaf nodes from both:
 *       • original structural AST  (for source positions)
 *       • SVG [data-mml-node] leaves  (for bounding boxes)
 *     and map them pairwise by DFS order.
 *  3. Build a `bboxByStart` map: source_start → client bounding rect.
 *  4. For every AST node (structural + operator-precedence compound nodes),
 *     compute its bounding box as the UNION of all leaves whose source span
 *     falls within the node's [start, end].  This gives correct bboxes for
 *     compound expressions like `a + b` even though they have no direct SVG
 *     wrapper element.
 *  5. Deduplicate by (source_start, source_end) and discard empty boxes.
 */
function extractSubExpressions(
  svgEl: SVGSVGElement,
  latexSrc: string,
): MathJaxSubExpression[] {
  // ── 1. Parse ──────────────────────────────────────────────────────────────
  const ast = parseLatex(latexSrc)

  // ── 2. Gather all selectable AST nodes ───────────────────────────────────
  // Start with every node from the structural parse.
  const structuralNodes = flattenNodes(ast)

  // Add compound infix-operator nodes (e.g. binop for "a + b").
  // We apply restructureInfixOps to the top-level sequence only — deep
  // nesting is already structural (e.g. \frac already groups its args).
  const topLevel = ast.body.kind === "mrow" ? ast.body.children
                 : ast.body.kind === "math"  ? [ast.body]
                 : [ast.body]
  const exprTree = topLevel.length > 1 ? restructureInfixOps(topLevel) : null
  const compoundNodes = exprTree ? flattenNodes(exprTree) : []

  // Merge, deduplicate by span key.
  const bySpan = new Map<string, LatexNode>()
  for (const n of [...structuralNodes, ...compoundNodes]) {
    const key = `${n.start}:${n.end}`
    if (!bySpan.has(key)) bySpan.set(key, n)
  }
  const allNodes = Array.from(bySpan.values())

  // ── 3. Leaf-to-SVG-element mapping ───────────────────────────────────────
  const astLeaves = getLeaves(ast)

  // SVG leaves = [data-mml-node] elements that contain no nested [data-mml-node]
  const allMmlEls = Array.from(svgEl.querySelectorAll("[data-mml-node]"))
  const svgLeaves = allMmlEls.filter(el => !el.querySelector("[data-mml-node]"))

  const containerRect = svgEl.getBoundingClientRect()

  // source_start → client rect (relative to container)
  const bboxByStart = new Map<number, Rect>()
  const count = Math.min(astLeaves.length, svgLeaves.length)
  for (let i = 0; i < count; i++) {
    const leaf = astLeaves[i]!
    const el = svgLeaves[i]!
    try {
      const r = (el as SVGGraphicsElement).getBoundingClientRect()
      if (r.width > 0 || r.height > 0) {
        bboxByStart.set(leaf.start, {
          x:  r.left - containerRect.left,
          y:  r.top  - containerRect.top,
          x2: r.right  - containerRect.left,
          y2: r.bottom - containerRect.top,
        })
      }
    } catch { /* element not yet laid out */ }
  }

  // ── 4. Compute bboxes and build results ───────────────────────────────────
  const result: MathJaxSubExpression[] = []

  for (const node of allNodes) {
    const { start, end } = node
    if (start >= end) continue  // degenerate span

    // Union of all leaf bboxes whose span falls within this node's span
    let box: Rect | null = null
    for (const leaf of astLeaves) {
      if (leaf.start >= start && leaf.end <= end) {
        const b = bboxByStart.get(leaf.start)
        if (b) box = box ? unionRect(box, b) : { ...b }
      }
    }
    if (!box) continue

    const w = box.x2 - box.x
    const h = box.y2 - box.y
    if (w <= 0 || h <= 0) continue

    result.push({
      text: latexSrc.slice(start, end),
      source_start: start,
      source_end: end,
      syntaxTree: node,
      x: box.x, y: box.y, width: w, height: h,
      area: w * h,
      node,
    })
  }

  // Sort by area ascending so hit-testing can stop early
  result.sort((a, b) => a.area - b.area)
  return result
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type MathExpressionProps = {
  address: StatementAddress
  index: number
  /** Raw LaTeX math string (no surrounding $ signs). */
  input: string
}

/**
 * Renders a LaTeX math expression via MathJax and supports interactive
 * sub-expression selection.
 *
 * **Hover** — yellow highlight on the smallest expression under the cursor.
 * **Click** — toggles selection (blue highlight) dispatched to
 *   `ProofStateSelectionContext` with `text`, `source_start`, `source_end`,
 *   `syntaxTree`, and `index`.
 * **Alt/Option + Click** — expands to the next-larger enclosing expression
 *   (e.g. click `+` to select `a + b` instead of just `+`).
 *
 * Any expression recognised by the LaTeX parser is selectable, including
 * composite infix expressions such as `a + b` within `a + b = c`.
 */
export function MathExpressionMathJax({ address, index, input }: MathExpressionProps): JSX.Element {
  const { selections, dispatch } = React.useContext(ProofStateSelectionContext)
  const proofStateLocation = React.useContext(ProofStateLocationContext)
  const proofStateId = React.useContext(ProofStateIdContext)

  const containerRef = useRef<HTMLSpanElement | null>(null)
  const [mjReady, setMjReady] = useState(false)
  const [subExprs, setSubExprs] = useState<MathJaxSubExpression[]>([])
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  // Tracks how many times the component has been successfully typeset
  const [renderVersion, setRenderVersion] = useState(0)

  // Load MathJax once globally
  useEffect(() => {
    ensureMathJax().then(() => setMjReady(true)).catch(console.error)
  }, [])

  // Re-typeset whenever the input changes and MathJax is ready
  useEffect(() => {
    const el = containerRef.current
    if (!el || !mjReady || !window.MathJax?.typeset) return

    el.innerHTML = `$${input}$`
    window.MathJax.typeset([el])

    // Extract sub-expressions after the next paint (geometry is settled)
    requestAnimationFrame(() => {
      const svg = el.querySelector("svg")
      if (!svg) return
      // MathJax already writes vertical-align on the SVG's style attribute,
      // which correctly aligns the baseline with surrounding text.
      svg.style.display = "inline-block"

      const exprs = extractSubExpressions(svg as SVGSVGElement, input)
      setSubExprs(exprs)
      setRenderVersion(v => v + 1)
    })
  }, [input, mjReady])

  // ── Hit testing ────────────────────────────────────────────────────────────

  function candidatesAt(relX: number, relY: number): MathJaxSubExpression[] {
    // subExprs is already sorted by area ascending
    return subExprs.filter(
      s => relX >= s.x && relX <= s.x + s.width && relY >= s.y && relY <= s.y + s.height,
    )
  }

  function toRelative(e: React.MouseEvent): { x: number; y: number } | null {
    const el = containerRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // ── Selected spans (by source position key) ────────────────────────────────

  const selectedKeys = useMemo<Set<string>>(() => {
    const set = new Set<string>()
    if (!proofStateLocation) return set
    selections.forEach(sel => {
      if (!areProofStateIdsEqual(sel.proofStateId, proofStateId)) return
      if (sel.location.kind !== proofStateLocation.kind) return
      if (sel.location.label !== proofStateLocation.label) return
      if (!areStatementAddressesEqual(sel.address, address)) return
      if ((sel.selection as SubExpressionCoreWithIndex).index !== index) return
      const s = sel.selection as SubExpressionCore
      set.add(`${s.source_start}:${s.source_end}`)
    })
    return set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, proofStateId, proofStateLocation, address, index, renderVersion])

  function isSelected(s: MathJaxSubExpression) {
    return selectedKeys.has(`${s.source_start}:${s.source_end}`)
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  function handleMouseMove(e: React.MouseEvent) {
    const pos = toRelative(e)
    if (!pos) return
    // Show the smallest expression under the cursor
    const cands = candidatesAt(pos.x, pos.y)
    setHoverIdx(cands.length > 0 ? subExprs.indexOf(cands[0]!) : null)
  }

  function handleClick(e: React.MouseEvent) {
    if (!proofStateLocation) return
    const pos = toRelative(e)
    if (!pos) return

    const cands = candidatesAt(pos.x, pos.y)
    if (cands.length === 0) return

    let target: MathJaxSubExpression

    if (e.altKey || e.metaKey) {
      // Alt/⌥ + click: expand to the NEXT-LARGER enclosing expression.
      // Find the smallest candidate that is strictly larger than the
      // currently selected expression at this location (if any).
      const currentlySelectedIdx = cands.findIndex(isSelected)
      target = currentlySelectedIdx >= 0 && currentlySelectedIdx + 1 < cands.length
        ? cands[currentlySelectedIdx + 1]!
        : cands[1] ?? cands[0]!
    } else {
      // Regular click: select smallest
      target = cands[0]!
    }

    e.preventDefault()
    e.stopPropagation()

    dispatch({
      type: "TOGGLE_SELECTION",
      selection: {
        proofStateId,
        location: proofStateLocation,
        address,
        selection: {
          text:         target.text,
          source_start: target.source_start,
          source_end:   target.source_end,
          syntaxTree:   target.node,
          index,
        } satisfies SubExpressionCoreWithIndex,
      },
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedExprs = subExprs.filter(isSelected)
  const hoverExpr = hoverIdx !== null ? subExprs[hoverIdx] ?? null : null
  const hoverIsAlsoSelected = hoverExpr ? isSelected(hoverExpr) : false

  return (
    <span style={{ display: "inline-block", position: "relative", cursor: "pointer" }}>
      {/* MathJax renders into this span */}
      <span
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={handleClick}
        style={{ display: "inline-block", position: "relative" }}
      />

      {/* Highlight overlay (SVG positioned over the rendered math) */}
      {subExprs.length > 0 && (
        <svg
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            pointerEvents: "none", overflow: "visible",
          }}
        >
          {/* Blue: selected sub-expressions */}
          {selectedExprs.map((s, i) => (
            <rect
              key={`sel-${i}`}
              x={s.x - 1} y={s.y - 1} width={s.width + 2} height={s.height + 2}
              rx={2} ry={2}
              fill="rgba(59,130,246,0.2)"
              stroke="rgba(59,130,246,0.55)"
              strokeWidth={1.5}
            />
          ))}
          {/* Yellow: hover (skip if already blue) */}
          {hoverExpr && !hoverIsAlsoSelected && (
            <rect
              x={hoverExpr.x - 1} y={hoverExpr.y - 1} width={hoverExpr.width + 2} height={hoverExpr.height + 2}
              rx={2} ry={2}
              fill="rgba(250,204,21,0.18)"
              stroke="rgba(234,179,8,0.45)"
              strokeWidth={1.25}
            />
          )}
        </svg>
      )}
    </span>
  )
}
