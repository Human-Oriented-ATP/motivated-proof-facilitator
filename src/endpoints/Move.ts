import { z } from "zod"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod"
import { generateText, Output } from "ai"
import { MODELS } from "./models"

export const MoveResponseSchema = z.object({
  reasoning: z.string().describe("A clear reasoning trace explaining what the move is trying to accomplish, how it transforms the current proof state, and why this move makes sense in the context of proving the goal."),
  proofState: ProofStateSchema.describe("The updated proof state after applying the move.")
})

export type MoveResponse = z.infer<typeof MoveResponseSchema>

export const runMoveServer = async ({
  proofState,
  move,
  selections
}: {
  proofState: ProofState,
  move: string,
  selections?: ProofStateSelection[]
}): Promise<MoveResponse> => {
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

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: MODELS.move,
        system: enhancedMove,
        prompt: JSON.stringify(promptData),
        output: Output.object({
          schema: MoveResponseSchema
        }),
      });
      return result.output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Move attempt ${attempt} failed:`, errorMessage);
      
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
- proofState: the updated proof state after applying the move`;
        
        continue;
      }
      
      // If final attempt or non-discriminator error, throw
      throw error;
    }
  }

  // This is unreachable because we throw on final failure, but keeps control flow explicit.
  throw new Error("Failed to apply move after retries");
}

export async function runMove(
  proofState: ProofState,
  move: ProofDiscoveryMove,
  selections: ProofStateSelection[]
): Promise<MoveResponse> {
  const response = await fetch("/api/move", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proofState,
      move: JSON.stringify(move),
      selections
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  console.log("Received move response:", response)

  const data: unknown = await response.json()

  console.log("Received move response:", data)

  return MoveResponseSchema.parse(data)
}