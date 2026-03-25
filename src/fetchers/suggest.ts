import { z } from "zod"
import { ProofStateSelection, ProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext"
import { ContextVariable, LabelledStatementSchema, StatementSchema } from "../core/ProofStateZod"

export interface SuggestRequest {
    variables: ContextVariable[]
    mainSelections: ProofStateSelectionWithPolarity[]
    additionalSelections: ProofStateSelectionWithPolarity[]
    instructions: string
}

const SuggestResultSchema = z.object({
    suggestion: StatementSchema.optional().describe("A suggestion that is offered to the user in relation to certain selections in the proof state. In some cases, it is sufficient for the statement to be atomic, i.e., just a string interspersed with Typst formulas enclosed within dollar quotes. Suggestions are specific and are often meant to directly replace or supplement the main selections in the proof state."),
    generalResult: LabelledStatementSchema.optional().describe("A general mathematical statement, corresponding to a result one might find in a textbook or a paper, that relates to the selections. In some cases, the general result is meant to be presented alongside the suggestion as a more general reason for why the suggestion is valid. In other cases, the general result is meant to be the main content of the response, especially when the user is looking for theorems to store and use a few steps down the line in the proof.")
}).describe("A suggestion made in response to the user's selections in the proof state. The suggestion may include a specific statement that is relevant to the selections, as well as a more general mathematical result that relates to the selections. The general result can provide context and justification for the suggestion, or can serve as a standalone theorem for the user to keep in mind as they continue working on the proof.")

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