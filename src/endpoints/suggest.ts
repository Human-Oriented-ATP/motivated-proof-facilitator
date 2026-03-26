import { generateText, Output } from "ai"
import { SuggestRequest, SuggestResultsSchema } from "../fetchers/suggest.js"
import { MODELS } from "./models.js"

const SUGGEST_PROMPT = 
`
Your task is to suggest useful statements that could help advance the proof.

Your suggestions should be directly related to the list of main selections,
using the additional selections for extra context. 

You may consult the list of variables to properly interpret the selections.

You are required to produce a list of statements related to the selections, following the instructions provided.

Please keep the suggestions simple, direct and relevant, avoiding wordy phrasing.

Include general library results only if the statement suggested is non-trivially related to the selections, and omit them otherwise. 

In some cases, you may be required to output a statement that is relevant to the selections,
along with a general theorem statement that relates the two.

For example, if the main selection is $ 5 divides a dot b $ and an auxilliary selection is $ 5 divides.not a $, 
a relevant suggestion could be $ 5 divides b $ along with the general theorem statement 
\`\`\`
{
    label: "divisibility_by_prime",
    statement: {
        kind: "universal", variable: { name: "p", description: "$NN$" }, statement: {
        kind: "universal", variable: { name: "a", description: "$NN$" }, statement: {
        kind: "universal", variable: { name: "b", description: "$NN$" }, statement: {
        kind: "implication", antecedent: { kind: "conjunction", statements: [
            "$p divides a dot b$",
            "$p$ is prime"
        ]}, consequent: {kind: "disjunction", statements: [
            "$p$ divides $a$",
            "$p$ divides $b$"
        ]}
}}}}}
\`\`\`
    }
\`\`\`

Output up to 5 suggestions that could be relevant to the selections.
If there are fewer than 5 suggestions that could be relevant, return only those.0
Ensure that there are no duplicate suggestions. 

Please order the suggestions from most relevant to least relevant, where relevance is determined
by the relevance of the statement to the main selections, similarity to the additional selections, and simplicity.
`



export const suggestStatements = async(req: SuggestRequest) => {
    console.log('Generating suggestions with request', req)
    return await generateText({
        model: MODELS.suggest,
        system: SUGGEST_PROMPT,
        prompt: JSON.stringify(req, null, 2),
        output: Output.object({
            schema: SuggestResultsSchema
        }),
        maxRetries: 3
    })
}
