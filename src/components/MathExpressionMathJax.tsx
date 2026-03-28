import React, { JSX, useEffect, useMemo, useRef, useState } from "react"
import { SubExpressionCore, SubExpressionCoreWithIndex } from "../core/SubExpression"
import {
  ProofStateSelectionContext,
  StatementAddress,
  ProofStateLocationContext,
  areStatementAddressesEqual,
} from "../core/ProofStateSelectionContext"
import { areProofStateIdsEqual, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"

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
          // Wait until tex2svg is available (same readiness check as standalone)
          const check = () => {
            const mj = window.MathJax as any
            if (mj.tex2svg) {
              resolve()
            } else {
              setTimeout(check, 50)
            }
          }
          check()
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
// MathJax SVG DOM node mapping (replaces custom LatexParser)
// ---------------------------------------------------------------------------
// MathJax's SVG output contains nested <g data-mml-node="kind"> elements
// that mirror its internal parse tree — we walk this tree directly.
// No custom LaTeX parser needed!

type SvgNodeMapping = {
  svgElement: Element
  kind: string
  latex: string
  depth: number
  children: SvgNodeMapping[]
  parent: SvgNodeMapping | null
  uid: number
  isVirtual?: boolean  // true for injected equation-side nodes
}

let _nextMappingUid = 0

/**
 * After building the tree, find matched parentheses/brackets among a node's
 * children and inject virtual grouping nodes so Alt+click can step through
 * parenthesized sub-expressions (e.g. a → (a+b) → (a+b)(a-b) → full expr).
 */
function injectParenGroups(allMappings: SvgNodeMapping[]) {
  const CLOSE_FOR: Record<string, string> = { "(": ")", "[": "]", "{": "}" }
  const OPEN_CHARS = new Set(Object.keys(CLOSE_FOR))

  // Work on a snapshot so we don't iterate newly-added virtual nodes
  const snapshot = [...allMappings]

  for (const p of snapshot) {
    if (p.children.length < 3) continue

    // Find matched paren groups among p's direct children
    const groups: { start: number; end: number }[] = []
    const stack: { char: string; idx: number }[] = []

    for (let i = 0; i < p.children.length; i++) {
      const c = p.children[i]!
      if (c.kind !== "mo") continue
      const txt = extractText(c.svgElement)
      if (OPEN_CHARS.has(txt)) {
        stack.push({ char: txt, idx: i })
      } else if (txt === ")" || txt === "]" || txt === "}") {
        for (let j = stack.length - 1; j >= 0; j--) {
          if (CLOSE_FOR[stack[j]!.char] === txt) {
            groups.push({ start: stack[j]!.idx, end: i })
            stack.splice(j, 1)
            break
          }
        }
      }
    }

    for (const { start, end } of groups) {
      if (end - start < 2) continue // empty parens ()
      // Skip if group spans ALL children (would just duplicate parent)
      if (start === 0 && end === p.children.length - 1) continue

      const groupChildren = p.children.slice(start, end + 1)

      const virtualMapping: SvgNodeMapping = {
        svgElement: groupChildren[0]!.svgElement,
        kind: "mrow",
        latex: groupChildren.map(c => c.latex).join(" "),
        depth: p.depth + 0.3,
        children: groupChildren,
        parent: p,
        uid: _nextMappingUid++,
        isVirtual: true,
      }

      for (const child of groupChildren) {
        child.parent = virtualMapping
      }

      allMappings.push(virtualMapping)
    }
  }
}

/**
 * After building the tree, find nodes whose children contain an = sign,
 * and insert virtual "equation-side" parent nodes so that Alt+click can
 * expand to "left side" or "right side" before reaching the full expression.
 */
function injectEquationSideParents(allMappings: SvgNodeMapping[]) {
  const EQ_CHARS = new Set(["=", "\u2260", "\u2264", "\u2265"])

  // Find parent nodes that have an = among their direct children
  const parents = new Set<SvgNodeMapping>()
  for (const m of allMappings) {
    if (m.kind === "mo") {
      const txt = extractText(m.svgElement)
      if (m.parent && EQ_CHARS.has(txt)) {
        parents.add(m.parent)
      }
    }
  }

  for (const p of parents) {
    const eqIdx = p.children.findIndex(
      c => c.kind === "mo" && EQ_CHARS.has(extractText(c.svgElement)),
    )
    if (eqIdx <= 0 || eqIdx >= p.children.length - 1) continue

    const leftChildren = p.children.slice(0, eqIdx)
    const rightChildren = p.children.slice(eqIdx + 1)

    for (const side of [leftChildren, rightChildren]) {
      if (side.length < 2) continue // single-node side doesn't need grouping

      // Create a virtual SVG element that spans the side's bounding box
      // (we reuse the first child's element for getBoundingClientRect — 
      //  the highlight will use the actual element's bbox)
      const virtualMapping: SvgNodeMapping = {
        svgElement: side[0]!.svgElement,
        kind: "mrow",
        latex: side.map(c => c.latex).join(" "),
        depth: p.depth + 0.5,
        children: side,
        parent: p,
        uid: _nextMappingUid++,
        isVirtual: true,
      }

      // Re-parent: each child now points to the virtual node
      for (const child of side) {
        child.parent = virtualMapping
      }

      allMappings.push(virtualMapping)
    }
  }
}

function buildNodeTree(svgRoot: Element): SvgNodeMapping[] {
  const allMappings: SvgNodeMapping[] = []

  function walk(el: Element, depth: number, parent: SvgNodeMapping | null): SvgNodeMapping | null {
    const kind = el.getAttribute("data-mml-node")
    if (kind) {
      const mapping: SvgNodeMapping = {
        svgElement: el, kind, latex: "", depth, children: [], parent,
        uid: _nextMappingUid++,
      }
      allMappings.push(mapping)
      for (let i = 0; i < el.children.length; i++) {
        const child = walk(el.children[i]!, depth + 1, mapping)
        if (child) mapping.children.push(child)
      }
      mapping.latex = nodeToLatex(mapping)
      return mapping
    }
    for (let i = 0; i < el.children.length; i++) {
      const child = walk(el.children[i]!, depth, parent)
      if (child && parent) parent.children.push(child)
    }
    return null
  }

  walk(svgRoot, 0, null)

  // MathJax SVG sometimes places nodes OUTSIDE <g data-mml-node="math">.
  // Adopt all orphan nodes (parent=null, not the root math) into the math node.
  const mathNode = allMappings.find(m => m.kind === "math" && m.depth === 0)
  if (mathNode) {
    for (const m of allMappings) {
      if (m !== mathNode && m.parent === null) {
        m.parent = mathNode
        m.depth = 1
        mathNode.children.push(m)
      }
    }
    // Recompute math node's latex since it now has more children
    mathNode.latex = nodeToLatex(mathNode)
  }

  // Insert virtual "equation side" parent nodes for children split by = ≠ ≤ ≥
  // This lets Alt+click expand to "left side" / "right side" before reaching the root
  injectEquationSideParents(allMappings)

  // Insert virtual grouping nodes for matched parentheses/brackets
  // This lets Alt+click step through (a+b) before reaching the full side
  injectParenGroups(allMappings)

  return allMappings
}

function nodeToLatex(m: SvgNodeMapping): string {
  const { kind, children, svgElement } = m
  if (children.length === 0 || kind === "mi" || kind === "mn" || kind === "mo") {
    const text = extractText(svgElement)
    if (kind === "mo") return OPERATOR_MAP[text] ?? text
    if (kind === "mi") {
      // Check identifier map first, then operator map (∞ can appear as mi),
      // then common function names
      if (IDENTIFIER_MAP[text]) return IDENTIFIER_MAP[text]
      if (OPERATOR_MAP[text]) return OPERATOR_MAP[text]
      if (FUNCTION_NAMES.has(text)) return `\\${text}`
      return text
    }
    if (kind === "mn") return text
    if (kind === "mtext") return `\\text{${text}}`
    return text
  }
  const cl = children.map(c => c.latex)
  switch (kind) {
    case "math": case "semantics": case "TeXAtom": case "mpadded": case "mstyle":
      return cl.join("")
    case "mrow": return cl.join(" ")
    case "mfrac": return `\\frac{${cl[0] ?? ""}}{${cl[1] ?? ""}}`
    case "msup": return `{${cl[0] ?? ""}}^{${cl[1] ?? ""}}`
    case "msub": return `{${cl[0] ?? ""}}_{${cl[1] ?? ""}}`
    case "msubsup": return `{${cl[0] ?? ""}}_{${cl[1] ?? ""}}^{${cl[2] ?? ""}}`
    case "msqrt": return `\\sqrt{${cl.join(" ")}}`
    case "mroot": return `\\sqrt[${cl[1] ?? ""}]{${cl[0] ?? ""}}`
    case "mover": return `\\overline{${cl[0] ?? ""}}`
    case "munder": return `\\underline{${cl[0] ?? ""}}`
    case "munderover": return `{${cl[0] ?? ""}}_{${cl[1] ?? ""}}^{${cl[2] ?? ""}}`
    case "mspace": return "\\,"
    default: return cl.join(" ")
  }
}

function extractText(el: Element): string {
  const glyphs = el.querySelectorAll("[data-c]")
  if (glyphs.length > 0) {
    return Array.from(glyphs)
      .map(g => {
        const hex = g.getAttribute("data-c")
        if (!hex) return ""
        const cp = parseInt(hex, 16)
        return normalizeMathChar(cp)
      })
      .join("")
  }
  return el.textContent?.trim() ?? ""
}

/**
 * Convert Unicode Mathematical Alphanumeric Symbols back to ASCII.
 * MathJax SVG uses these (e.g. U+1D44E = math italic 'a'), but
 * MathJax TeX input needs plain ASCII letters.
 */
function normalizeMathChar(cp: number): string {
  // Math Italic Capital A-Z: U+1D434..U+1D44D
  if (cp >= 0x1D434 && cp <= 0x1D44D) return String.fromCharCode(65 + cp - 0x1D434)
  // Math Italic Small a-z: U+1D44E..U+1D467 (with gap at h=U+1D455)
  if (cp >= 0x1D44E && cp <= 0x1D467) {
    if (cp === 0x1D455) return "h" // gap in Unicode, but just in case
    const offset = cp - 0x1D44E
    return String.fromCharCode(97 + offset)
  }
  // Planck constant ℎ (used for italic h)
  if (cp === 0x210E) return "h"
  // Math Bold Capital A-Z: U+1D400..U+1D419
  if (cp >= 0x1D400 && cp <= 0x1D419) return String.fromCharCode(65 + cp - 0x1D400)
  // Math Bold Small a-z: U+1D41A..U+1D433
  if (cp >= 0x1D41A && cp <= 0x1D433) return String.fromCharCode(97 + cp - 0x1D41A)
  // Math Bold Italic Capital A-Z: U+1D468..U+1D481
  if (cp >= 0x1D468 && cp <= 0x1D481) return String.fromCharCode(65 + cp - 0x1D468)
  // Math Bold Italic Small a-z: U+1D482..U+1D49B
  if (cp >= 0x1D482 && cp <= 0x1D49B) return String.fromCharCode(97 + cp - 0x1D482)
  // Everything else: return as-is
  return String.fromCodePoint(cp)
}

const OPERATOR_MAP: Record<string, string> = {
  "\u2264": "\\leq", "\u2265": "\\geq", "\u2260": "\\neq",
  "\u00B1": "\\pm", "\u00D7": "\\times", "\u00F7": "\\div",
  "\u22C5": "\\cdot", "\u2208": "\\in", "\u2282": "\\subset",
  "\u222A": "\\cup", "\u2229": "\\cap", "\u2192": "\\to",
  "\u21D2": "\\Rightarrow", "\u221E": "\\infty", "\u2202": "\\partial",
  "\u2207": "\\nabla", "\u2211": "\\sum", "\u220F": "\\prod", "\u222B": "\\int",
}

const IDENTIFIER_MAP: Record<string, string> = {
  "\u03B1": "\\alpha", "\u03B2": "\\beta", "\u03B3": "\\gamma",
  "\u03B4": "\\delta", "\u03B5": "\\epsilon", "\u03B8": "\\theta",
  "\u03BB": "\\lambda", "\u03BC": "\\mu", "\u03C0": "\\pi",
  "\u03C3": "\\sigma", "\u03C6": "\\phi", "\u03C8": "\\psi", "\u03C9": "\\omega",
}

// Common math function names that MathJax renders as mi but need \cmd in LaTeX
const FUNCTION_NAMES = new Set([
  "sin", "cos", "tan", "cot", "sec", "csc",
  "arcsin", "arccos", "arctan",
  "sinh", "cosh", "tanh", "coth",
  "log", "ln", "exp", "det", "dim", "ker", "hom",
  "lim", "sup", "inf", "max", "min", "arg", "deg",
  "gcd", "Pr",
])

// ---------------------------------------------------------------------------
// Helper: skip structural nodes when walking up the tree
// ---------------------------------------------------------------------------

const SKIP_KINDS = new Set(["TeXAtom", "mpadded", "mstyle", "semantics"])

function nextMeaningfulParent(m: SvgNodeMapping): SvgNodeMapping | null {
  let p = m.parent
  while (p && SKIP_KINDS.has(p.kind)) p = p.parent
  return p
}

// ---------------------------------------------------------------------------
// Helper: convert a mapping to selection text + source positions
// ---------------------------------------------------------------------------

function mappingToSelectionData(
  m: SvgNodeMapping,
  _latexSrc: string,
): { text: string; source_start: number; source_end: number } | null {
  const text = m.latex
  if (!text.trim()) return null
  // Use unique node ID to ensure each node has a distinct selection key
  // (avoids "select one x → all x's highlighted" bug)
  const source_start = -(m.uid + 1) * 1000
  return { text, source_start, source_end: source_start + text.length }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type MathExpressionProps = {
  address: StatementAddress
  index: number
  input: string
}

export function MathExpressionMathJax({ address, index, input }: MathExpressionProps): JSX.Element {
  const { selections, dispatch } = React.useContext(ProofStateSelectionContext)
  const proofStateLocation = React.useContext(ProofStateLocationContext)
  const proofStateId = React.useContext(ProofStateIdContext)

  const containerRef = useRef<HTMLSpanElement | null>(null)
  const [mjReady, setMjReady] = useState(false)
  const [allMappings, setAllMappings] = useState<SvgNodeMapping[]>([])
  const lastSelectedRef = useRef<SvgNodeMapping | null>(null)
  const [hovered, setHovered] = useState<SvgNodeMapping | null>(null)
  const [renderVersion, setRenderVersion] = useState(0)

  useEffect(() => {
    ensureMathJax().then(() => setMjReady(true)).catch(console.error)
  }, [])

  // Re-render whenever input changes
  // Use tex2svgPromise() (same as standalone 5175) instead of typeset() to get
  // properly nested data-mml-node attributes in the SVG tree.
  useEffect(() => {
    const el = containerRef.current
    if (!el || !mjReady) return

    const mj = window.MathJax as any
    const render = mj.tex2svgPromise ?? mj.tex2svg
    if (!render) return

    let cancelled = false

    // Clear previous content
    while (el.firstChild) el.removeChild(el.firstChild)

    const doRender = async () => {
      try {
        const mjxContainer = await Promise.resolve(render.call(mj, input, { display: false })) as HTMLElement
        if (cancelled || !el) return

        // Clear again in case of race condition
        while (el.firstChild) el.removeChild(el.firstChild)
        el.appendChild(mjxContainer)

        // Hide assistive MathML
        const assistive = el.querySelector("mjx-assistive-mml")
        if (assistive) (assistive as HTMLElement).style.display = "none"

        const svg = el.querySelector("svg")
        if (!svg) return
        svg.style.display = "inline-block"

        const mappings = buildNodeTree(svg as SVGSVGElement)
        setAllMappings(mappings)
        lastSelectedRef.current = null
        setHovered(null)
        setRenderVersion(v => v + 1)
      } catch (err) {
        console.error("[MathExpressionMathJax] render error:", err)
      }
    }
    doRender()

    return () => { cancelled = true }
  }, [input, mjReady])

  // ── Find smallest node at screen coordinates ──────────────────────────────

  function findSmallestAt(clientX: number, clientY: number): SvgNodeMapping | null {
    let best: SvgNodeMapping | null = null
    let bestArea = Infinity
    for (const m of allMappings) {
      if (SKIP_KINDS.has(m.kind)) continue
      const el = m.svgElement as SVGGraphicsElement
      let r: DOMRect
      try { r = el.getBoundingClientRect() } catch { continue }
      if (r.width <= 0 || r.height <= 0) continue
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        const a = r.width * r.height
        if (a < bestArea) { bestArea = a; best = m }
      }
    }
    return best
  }

  // ── Selection key helpers ─────────────────────────────────────────────────

  function selKeyFor(m: SvgNodeMapping): string | null {
    const data = mappingToSelectionData(m, input)
    if (!data) return null
    return `${data.source_start}:${data.source_end}`
  }

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

  function isMappingSelected(m: SvgNodeMapping): boolean {
    const key = selKeyFor(m)
    return key !== null && selectedKeys.has(key)
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  function handleMouseMove(e: React.MouseEvent) {
    setHovered(findSmallestAt(e.clientX, e.clientY))
  }

  function handleClick(e: React.MouseEvent) {
    if (!proofStateLocation) return

    let target: SvgNodeMapping | null = null
    let oldMapping: SvgNodeMapping | null = null

    if ((e.altKey || e.metaKey) && lastSelectedRef.current) {
      // Alt+click: walk up to next meaningful parent (same as standalone 5175)
      oldMapping = lastSelectedRef.current
      target = nextMeaningfulParent(lastSelectedRef.current)
    }

    if (!target) {
      // Normal click: find smallest node at click point
      target = findSmallestAt(e.clientX, e.clientY)
    }

    if (!target) return

    const data = mappingToSelectionData(target, input)
    if (!data) return

    e.preventDefault()
    e.stopPropagation()

    // For Alt+click expansion: remove old selection first (replace, not stack)
    if (oldMapping) {
      const oldData = mappingToSelectionData(oldMapping, input)
      if (oldData) {
        dispatch({
          type: "TOGGLE_SELECTION",
          selection: {
            proofStateId,
            location: proofStateLocation,
            address,
            selection: {
              text:         oldData.text,
              source_start: oldData.source_start,
              source_end:   oldData.source_end,
              index,
            } satisfies SubExpressionCoreWithIndex,
          },
        })
      }
    }

    lastSelectedRef.current = target

    dispatch({
      type: "TOGGLE_SELECTION",
      selection: {
        proofStateId,
        location: proofStateLocation,
        address,
        selection: {
          text:         data.text,
          source_start: data.source_start,
          source_end:   data.source_end,
          index,
        } satisfies SubExpressionCoreWithIndex,
      },
    })
  }

  // ── Highlight drawing (inside SVG — no vertical misalignment) ─────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const svg = el.querySelector("svg")
    if (!svg) return

    svg.querySelectorAll(".subexpr-hl").forEach(e => e.remove())

    const svgRect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    if (!vb || vb.width === 0 || vb.height === 0) return
    const sx = vb.width / svgRect.width
    const sy = vb.height / svgRect.height

    function drawHighlight(m: SvgNodeMapping, fill: string, stroke: string, strokeW: number) {
      let elR: DOMRect
      if (m.isVirtual) {
        // Virtual equation-side node — union bbox of all children
        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
        for (const child of m.children) {
          try {
            const cr = (child.svgElement as SVGGraphicsElement).getBoundingClientRect()
            if (cr.width <= 0 || cr.height <= 0) continue
            left = Math.min(left, cr.left)
            top = Math.min(top, cr.top)
            right = Math.max(right, cr.right)
            bottom = Math.max(bottom, cr.bottom)
          } catch { /* skip */ }
        }
        if (left >= right) return
        elR = new DOMRect(left, top, right - left, bottom - top)
      } else {
        elR = (m.svgElement as SVGGraphicsElement).getBoundingClientRect()
      }
      if (elR.width <= 0 || elR.height <= 0) return
      const padX = 5 * sx, padY = 8 * sy
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rect.setAttribute("x", String(vb!.x + (elR.left - svgRect.left) * sx - padX))
      rect.setAttribute("y", String(vb!.y + (elR.top - svgRect.top) * sy - padY))
      rect.setAttribute("width", String(elR.width * sx + padX * 2))
      rect.setAttribute("height", String(elR.height * sy + padY * 2))
      rect.setAttribute("rx", String(60 * sx))
      rect.setAttribute("fill", fill)
      rect.setAttribute("stroke", stroke)
      rect.setAttribute("stroke-width", String(strokeW))
      rect.setAttribute("pointer-events", "none")
      rect.setAttribute("class", "subexpr-hl")
      svg!.insertBefore(rect, svg!.firstChild)
    }

    // Blue highlights for selected mappings
    for (const m of allMappings) {
      if (isMappingSelected(m)) {
        drawHighlight(m, "rgba(59,130,246,0.2)", "rgba(59,130,246,0.55)", 1.5 * sx)
      }
    }
    // Yellow highlight for hover (if not already selected)
    if (hovered && !isMappingSelected(hovered)) {
      drawHighlight(hovered, "rgba(250,204,21,0.18)", "rgba(234,179,8,0.45)", 1.25 * sx)
    }
  })

  return (
    <span style={{ display: "inline-block", position: "relative", cursor: "pointer" }}>
      <span
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        onClick={handleClick}
        style={{ display: "inline-block", position: "relative" }}
      />
    </span>
  )
}
