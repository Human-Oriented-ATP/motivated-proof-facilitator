/** A basic statement within the proof state
 *  written in natural language interspersed with [Typst](https://typst.app/) formulas
 *  enclosed within dollar quotes ($ ... $).
 * 
 * Examples are:
 * - "The function $f$ is injective"
 * - "The group $G$ is abelian"
 * - "$x^2 + 1$ is an irreducible polynomial over $RR$"
 */
export type AtomicStatement = string

/** A variable in the proof state.
 *  The description contains the type information of the variable.
 * 
 * Examples are:
 * - { name: "n", description: "$NN$" }
 * - { name: "G", description: "Group" }
 * - { name: "f", description: "$A -> B$" }
 */
export type Variable = {
  name: string
  description: AtomicStatement
}

/**
 * A variable in a proof context can either be a
 * - *free variable*: a variable that is assumed to be arbitrary but fixed
 * - *meta variable*: a variable that is to be instantiated later
 * - *let variable*: a variable that is defined to be equal to a specific value
 */
export type ContextVariable = 
  ({ kind: "free" } | { kind: "meta" } | { kind: "let", value: AtomicStatement }) & Variable

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

export type LabelledStatement = {
  label: string
  statement: Statement
}

/**
 * A proof state context consists of a list of variables 
 * involved in the proof, hypotheses concerning them
 * and goals to be proved.
 * 
 * There may be multiple proof contexts in one proof state.
 */
export type ProofStateContext = {
  variables: ContextVariable[]
  hypotheses: LabelledStatement[]
  goals: LabelledStatement[]
}

/**
 * A proof state is the main datastructure that the user interacts with when building a proof.
 * It is made up of one or more proof contexts, each consisting of 
 * a list of variables involved in the proof, hypotheses concerning them
 * and goals to be proved.
 */
export type ProofState = ProofStateContext[]

