import { z } from 'zod'

/** A basic statement within the proof state
 *  written in natural language interspersed with [Typst](https://typst.app/) formulas
 *  enclosed within dollar quotes ($ ... $).
 * 
 * Examples are:
 * - "The function $f$ is injective"
 * - "The group $G$ is abelian"
 * - "$x^2 + 1$ is an irreducible polynomial over $RR$"
 */
export const AtomicStatementSchema = z.string()
export type AtomicStatement = z.infer<typeof AtomicStatementSchema>

/** A variable in the proof state.
 *  The description contains the type information of the variable.
 * 
 * Examples are:
 * - { name: "n", description: "$NN$" }
 * - { name: "G", description: "Group" }
 * - { name: "f", description: "$A -> B$" }
 */
export const VariableSchema = z.object({
  name: z.string(),
  description: AtomicStatementSchema
})
export type Variable = z.infer<typeof VariableSchema>

/**
 * A variable in a proof context can either be a
 * - *free variable*: a variable that is assumed to be arbitrary but fixed
 * - *meta variable*: a variable that is to be instantiated later
 * - *let variable*: a variable that is defined to be equal to a specific value
 */
export const ContextVariableSchema = z.intersection(
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("free") }),
    z.object({ kind: z.literal("meta") }),
    z.object({ kind: z.literal("let"), value: AtomicStatementSchema })
  ]),
  VariableSchema
)
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
  })
]))

export const LabelledStatementSchema = z.object({
  label: z.string(),
  statement: StatementSchema
})
export type LabelledStatement = z.infer<typeof LabelledStatementSchema>

/**
 * A proof state context consists of a list of variables 
 * involved in the proof, hypotheses concerning them
 * and goals to be proved.
 * 
 * There may be multiple proof contexts in one proof state.
 */
export const ProofStateContextSchema = z.object({
  variables: z.array(ContextVariableSchema),
  hypotheses: z.array(LabelledStatementSchema),
  goals: z.array(LabelledStatementSchema)
})
export type ProofStateContext = z.infer<typeof ProofStateContextSchema>

/**
 * A proof state is the main datastructure that the user interacts with when building a proof.
 * It is made up of one or more proof contexts, each consisting of 
 * a list of variables involved in the proof, hypotheses concerning them
 * and goals to be proved.
 */
export const ProofStateSchema = z.array(ProofStateContextSchema)
export type ProofState = z.infer<typeof ProofStateSchema>