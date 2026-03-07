import { z } from "zod"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod"

export const MoveResponseSchema = z.object({
  reasoning: z.string().describe("A clear reasoning trace explaining what the move is trying to accomplish, how it transforms the current proof state, and why this move makes sense in the context of proving the goal"),
  proofState: ProofStateSchema.describe("The updated proof state after applying the move")
})

export type MoveResponse = z.infer<typeof MoveResponseSchema>

export async function queryMove(
  proofState: ProofState,
  move: ProofDiscoveryMove,
  selections: ProofStateSelection[]
): Promise<MoveResponse> {
  const response = await fetch("https://atp-backend-rygt.onrender.com/move", {
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

  const data: unknown = await response.json()
  return MoveResponseSchema.parse(data)
}