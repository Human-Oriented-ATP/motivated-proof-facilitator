/** A basic statement within the proof state
 *  written in natural language interspersed with LaTeX-like formulas
 *  enclosed within dollar quotes ($ ... $).
 * 
 * Examples are:
 * - "The function $f$ is injective"
 * - "The group $G$ is abelian"
 * - "$x^2 + 1$ is an irreducible polynomial over $\mathbb{R}$"
 */
export type AtomicStatement = string

/** A variable in the proof state.
 *  The description contains the type information of the variable.
 * 
 * Examples are:
 * - { name: "$n$", description: "$\mathbb{N}$" }
 * - { name: "$G$", description: "Group" }
 * - { name: "$f$", description: "$A \to B$" }
 */
export type Variable = {
  name: string
  description: AtomicStatement
}

/** A full statement involving multiple atomic statements joined by logical connectives. */
export type Statement =
  | AtomicStatement
  | { kind: "conjunction"; statements: Statement[] }
  | { kind: "disjunction"; statements: Statement[] }
  | { kind: "negation"   ; statement: Statement }
  | { kind: "implication"; antecedent: Statement; consequent: Statement }
  | { kind: "equivalence"; left: Statement; right: Statement }
  | { kind: "universal"  ; variable: Variable; statement: Statement }
  | { kind: "existential"; variable: Variable; statement: Statement }
  | { kind: "highlight"; statement: Statement }
