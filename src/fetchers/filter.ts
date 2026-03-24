import { z } from "zod"
import { ProofState } from "../core/ProofStateZod.js"
import { ProofStateSelection } from "../core/ProofStateSelectionContext.js"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove.js"

export interface FilterRequest {
    proofState: ProofState
    selections: ProofStateSelection[]
    name: string
    triggerCriterion: string
}

export const FilterResponseSchema = z.object({
  meetsCondition: z.boolean(),
  reasoning: z.string()
})

export type FilterResponse = z.infer<typeof FilterResponseSchema>

export async function checkMoveValidity(
      req: FilterRequest, 
      signal?: AbortSignal): Promise<FilterResponse> {
    const response = await fetch("/api/filter", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req, null, 2),
        ...(signal && { signal }),
    })

    console.log("Received filter response:", response)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    return FilterResponseSchema.parse(await response.json())
}