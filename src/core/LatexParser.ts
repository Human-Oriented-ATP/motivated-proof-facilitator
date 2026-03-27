/**
 * Minimal LaTeX math parser that produces an AST with source character offsets.
 *
 * Two passes:
 *  1. Structural pass  → nodes matching MathJax's `data-mml-node` types
 *  2. Infix-op pass    → adds `binop` nodes for arithmetic / relational operators
 *
 * The leaf sequence of the structural AST (via `getLeaves`) aligns with the
 * leaf `[data-mml-node]` sequence emitted by MathJax, enabling index-based
 * mapping from LaTeX source positions to rendered SVG bounding boxes.
 */

// ---- AST node types -------------------------------------------------------

export type LatexNode =
  | { kind: "mi"; text: string; start: number; end: number }
  | { kind: "mn"; text: string; start: number; end: number }
  | { kind: "mo"; text: string; start: number; end: number }
  | { kind: "mfrac"; num: LatexNode; den: LatexNode; start: number; end: number }
  | { kind: "msup"; base: LatexNode; sup: LatexNode; start: number; end: number }
  | { kind: "msub"; base: LatexNode; sub: LatexNode; start: number; end: number }
  | { kind: "msubsup"; base: LatexNode; sub: LatexNode; sup: LatexNode; start: number; end: number }
  | { kind: "msqrt"; body: LatexNode; start: number; end: number }
  | { kind: "mroot"; body: LatexNode; index: LatexNode; start: number; end: number }
  | { kind: "mrow"; children: LatexNode[]; start: number; end: number }
  | { kind: "mstyle"; children: LatexNode[]; start: number; end: number }
  | { kind: "mover"; base: LatexNode; over: LatexNode; start: number; end: number }
  | { kind: "munder"; base: LatexNode; under: LatexNode; start: number; end: number }
  | { kind: "munderover"; base: LatexNode; under: LatexNode; over: LatexNode; start: number; end: number }
  | { kind: "math"; body: LatexNode; start: number; end: number }
  | { kind: "TeXAtom"; children: LatexNode[]; start: number; end: number }
  | { kind: "mspace"; start: number; end: number }
  | { kind: "unknown"; text: string; start: number; end: number }
  /** Compound infix operator expression (added by the second pass). */
  | { kind: "binop"; op: string; left: LatexNode; right: LatexNode; start: number; end: number }

// ---- Leaf enumeration -----------------------------------------------------

/**
 * Return all leaf nodes (mi, mn, mo, mspace, unknown) of the given AST subtree
 * in depth-first pre-order.  This sequence matches the leaf `[data-mml-node]`
 * elements emitted by MathJax SVG output in the same order.
 */
export function getLeaves(node: LatexNode): LatexNode[] {
  switch (node.kind) {
    case "mi":
    case "mn":
    case "mo":
    case "mspace":
    case "unknown":
      return [node]
    case "math":      return getLeaves(node.body)
    case "mfrac":     return [...getLeaves(node.num), ...getLeaves(node.den)]
    case "msup":      return [...getLeaves(node.base), ...getLeaves(node.sup)]
    case "msub":      return [...getLeaves(node.base), ...getLeaves(node.sub)]
    case "msubsup":   return [...getLeaves(node.base), ...getLeaves(node.sub), ...getLeaves(node.sup)]
    case "msqrt":     return getLeaves(node.body)
    case "mroot":     return [...getLeaves(node.body), ...getLeaves(node.index)]
    case "mover":     return [...getLeaves(node.base), ...getLeaves(node.over)]
    case "munder":    return [...getLeaves(node.base), ...getLeaves(node.under)]
    case "munderover":return [...getLeaves(node.base), ...getLeaves(node.under), ...getLeaves(node.over)]
    case "mrow":
    case "mstyle":
    case "TeXAtom":   return node.children.flatMap(getLeaves)
    case "binop":     return [...getLeaves(node.left), ...getLeaves(node.right)]
  }
}

// ---- Full-tree enumeration (pre-order) ------------------------------------

