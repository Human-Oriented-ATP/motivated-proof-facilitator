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
  reasoning: z.string().describe("A clear reasoning trace explaining what the move is trying to accomplish and how it transforms the current proof state, or, if the move is not applicable, why it cannot be applied."),
  proofState: ProofStateSchema.nullable().describe("The updated proof state, if the move was applied successfully, or an empty value if the move could not be applied.")
}).describe("The result of applying a move to a proof state. This can either be a new proof state resulting from a successful application of the move, together with a reasoning trace explaining how the move was applied in this scenario, or a reasoning trace explaining why the move could not be applied in this scenario, without an accompanying proof state.")

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