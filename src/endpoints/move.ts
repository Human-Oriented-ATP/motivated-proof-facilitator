import { generateText, Output } from "ai"
import { MODELS } from "./models"
import { MoveRequest, MoveResponseSchema } from "../fetchers/move"

export const runMove = async (req: MoveRequest) => {
    console.log('Applying move', req)

    let enhancedMove = `${req.move}

In addition to applying the move, provide a clear reasoning trace explaining:
1. What the move is trying to accomplish
2. How it transforms the current proof state
3. Why this move makes sense in the context of proving the goal

Return the result as a JSON object with:
- reasoning: your reasoning process explaining the move
- proofState: the updated proof state after applying the move`;
    
    return await generateText({
        model: MODELS.move,
        system: enhancedMove,
        prompt: JSON.stringify({ proofState: req.proofState, selections: req.selections }, null, 2),
        output: Output.object({
          schema: MoveResponseSchema
        }),
        maxRetries: 3
    })
}