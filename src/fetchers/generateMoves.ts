import { z } from "zod"
import { ProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod"

export interface GenerateMovesRequest { 
    proofState: ProofState
    selections: ProofStateSelectionWithPolarity[]
}

export const GenerateMoveResponseSchema = z.object({
    name: z.string().describe("The name of the move."),
    proofState: ProofStateSchema.describe("The new proof state resulting from applying the move."),
    reasoning: z.string().describe("A brief and clear explanation of why the move is relevant and applicable and the decisions that went into producing the new proof state.")
})

export type GenerateMoveResponse = z.infer<typeof GenerateMoveResponseSchema>

export async function generateMoves(req: GenerateMovesRequest): Promise<GenerateMoveResponse[]> {
    const response = await fetch("/api/generate-moves", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req, null, 2)
    })
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return GenerateMoveResponseSchema.array().parse(data)
}