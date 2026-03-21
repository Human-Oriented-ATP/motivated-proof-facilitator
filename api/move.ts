export { default } from '../src/index'

/**

import express from 'express'
import bodyParser from "body-parser"
import cors from "cors"
import { MoveResponseSchema } from '../src/endpoints/Move'
import { generateText, Output } from 'ai'
import { MODELS } from '../src/endpoints/models'
import { ProofState } from '../src/core/ProofStateZod'
import { ProofStateSelection } from '../src/core/ProofStateSelectionContext'

const app = express()

app.use(cors())
app.use(bodyParser.json())

const runMove = async ({
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

  const maxRetries = 3;
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
- proofState: the updated proof state after applying the move`
        
        continue
      }
    }
  }

  // This is unreachable because we throw on final failure, but keeps control flow explicit.
  throw new Error("Failed to apply move after retries")
}

app.post("/api/move", async (req, res) => {
  const { proofState, move, selections } = req.body;
  if (!proofState) {
    console.error("no proof state provided")
    res.send("FAILED: no proof state provided")
    return
  }
  if (!move) {
    console.error("no move provided")
    res.send("FAILED: no move provided")
    return
  }
  try {
    console.log("applying move...", move)
    const result = await runMove({ proofState, move, selections })
    res.send(result)
    console.log("move applied", result.reasoning)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

*/