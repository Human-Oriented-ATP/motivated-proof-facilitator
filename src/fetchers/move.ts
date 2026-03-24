import { z } from "zod"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove.js"
import { ProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext.js"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod.js"

export type MoveRequest = {
  proofState: ProofState
  move: ProofDiscoveryMove
  selections: ProofStateSelectionWithPolarity[]
}

export const MoveResponseSchema = z.object({
  reasoning: z.string().describe("A clear reasoning trace explaining what the move is trying to accomplish, how it transforms the current proof state, and why this move makes sense in the context of proving the goal."),
  proofState: ProofStateSchema.describe("The updated proof state after applying the move.")
})

export type MoveResponse = z.infer<typeof MoveResponseSchema>

export async function runMove(req: MoveRequest): Promise<MoveResponse> {
  console.log('Applying move', req)
  const response = await fetch("/api/move", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req)
  })

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  
  console.log("Received move response:", response)

  return MoveResponseSchema.parse(await response.json())
}