/** Return every node in the subtree in depth-first pre-order. */
export function flattenNodes(node: LatexNode): LatexNode[] {
  const result: LatexNode[] = [node]
  switch (node.kind) {
    case "math":      result.push(...flattenNodes(node.body)); break
    case "mfrac":     result.push(...flattenNodes(node.num), ...flattenNodes(node.den)); break
    case "msup":      result.push(...flattenNodes(node.base), ...flattenNodes(node.sup)); break
    case "msub":      result.push(...flattenNodes(node.base), ...flattenNodes(node.sub)); break
    case "msubsup":   result.push(...flattenNodes(node.base), ...flattenNodes(node.sub), ...flattenNodes(node.sup)); break
    case "msqrt":     result.push(...flattenNodes(node.body)); break
    case "mroot":     result.push(...flattenNodes(node.body), ...flattenNodes(node.index)); break
    case "mover":     result.push(...flattenNodes(node.base), ...flattenNodes(node.over)); break
    case "munder":    result.push(...flattenNodes(node.base), ...flattenNodes(node.under)); break
    case "munderover":result.push(...flattenNodes(node.base), ...flattenNodes(node.under), ...flattenNodes(node.over)); break
    case "mrow":
    case "mstyle":
    case "TeXAtom":   node.children.forEach(c => result.push(...flattenNodes(c))); break
    case "binop":     result.push(...flattenNodes(node.left), ...flattenNodes(node.right)); break
  }
  return result
}

// ---- Operator-precedence restructuring ------------------------------------

/**
 * Operator precedence levels.  Lower number = binds more loosely (outermost).
 */
const PREC: Record<string, number> = {
  // Relations (outermost)
  "=": 10, "<": 10, ">": 10,
  "\\leq": 10, "\\geq": 10, "\\neq": 10, "\\approx": 10, "\\equiv": 10,
  "\\sim": 10, "\\simeq": 10, "\\cong": 10, "\\ll": 10, "\\gg": 10,
  "\\subset": 10, "\\subseteq": 10, "\\supset": 10, "\\supseteq": 10,
  "\\in": 10, "\\notin": 10, "\\ni": 10, "\\prec": 10, "\\succ": 10,
  "\\to": 10, "\\rightarrow": 10, "\\leftarrow": 10, "\\gets": 10,
  "\\Rightarrow": 10, "\\Leftarrow": 10,
  "\\Leftrightarrow": 10, "\\leftrightarrow": 10,
  "\\iff": 10, "\\implies": 10, "\\mapsto": 10,
  "\\perp": 10, "\\parallel": 10, "\\mid": 10, "\\nmid": 10,
  // Additive
  "+": 20, "-": 20,
  "\\oplus": 20, "\\ominus": 20, "\\vee": 20, "\\lor": 20, "\\cup": 20,
  // Multiplicative
  "\\cdot": 30, "\\times": 30, "\\otimes": 30, "\\wedge": 30, "\\land": 30,
  "\\cap": 30, "\\ast": 30, "\\star": 30, "\\circ": 30,
  "*": 30, "/": 30,
}

function moPrec(node: LatexNode): number {
  if (node.kind !== "mo") return -1
  return PREC[node.text] ?? -1
}

/**
 * Given a flat array of nodes (children of an mrow-level sequence), build
 * a left-associative infix-operator expression tree.
 *
 * Returns the original flat mrow when no binary operator is detected.
 */
