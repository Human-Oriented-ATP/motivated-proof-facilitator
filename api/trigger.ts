import { generateText, Output } from "ai"
import { MODELS } from "./models"
import { z } from "zod"
import { ProofState } from "./proofState"

const TacticName = z.enum([
  "logical-strengthening",
  "logical-weakening", 
  "instantiation-simplest",
  "extrapolation",
  "library-extraction",
  "type-generalization",
  "term-abstraction"
])

const TriggerResponseSchema = z.object({
  applicable_tactics: z.array(z.object({
    tactic: TacticName,
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
  }))
})

type TriggerResponse = z.infer<typeof TriggerResponseSchema>

const TRIGGER_PROMPT = `
Analyze the given proof state and determine which mathematical reasoning tactics should be applied.

You have access to these 7 tactics:
1. logical-strengthening: Replace statements with stronger logical versions
2. logical-weakening: Replace statements with weaker versions that may be easier to prove  
3. instantiation-simplest: Suggest concrete instantiations using simplest examples
4. extrapolation: Identify patterns and suggest general formulas from specific cases
5. library-extraction: Suggest relevant theorems and definitions from mathematical libraries
6. type-generalization: Generalize or specialize mathematical types and structures
7. term-abstraction: Abstract complex terms to reveal general patterns

For each tactic that could be applicable, provide:
- The tactic name
- A confidence score (0.0 to 1.0) indicating how promising this tactic seems
- Clear reasoning for why this tactic is relevant to the current proof state

Consider:
- Current hypotheses and how they might be manipulated
- Goal structure and what transformations might help
- Variable types and available mathematical structures
- Patterns in the mathematical statements
- Complexity of expressions that might benefit from abstraction

Only suggest tactics that have clear potential to advance the proof. Order by confidence (highest first).
`

export const triggerTactics = async (proofState: ProofState): Promise<TriggerResponse> => {
  console.log("analyzing proof state for applicable tactics...", {
    model: MODELS.suggest.model,
    prompt: TRIGGER_PROMPT,
    proofState: proofState
  })
  
  const result = await generateText({
    model: MODELS.suggest.model, // Use the fast model for trigger analysis
    system: TRIGGER_PROMPT,
    prompt: JSON.stringify(proofState, null, 2),
    output: Output.object({
      schema: TriggerResponseSchema
    }),
  })
  
  return result.output
}

export type { TriggerResponse, TacticName }