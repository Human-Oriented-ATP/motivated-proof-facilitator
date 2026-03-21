import { z } from 'zod'

/** A basic statement within the proof state
 *  written in natural language interspersed with [Typst](https://typst.app/) formulas
 *  enclosed within dollar quotes ($ ... $).
 * 
 * Examples are:
 * - "$f$ is injective"
 * - "$G$ is abelian"
 * - "$x^2 + 1$ is an irreducible polynomial over $RR$"
 */
export const AtomicStatementSchema = z.string().describe(`A basic statement within the proof state written in natural language interspersed with [Typst](https://typst.app/) formulas enclosed within dollar quotes ($ ... $). 
Some examples are:
- "$f$ is injective"
- "$G$ is abelian"
- "$x^2 + 1$ is an irreducible polynomial over $RR$

When expressions contain infix operators, it becomes difficult for Typst to recognize sequences of symbols that form a single mathematical expression. In such cases, it is recommended to use parentheses to group the expression together, for example, $x = (a + b + c)$ instead of $x = a + b + c$.
"

Atomic statements usually express a single fact, with a preference for a higher-level description over a lower level one.`)
export type AtomicStatement = z.infer<typeof AtomicStatementSchema>

/** A variable in the proof state.
 *  The description contains the type information of the variable.
 * 
 * Examples are:
 * - { name: "n", description: "$NN$" }
 * - { name: "G", description: "$#text[Group]$" }
 * - { name: "f", description: "$A -> B$" }
 */
export const VariableSchema = z.object({
  name: z.string().describe("The name of the variable. This should be a single letter or a short word surrounded by dollar quotes."),
  description: AtomicStatementSchema.describe(`The type information of the variable. 
  For type variables, use "$#text[Type]", and for propositions, use "$#text[Proposition]$".
  Avoid phrases such as "element of" or "belongs to" in the type signature; they are understood.
  Avoid making the types too complicated. It is always better to introduce extra hypotheses rather than having a complicated type.
  Surround text in $#text[...]$ and use [Typst](https://typst.app/) syntax within dollar quotes ($ ... $).`)
}).describe(`Some examples are:
 - { name: "n", description: "$NN$" }
 - { name: "G", description: "$#text[Group]$" }
 - { name: "f", description: "$A -> B$" }
 `)
export type Variable = z.infer<typeof VariableSchema>

/**
 * A variable in a proof context can either be a
 * - *free variable*: a variable that is assumed to be arbitrary but fixed
 * - *meta variable*: a variable that is to be instantiated later
 * - *let variable*: a variable that is defined to be a specific value
 */
export const ContextVariableSchema = VariableSchema.extend({
  kind: z.enum(["free", "meta", "let"]).describe(
    "Variable kind: free (arbitrary but fixed), meta (to be instantiated), or let (defined value)."
  ),
  value: AtomicStatementSchema.describe(
    "For let variables: the defined value. For free/meta variables: use empty string."
  ),
}).superRefine((variable, ctx) => {
  const hasValue = variable.value.trim().length > 0

  if (variable.kind === "let" && !hasValue) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: "value is required when kind is let",
    })
  }

  if (variable.kind !== "let" && hasValue) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "value must be empty when kind is free or meta",
    })
  }
})

export type ContextVariable = z.infer<typeof ContextVariableSchema>

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

export const StatementSchema: z.ZodType<Statement> = z.lazy(() => z.union([
  AtomicStatementSchema,
  z.object({
    kind: z.literal("conjunction"),
    statements: z.array(StatementSchema)
  }),
  z.object({
    kind: z.literal("disjunction"),
    statements: z.array(StatementSchema)
  }),
  z.object({
    kind: z.literal("negation"),
    statement: StatementSchema
  }),
  z.object({
    kind: z.literal("implication"),
    antecedent: StatementSchema,
    consequent: StatementSchema
  }),
  z.object({
    kind: z.literal("equivalence"),
    left: StatementSchema,
    right: StatementSchema
  }),
  z.object({
    kind: z.literal("universal"),
    variable: VariableSchema,
    statement: StatementSchema
  }),
  z.object({
    kind: z.literal("existential"),
    variable: VariableSchema,
    statement: StatementSchema
  }),
  z.object({
    kind: z.literal("highlight"),
    statement: StatementSchema
  }).describe(`This is an obsolete field, do not use it.`)
])).describe(`Combinations of atomic statements using logical connectives. 
It is always preferable to use a higher-level description of a statement (like "$f$ is injective") over a lower-level one (like 
\`{ kind: "universal", variable: { name: "x", description: "$A$" }, statement: 
  { kind: "universal", variable: { name: "y", description: "$A$" }, statement:
  { kind: "implication", antecedent: "$f(x) = f(y)$", consequent: "$x = y$" }}}\'.`)

export const LabelledStatementSchema = z.object({
  label: z.string().describe("A label for the statement. This should be a short string written in snake case that uniquely identifies the statement."),
  statement: StatementSchema
}).describe(`A statement with a label.`)
export type LabelledStatement = z.infer<typeof LabelledStatementSchema>

/**
 * A proof state context consists of a list of variables 
 * involved in the proof, hypotheses concerning them
 * and goals to be proved.
 * 
 * There may be multiple proof contexts in one proof state.
 */
export const ProofStateContextSchema = z.object({
  variables: z.array(ContextVariableSchema).describe("The variables involved in the proof context. The order in which they appear signifies their dependency order."),
  hypotheses: z.array(LabelledStatementSchema).describe("Facts about the variables involved in the proof context. Hypothesis statements should ideally avoid expressing information that is already implicit in the type signatures of the variables (for example, \"$n$ is an integer\" is an unncessary hypothesis if the variable $n$ has type $ZZ$)."),
  goals: z.array(LabelledStatementSchema).describe("Statements that need to be proved. Goal statements should ideally avoid expressing information that is already implicit in the type signatures of the variables (for example, \"$n$ is an integer\" is an unncessary goal if the variable $n$ has type $ZZ$).")
}).describe(`A proof state context consists of a list of variables involved in the proof, hypotheses concerning them and goals to be proved. 
There may be multiple proof contexts in one proof state.`)
export type ProofStateContext = z.infer<typeof ProofStateContextSchema>

/**
 * A proof state is the main datastructure that the user interacts with when building a proof.
 * It is made up of one or more proof contexts, each consisting of 
 * a list of variables involved in the proof, hypotheses concerning them
 * and goals to be proved.
 */
export const ProofStateSchema = z.array(ProofStateContextSchema).describe(`A proof state is the main datastructure that the user interacts with when building a proof. It is made up of one or more proof contexts, each consisting of a list of variables involved in the proof, hypotheses concerning them and goals to be proved.`)
export type ProofState = z.infer<typeof ProofStateSchema>

export const BundledProofStateSchema = z.object({
  proofState: ProofStateSchema
})
export type BundledProofState = z.infer<typeof BundledProofStateSchema>

/**
 * A proof state bundled together with an optional 
 * highlighted library statement that the user can reference.
 */
export const ProofStateWithLibraryResultSchema = BundledProofStateSchema.extend({
  libraryResult: LabelledStatementSchema.optional().describe(`In addition to the proof state, the user can also reference one library statement that is highlighted for them.`) 
}).describe(`A proof state bundled together with an optional highlighted library statement that the user can reference.`)
export type ProofStateWithLibraryResult = z.infer<typeof ProofStateWithLibraryResultSchema>