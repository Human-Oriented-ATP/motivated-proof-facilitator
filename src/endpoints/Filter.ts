import { z } from "zod"
import { ProofState } from "../core/ProofStateZod"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"

export const FilterResponseSchema = z.object({
  meetsCondition: z.boolean(),
  reasoning: z.string()
})

export type FilterResponse = z.infer<typeof FilterResponseSchema>

export async function checkMoveValidity(proofState: ProofState, selections: ProofStateSelection[], move: ProofDiscoveryMove, signal?: AbortSignal): Promise<FilterResponse> {
    const response = await fetch("/api/filter", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            proofState,
            selections,
            triggerCriterion: move.trigger
        }),
        ...(signal && { signal }),
      })

    console.log("Received filter response:", response)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`)
    }

    const data: unknown = await response.json()

    console.log("Received filter data:", data)

    return FilterResponseSchema.parse(data)
}