export function restructureInfixOps(nodes: LatexNode[]): LatexNode {
  if (nodes.length === 0) return { kind: "mrow", children: [], start: 0, end: 0 }
  if (nodes.length === 1) return nodes[0]!

  // Find the rightmost occurrence of the LOWEST-precedence binary operator.
  // "Binary" means: not at index 0 or the last position (avoids treating
  // unary prefix -, + as binary).
  let minPrec = Infinity
  let splitIdx = -1

  for (let i = 1; i < nodes.length - 1; i++) {
    const prec = moPrec(nodes[i]!)
    if (prec >= 0 && prec <= minPrec) {
      minPrec = prec
      splitIdx = i   // rightmost at this level → left-associative
    }
  }

  if (splitIdx === -1) {
    // No binary operator → return as a flat mrow
    return {
      kind: "mrow",
      children: nodes,
      start: nodes[0]!.start,
      end: nodes[nodes.length - 1]!.end,
    }
  }

  const leftNodes = nodes.slice(0, splitIdx)
  const rightNodes = nodes.slice(splitIdx + 1)
  const opNode = nodes[splitIdx] as LatexNode & { kind: "mo" }

  const left = leftNodes.length === 1 ? leftNodes[0]! : restructureInfixOps(leftNodes)
  const right = rightNodes.length === 1 ? rightNodes[0]! : restructureInfixOps(rightNodes)

  return {
    kind: "binop",
    op: opNode.text,
    left,
    right,
    start: nodes[0]!.start,
    end: nodes[nodes.length - 1]!.end,
  }
}

// ---- Tokenizer ------------------------------------------------------------

type Token =
  | { type: "cmd"; value: string; start: number; end: number }
  | { type: "char"; value: string; start: number; end: number }
  | { type: "lbrace"; start: number; end: number }
  | { type: "rbrace"; start: number; end: number }
  | { type: "caret"; start: number; end: number }
  | { type: "underscore"; start: number; end: number }
  | { type: "eof"; start: number; end: number }

function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    if (src[i] === "\\") {
      const start = i++
      if (i >= src.length) { tokens.push({ type: "char", value: "\\", start, end: i }); break }
      if (/[a-zA-Z]/.test(src[i]!)) {
        let name = ""
        while (i < src.length && /[a-zA-Z]/.test(src[i]!)) name += src[i++]
        // Absorb trailing space after letter-only command names
        while (i < src.length && src[i] === " ") i++
        tokens.push({ type: "cmd", value: name, start, end: i })
      } else {
        tokens.push({ type: "cmd", value: src[i]!, start, end: i + 1 })
        i++
      }
    } else if (src[i] === "{") {
      tokens.push({ type: "lbrace", start: i, end: i + 1 }); i++
    } else if (src[i] === "}") {
      tokens.push({ type: "rbrace", start: i, end: i + 1 }); i++
    } else if (src[i] === "^") {
      tokens.push({ type: "caret", start: i, end: i + 1 }); i++
    } else if (src[i] === "_") {
      tokens.push({ type: "underscore", start: i, end: i + 1 }); i++
    } else if (/\s/.test(src[i]!)) {
      i++ // skip whitespace
    } else {
      tokens.push({ type: "char", value: src[i]!, start: i, end: i + 1 }); i++
    }
  }
  tokens.push({ type: "eof", start: i, end: i })
  return tokens
}

// ---- Parser ---------------------------------------------------------------

class Parser {
  private pos = 0
  constructor(private readonly tokens: Token[], private readonly src: string) {}

  peek(): Token { return this.tokens[this.pos] ?? { type: "eof", start: this.src.length, end: this.src.length } }
  consume(): Token { return this.tokens[this.pos++] ?? { type: "eof", start: this.src.length, end: this.src.length } }

  /** Parse a braced group or a single atom. */
  parseGroup(): LatexNode {
    const tok = this.peek()
    if (tok.type === "lbrace") {
      this.consume()
      const start = tok.start
      const children = this.parseList()
      const end = this.peek().type === "rbrace" ? this.consume().end : this.peek().start
      if (children.length === 1) return { ...children[0]!, start, end }
      return { kind: "mrow", children, start, end }
    }
    return this.parseAtom()
  }

  /** Parse sequence until } or eof. */
  parseList(): LatexNode[] {
    const children: LatexNode[] = []
    while (true) {
      const tok = this.peek()
      if (tok.type === "eof" || tok.type === "rbrace") break
      children.push(this.parseSubSup())
    }
    return children
  }

