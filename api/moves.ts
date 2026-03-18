import { generateText, Output } from "ai"
import { ProofState, ProofStateSchema } from "./proofState"
import { MODELS } from "./models"
import { z } from "zod"

const MoveResponseSchema = z.object({
  reasoning: z.string().describe("A clear reasoning trace explaining what the move is trying to accomplish, how it transforms the current proof state, and why this move makes sense in the context of proving the goal"),
  proofState: ProofStateSchema.describe("The updated proof state after applying the move")
})

export const runMove = async ({
  proofState,
  move,
  selections
}: {
  proofState: ProofState,
  move: string,
  selections?: any
}) => {
  console.log('Applying move', move)
  const promptData = {
    proofState,
    ...(selections && { selections })
  };
  
  let enhancedMove = `${move}

CRITICAL: Every variable in the returned proofState MUST include a "kind" field with one of these values:
- "free": For variables assumed to be arbitrary but fixed (most common)
- "meta": For variables to be instantiated later  
- "let": For variables defined to have a specific value (requires "value" field)

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
        model: MODELS.moves.model,
        system: enhancedMove,
        prompt: JSON.stringify(promptData),
        output: Output.object({
          schema: MoveResponseSchema
        }),
      });
      return result;
    } catch (error) {
      console.log(`Move attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries && error.message.includes('discriminator')) {
        // Add more specific instructions about the kind field for retry
        enhancedMove = `${move}

ERROR CORRECTION: Your previous response failed validation.

MANDATORY REQUIREMENT: Every single variable in the proofState.variables array MUST have a "kind" field:
- Use "free" for most variables (arbitrary but fixed)
- Use "meta" for variables to be instantiated later
- Use "let" for variables with specific values (also requires "value" field)

Example correct format:
{
  "variables": [
    {"name": "a", "description": "$ZZ$", "kind": "free"},
    {"name": "b", "description": "$ZZ$", "kind": "free"}
  ],
  ...
}

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
}