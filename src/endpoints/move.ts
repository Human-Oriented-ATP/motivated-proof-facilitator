import { generateText, Output } from "ai"
import { MODELS } from "./models.js"
import { MoveRequest, MoveResponseSchema } from "../fetchers/move.js"

const MOVE_PROMPT =
`
You are provided with the current proof state, some selections within it, and a proposed move that transforms this proof state in some way.

Your task is to either
- apply the move to the proof state, producing a new proof state that reflects the transformation specified by the move's action, along with a clear reasoning trace explaining what the move is trying to accomplish and how it transforms the current proof state, OR
- determine that the move is not applicable in the current context, providing a clear explanation of why it cannot be applied.

Please take into careful consideration of the mathematical content and structure of the proof state, the nature of the selections, and the specifics of the move's action.

If the move can be applied, return a JSON object with the following structure:
\`\`\`json
{
  "reasoning": "A clear reasoning trace explaining what the move is trying to accomplish and how it transforms the current proof state",
  "proofState": { ... the updated proof state after applying the move ... }
}
\`\`\`

If the move cannot be applied, return a JSON object with the following structure:
\`\`\`json
{
  "reasoning": "A clear explanation of why the move cannot be applied in the current context"
}
\`\`\`

Be precise and thorough in your analysis, considering both the mathematical meaning and structural properties of the proof state and the move.
`

export const runMove = async (req: MoveRequest) => {
    console.log('Applying move', req)

    return await generateText({
        model: MODELS.move,
        system: MOVE_PROMPT,
        prompt: JSON.stringify(req, null, 2),
        output: Output.object({
          schema: MoveResponseSchema
        }),
        maxRetries: 3
    })
}