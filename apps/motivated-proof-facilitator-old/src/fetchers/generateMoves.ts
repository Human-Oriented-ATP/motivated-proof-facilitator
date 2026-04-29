import { z } from "zod"
import { ProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext.js"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod.js"

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

export const GenerateMovesResponseSchema = z.object({
    moves: GenerateMoveResponseSchema.array().describe("A list of moves that are relevant to the current proof state and selections, along with the new proof states and associated reasoning traces, ranked in order of relevance with the most relevant move first.")
})

export type GenerateMovesResponse = z.infer<typeof GenerateMovesResponseSchema>

export async function generateMoves(req: GenerateMovesRequest, signal?: AbortSignal): Promise<GenerateMoveResponse[]> {
    const response = await fetch("/api/generate-moves", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req, null, 2),
        ...(signal && { signal }),
    })
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log("Received response from /api/generate-moves, parsing JSON...", response)
    const data = await response.json()
    console.log("Received response:", data)
    return GenerateMovesResponseSchema.parse(data._output).moves
}