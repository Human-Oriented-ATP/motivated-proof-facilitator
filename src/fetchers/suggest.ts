import { z } from "zod"
import { ProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext"
import { AtomicStatementSchema, ContextVariable, LabelledStatementSchema, StatementSchema } from "../core/ProofStateZod"

export interface SuggestRequest {
    variables: ContextVariable[]
    mainSelections: ProofStateSelectionWithPolarity[]
    additionalSelections: ProofStateSelectionWithPolarity[]
    instructions: string
}

const SuggestResultSchema = z.object({
    suggestion: StatementSchema.nullable().describe("A suggestion that is offered to the user in relation to certain selections in the proof state. Suggestions are specific and are often meant to directly replace or supplement the main selections in the proof state."),
    generalResult: LabelledStatementSchema.nullable().describe("A general mathematical statement, corresponding to a result one might find in a textbook or a paper, that relates to the selections. In some cases, the general result is meant to be presented alongside the suggestion as a more general reason for why the suggestion is valid. In other cases, the general result is meant to be the main content of the response, especially when the user is looking for theorems to store and use a few steps down the line in the proof. Include the general result only when explicitly requested or when the suggested statement is non-trivially related to the selections; omit it otherwise.")
}).describe("A suggestion made in response to the user's selections in the proof state. The suggestion may include a specific statement that is relevant to the selections, as well as a more general mathematical result that relates to the selections. The general result can provide context and justification for the suggestion, or can serve as a standalone theorem for the user to keep in mind as they continue working on the proof.")

export const SuggestResultsSchema = z.object({
    suggestions: z.array(SuggestResultSchema).max(5, "Can only return up to 5 suggestions")
}).describe("The list of suggestions generated in response to the user's selections in the proof state.") 

export type SuggestResult = z.infer<typeof SuggestResultSchema>
export type SuggestResults = z.infer<typeof SuggestResultsSchema>

export async function suggestStatements(req: SuggestRequest): Promise<SuggestResults> {
    console.log("Sending suggest request:", req)
    const result = await fetch("/api/suggest", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req)
    })

    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`)

    const json = await result.json()
    console.log("Received suggest response:", json)
    return SuggestResultsSchema.parse(json._output)
}