  /** Parse an atom then any ^ and/or _ suffixes. */
  parseSubSup(): LatexNode {
    let base = this.parseAtom()
    let sub: LatexNode | null = null
    let sup: LatexNode | null = null

    while (this.peek().type === "caret" || this.peek().type === "underscore") {
      const tok = this.consume()
      const arg = this.parseGroup()
      if (tok.type === "caret") sup = arg
      else sub = arg
    }

    if (sub && sup) return { kind: "msubsup", base, sub, sup, start: base.start, end: Math.max(sub.end, sup.end) }
    if (sup)        return { kind: "msup", base, sup, start: base.start, end: sup.end }
    if (sub)        return { kind: "msub", base, sub, start: base.start, end: sub.end }
    return base
  }

  /** Parse a single atom: command, letter, digit, or punctuation. */
  parseAtom(): LatexNode {
    const tok = this.consume()

    if (tok.type === "cmd") return this.parseCommand(tok)

    if (tok.type === "char") {
      const v = tok.value
      if (/[0-9]/.test(v)) {
        // Merge consecutive digits / decimal dot into one mn
        let text = v
        let end = tok.end
        while (true) {
          const peeked = this.peek()
          if (peeked.type !== "char" || !/[0-9.]/.test(peeked.value)) break
          const next = this.consume()
          if (next.type === "char") { text += next.value; end = next.end }
        }
        return { kind: "mn", text, start: tok.start, end }
      }
      if (/[a-zA-Z]/.test(v)) return { kind: "mi", text: v, start: tok.start, end: tok.end }
      return { kind: "mo", text: v, start: tok.start, end: tok.end }
    }

    if (tok.type === "lbrace") {
      const children = this.parseList()
      const end = this.peek().type === "rbrace" ? this.consume().end : this.peek().start
      if (children.length === 1) return children[0]!
      return { kind: "mrow", children, start: tok.start, end }
    }

    return { kind: "unknown", text: this.src.slice(tok.start, tok.end), start: tok.start, end: tok.end }
  }

