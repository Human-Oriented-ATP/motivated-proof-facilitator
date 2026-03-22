import { generateText, Output } from "ai"
import { MODELS } from "./models"
import { ProofState } from "../core/ProofStateZod"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"
import { MoveResponseSchema } from "../fetchers/move"

export const runMove = async ({
  proofState,
  move,
  selections
}: {
  proofState: ProofState,
  move: string,
  selections?: ProofStateSelection[]
}) => {
  console.log('Applying move', move)
  const promptData = {
    proofState,
    ...(selections && { selections })
  };
  
  let enhancedMove = `${move}

In addition to applying the move, provide a clear reasoning trace explaining:
1. What the move is trying to accomplish
2. How it transforms the current proof state
3. Why this move makes sense in the context of proving the goal

Return the result as a JSON object with:
- reasoning: your reasoning process explaining the move
- proofState: the updated proof state after applying the move`;

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: MODELS.move,
        system: enhancedMove,
        prompt: JSON.stringify(promptData),
        output: Output.object({
          schema: MoveResponseSchema
        })
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`Move attempt ${attempt} failed:`, errorMessage)
      
      if (attempt < maxRetries && errorMessage.includes('discriminator')) {
        // Add more specific instructions about the kind field for retry
        enhancedMove = `${move}

ERROR CORRECTION: Your previous response failed validation.

In addition to applying the move, provide a clear reasoning trace explaining:
1. What the move is trying to accomplish
2. How it transforms the current proof state
3. Why this move makes sense in the context of proving the goal

Return the result as a JSON object with:
- reasoning: your reasoning process explaining the move
- proofState: the updated proof state after applying the move`
        
        continue
      }
    }
  }

  // This is unreachable because we throw on final failure, but keeps control flow explicit.
  throw new Error("Failed to apply move after retries")
}