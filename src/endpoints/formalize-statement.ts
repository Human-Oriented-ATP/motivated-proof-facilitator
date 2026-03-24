import { generateText, Output } from "ai"
import { MODELS } from "./models";
import { LabelledStatementSchema, ProofState } from "../core/ProofStateZod";

const FORMALIZE_STATEMENT_PROMPT: string = 
`
  Convert a natural language mathematical statement into a formal Statement object. 

  ## Task
  Parse the given natural language into the structured Statement schema format, using proper mathematical notation and logical structure. Use Typst for all mathematical notation.

  ## Context Handling
  - If proof state context is provided, use existing variable definitions and types
  - If no context provided, infer variable types from mathematical conventions
  - For ambiguous references without context, use standard mathematical interpretations

  ## Output Format
  Return a JSON object with the parsed Statement following the schema. Use Typst for all mathematical notation:
  - Atomic statements as strings with Typst notation ($x in NN$, $f: A -> B$)
  - Complex statements as structured objects (conjunction, implication, quantifiers, etc.)
  
  \`\`\`
  {
    label: "A label for the statement. This should be a short string written in snake case that uniquely identifies the statement.",
    statement: "A statement (see format details below)"
  }

  /** A basic statement within the proof state
   *  written in natural language interspersed with [Typst](https://typst.app/) formulas
   *  enclosed within dollar quotes ($ ... $).
   * 
   * Examples are:
   * - "The function $f$ is injective"
   * - "The group $G$ is abelian"
   * - "$x^2 + 1$ is an irreducible polynomial over $RR$"
   */
  type AtomicStatement = string

  /** A variable in the proof state.
   *  The description contains the type information of the variable.
   * 
   * Examples are:
   * - { name: "n", description: "$NN$" }
   * - { name: "G", description: "Group" }
   * - { name: "f", description: "$A -> B$" }
   */
  type Variable = {
    name: string
    description: AtomicStatement
  }

  /** A full statement involving multiple atomic statements joined by logical connectives. */
  type Statement =
    | AtomicStatement
    | { kind: "conjunction"; statements: Statement[] }
    | { kind: "disjunction"; statements: Statement[] }
    | { kind: "negation"   ; statement: Statement }
    | { kind: "implication"; antecedent: Statement; consequent: Statement }
    | { kind: "equivalence"; left: Statement; right: Statement }
    | { kind: "universal"  ; variable: Variable; statement: Statement }
    | { kind: "existential"; variable: Variable; statement: Statement }
    | { kind: "highlight"; statement: Statement }
  
  \`\`\`


  ## Mathematical Notation
  Use Typst syntax: $NN$, $ZZ$, $RR$, $forall$, $exists$, $subset$, $=>$, etc.

  ## Examples
  
  Input: "x is greater than 5"
  Output: "$x > 5$"
  Label: Simple inequality
  
  Input: "For every element in the group, its inverse exists"  
  Output: {"kind": "universal", "variable": {"name": "x", "description": "element of group"}, "statement": "$exists y in G, x * y = e$"}
  Label: universal_quantifier_with_group_theory

  Input: "A has size at least δN"
  Output: "$bar.v A bar.v gt.eq delta dot N$"
  Label: set_cardinality_with_parameters

  Input: "P is an arithmetic progression"
  Output: "$P$ is an arithmetic progression"
  Label: simple_predicate

  Input: "There are infinitely many primes that are two apart"
  Output: {"kind": "universal", "variable": {"name": "$n$", "description": "$NN$"}, "statement": {"kind": "existential", "variable": {"name": "$p$", "description": "prime number"}, "statement": {"kind": "conjunction", "statements": ["$p > n$", "$p + 2$ is prime"]}}}
  Label: twin_primes_conjecture

  Input: "The fundamental group of a graph is free"
  Output: {"kind": "universal", "variable": {"name": "$G$", "description": "graph"}, "statement": "$pi_1(G)$ is free"}
  Label: topological_property

  Input: "x^n + y^n = z^n"
  Output: "$x^n + y^n = z^n$"
  Label: simple_equation

  Input: "For all n > 2 and natural numbers x,y,z, if x^n + y^n = z^n then xyz = 0"
  Output: {"kind": "universal", "variable": {"name": "$n$", "description": "$NN$"}, "statement": {"kind": "universal", "variable": {"name": "$x$", "description": "$NN$"}, "statement": {"kind": "universal", "variable": {"name": "$y$", "description": "$NN$"}, "statement": {"kind": "universal", "variable": {"name": "$z$", "description": "$NN$"}, "statement": {"kind": "implication", "antecedent": {"kind": "conjunction", "statements": ["$n > 2$", "$x^n + y^n = z^n$"]}, "consequent": "$x y z = 0$"}}}}}
  Label: fermats_last_theorem
`

export const formalizeStatement = async (
  naturalLanguageStatement: string,
  context?: ProofState
) => {
  console.log("formalizing statement with model", naturalLanguageStatement)
  const contextString = context ? 
    `\n\nCurrent proof context:\n${JSON.stringify(context, null, 2)}` : 
    ""
  
  return await generateText({
    model: MODELS.formalize_statement,
    system: FORMALIZE_STATEMENT_PROMPT,
    prompt: naturalLanguageStatement + contextString,
    output: Output.object({
      schema: LabelledStatementSchema
    })
  }) 
}