  parseCommand(tok: { type: "cmd"; value: string; start: number; end: number }): LatexNode {
    const name = tok.value
    const start = tok.start

    switch (name) {
      // ── Structural commands (2 args) ──────────────────────────────────────
      case "frac": case "dfrac": case "tfrac": {
        const num = this.parseGroup()
        const den = this.parseGroup()
        return { kind: "mfrac", num, den, start, end: den.end }
      }
      case "binom": case "dbinom": {
        const top = this.parseGroup()
        const bot = this.parseGroup()
        return { kind: "mfrac", num: top, den: bot, start, end: bot.end }
      }
      case "overset": case "underset": {
        const over = this.parseGroup()
        const base = this.parseGroup()
        return name === "overset"
          ? { kind: "mover", base, over, start, end: base.end }
          : { kind: "munder", base, under: over, start, end: base.end }
      }
      // ── Structural commands (1 arg) ───────────────────────────────────────
      case "sqrt": {
        // Optional [n] index
        if (this.peek().type === "char" && (this.peek() as { value: string }).value === "[") {
          this.consume()
          const idxChildren = this.parseListUntil("]")
          const body = this.parseGroup()
          const index = idxChildren.length === 1
            ? idxChildren[0]!
            : { kind: "mrow" as const, children: idxChildren, start: idxChildren[0]?.start ?? start, end: idxChildren.at(-1)?.end ?? start }
          return { kind: "mroot", body, index, start, end: body.end }
        }
        const body = this.parseGroup()
        return { kind: "msqrt", body, start, end: body.end }
      }
      // Font / decoration commands (1 arg) → mstyle wrapper
      case "mathbf": case "mathit": case "mathrm": case "mathsf": case "mathtt":
      case "mathscr": case "mathfrak":
      case "boldsymbol": case "pmb":
      case "hat": case "bar": case "tilde": case "vec": case "dot": case "ddot":
      case "widehat": case "widetilde": case "overline": case "underline":
      case "overbrace": case "underbrace": case "overleftarrow": case "overrightarrow":
      case "mathop": case "operatorname": case "text": case "mbox": {
        const arg = this.parseGroup()
        return { kind: "mstyle", children: [arg], start, end: arg.end }
      }
      // mathcal / mathbb: the whole \mathcal{X} is one identifier
      case "mathcal": case "mathbb": {
        const arg = this.parseGroup()
        return { kind: "mi", text: this.src.slice(start, arg.end), start, end: arg.end }
      }
      // color macro (2 args: color name, content)
      case "color": {
        this.parseGroup() // color name — consume and ignore
        const arg = this.parseGroup()
        return { kind: "mstyle", children: [arg], start, end: arg.end }
      }

      // ── \left ... \right delimiters ───────────────────────────────────────
      case "left": {
        // Read the opening delimiter token (char or single-char cmd)
        const openTok = this.consume()
        const openDelim: LatexNode = {
          kind: "mo",
          text: openTok.type === "char" ? openTok.value : `\\${(openTok as { value: string }).value}`,
          start: openTok.start,
          end: openTok.end,
        }

        const children = this.parseListUntilRight()

        // Consume \right and its delimiter
        let closeDelim: LatexNode | null = null
        if (this.peek().type === "cmd" && (this.peek() as { value: string }).value === "right") {
          const rtStart = this.peek().start
          this.consume() // consume \right
          const closeTok = this.consume()
          closeDelim = {
            kind: "mo",
            text: closeTok.type === "char"
              ? closeTok.value
              : `\\${(closeTok as { value: string }).value}`,
            start: rtStart,
            end: closeTok.end,
          }
        }

        const allChildren: LatexNode[] = [openDelim, ...children, ...(closeDelim ? [closeDelim] : [])]
        return {
          kind: "mrow",
          children: allChildren,
          start,
          end: closeDelim?.end ?? children.at(-1)?.end ?? openDelim.end,
        }
      }
      case "right":
        // Consumed by the \left handler; if stray, return unknown
        return { kind: "unknown", text: "\\right", start, end: tok.end }

      // ── Spacing ───────────────────────────────────────────────────────────
      case ",": case ";": case "!": case ":": case " ":
      case "quad": case "qquad": case "enspace": case "thinspace":
        return { kind: "mspace", start, end: tok.end }

      // ── Big operators → mo ────────────────────────────────────────────────
      case "int": case "iint": case "iiint": case "iiiint": case "oint":
      case "sum": case "prod": case "coprod": case "bigcup": case "bigcap":
      case "bigoplus": case "bigotimes": case "bigsqcup": case "biguplus":
      case "lim": case "sup": case "inf": case "max": case "min":
      case "limsup": case "liminf": case "varlimsup": case "varliminf":
        return { kind: "mo", text: `\\${name}`, start, end: tok.end }

      // ── Relation operators → mo ───────────────────────────────────────────
      case "leq": case "geq": case "neq": case "approx": case "sim":
      case "simeq": case "equiv": case "cong": case "ll": case "gg":
      case "prec": case "succ": case "preceq": case "succeq":
      case "subset": case "supset": case "subseteq": case "supseteq":
      case "sqsubset": case "sqsupset": case "sqsubseteq": case "sqsupseteq":
      case "in": case "notin": case "ni": case "owns":
      case "perp": case "parallel": case "mid": case "nmid":
      case "models": case "vdash": case "dashv":
      case "to": case "from": case "rightarrow": case "leftarrow":
      case "Rightarrow": case "Leftarrow": case "Leftrightarrow": case "leftrightarrow":
      case "longrightarrow": case "longleftarrow": case "Longrightarrow": case "Longleftarrow":
      case "iff": case "implies": case "mapsto":
      case "nearrow": case "searrow": case "nwarrow": case "swarrow":
      case "hookleftarrow": case "hookrightarrow":
        return { kind: "mo", text: `\\${name}`, start, end: tok.end }

      // ── Binary operators → mo ─────────────────────────────────────────────
      case "cdot": case "cdots": case "ldots": case "vdots": case "ddots":
      case "times": case "div": case "pm": case "mp": case "ast": case "star":
      case "circ": case "bullet": case "diamond": case "triangleleft": case "triangleright":
      case "oplus": case "ominus": case "otimes": case "oslash": case "odot":
      case "cup": case "cap": case "setminus": case "sqcup": case "sqcap":
      case "vee": case "wedge": case "lor": case "land":
        return { kind: "mo", text: `\\${name}`, start, end: tok.end }

      // ── Delimiters / fences → mo ─────────────────────────────────────────
      case "langle": case "rangle": case "lceil": case "rceil": case "lfloor": case "rfloor":
      case "lvert": case "rvert": case "lVert": case "rVert":
      case "{": case "}":
        return { kind: "mo", text: `\\${name}`, start, end: tok.end }

      // ── Misc symbols → mo ─────────────────────────────────────────────────
      case "forall": case "exists": case "nexists": case "partial": case "nabla":
      case "infty": case "emptyset": case "varnothing": case "top": case "bot":
      case "neg": case "lnot": case "dagger": case "ddagger":
      case "angle": case "triangle": case "square":
        return { kind: "mo", text: `\\${name}`, start, end: tok.end }

      // ── Greek letters → mi ────────────────────────────────────────────────
      case "alpha": case "beta": case "gamma": case "delta": case "epsilon":
      case "varepsilon": case "zeta": case "eta": case "theta": case "vartheta":
      case "iota": case "kappa": case "lambda": case "mu": case "nu": case "xi":
      case "pi": case "varpi": case "rho": case "varrho": case "sigma":
      case "varsigma": case "tau": case "upsilon": case "phi": case "varphi":
      case "chi": case "psi": case "omega":
      case "Gamma": case "Delta": case "Theta": case "Lambda": case "Xi":
      case "Pi": case "Sigma": case "Upsilon": case "Phi": case "Psi": case "Omega":
        return { kind: "mi", text: `\\${name}`, start, end: tok.end }

      // ── Named functions → mi (rendered upright) ───────────────────────────
      case "exp": case "log": case "ln": case "sin": case "cos": case "tan":
      case "cot": case "sec": case "csc": case "arcsin": case "arccos": case "arctan":
      case "sinh": case "cosh": case "tanh": case "coth":
      case "det": case "dim": case "ker": case "rank": case "deg": case "gcd": case "lcm":
      case "Pr": case "Re": case "Im": case "arg": case "sgn": case "sign":
        return { kind: "mi", text: `\\${name}`, start, end: tok.end }

      // ── Misc identifiers / special → mi ──────────────────────────────────
      case "hbar": case "ell": case "wp":
        return { kind: "mi", text: `\\${name}`, start, end: tok.end }

      default:
        // Unknown command — treat as identifier
        return { kind: "mi", text: `\\${name}`, start, end: tok.end }
    }
  }

