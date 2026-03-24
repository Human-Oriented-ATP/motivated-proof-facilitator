import { z } from "zod"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"
import { ContextVariable, LabelledStatementSchema, StatementSchema } from "../core/ProofStateZod"

export interface SuggestRequest {
    variables: ContextVariable[]
    mainSelections: ProofStateSelection[]
    additionalSelections: ProofStateSelection[]
    instructions: string
}

const SuggestResultSchema = z.object({
    suggestion: StatementSchema.optional(),
    generalResult: LabelledStatementSchema.optional()
})

export const SuggestResultsSchema = z.array(SuggestResultSchema).max(5, "Can only return up to 5 suggestions")

export type SuggestResults = z.infer<typeof SuggestResultsSchema>

export async function suggestStatements(req: SuggestRequest): Promise<SuggestResults> {
    const result = await fetch("/api/suggest", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req)
    })

    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`)

    return SuggestResultsSchema.parse(await result.json())
}