  /** Parse until a stopping character (e.g. "]") is found. */
  parseListUntil(stopChar: string): LatexNode[] {
    const children: LatexNode[] = []
    while (true) {
      const tok = this.peek()
      if (tok.type === "eof" || tok.type === "rbrace") break
      if (tok.type === "char" && tok.value === stopChar) { this.consume(); break }
      children.push(this.parseSubSup())
    }
    return children
  }

  /** Parse until \right (or eof / }) is encountered; does NOT consume it. */
  parseListUntilRight(): LatexNode[] {
    const children: LatexNode[] = []
    while (true) {
      const tok = this.peek()
      if (tok.type === "eof" || tok.type === "rbrace") break
      if (tok.type === "cmd" && tok.value === "right") break
      children.push(this.parseSubSup())
    }
    return children
  }
}

// ---- Public API ------------------------------------------------------------

/** Parse a LaTeX math expression and return the root AST node (kind: "math"). */
export function parseLatex(src: string): LatexNode & { kind: "math" } {
  const tokens = tokenize(src)
  const parser = new Parser(tokens, src)
  const children = parser.parseList()

  const body: LatexNode =
    children.length === 0 ? { kind: "mrow", children: [], start: 0, end: 0 }
    : children.length === 1 ? children[0]!
    : { kind: "mrow", children, start: children[0]!.start, end: children[children.length - 1]!.end }

  return { kind: "math", body, start: 0, end: src.length }
}
