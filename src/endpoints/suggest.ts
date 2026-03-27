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

Please keep the suggestions simple, precise, structured, direct and relevant, avoiding wordy phrasing.
Avoid introducing any concept or terminology that is not already present in the selections or variable context.
Prefer generating structured statements composed of simpler sentences with logical connectives over
long and convoluted atomic statements.

In some cases, you may be required to output a statement that is relevant to the selections,
along with a general theorem statement that relates the two.

Include general library results only if the statement suggested is non-trivially related to the selections, 
or if you have been explicitly asked to include them, and omit them otherwise. 


For example, if the main selection is $5 \mid ab$ and an auxiliary selection is $5 \nmid a$,
a relevant suggestion could be $5 \mid b$ along with the general theorem statement
\`\`\`
{
    label: "divisibility_by_prime",
    statement: {
        kind: "universal", variable: { name: "p", description: "$\\mathbb{N}$" }, statement: {
        kind: "universal", variable: { name: "a", description: "$\\mathbb{N}$" }, statement: {
        kind: "universal", variable: { name: "b", description: "$\\mathbb{N}$" }, statement: {
        kind: "implication", antecedent: { kind: "conjunction", statements: [
            "$p \\mid ab$",
            "$p$ is prime"
        ]}, consequent: {kind: "disjunction", statements: [
            "$p \\mid a$",
            "$p \\mid b$"
        ]}
}}}}}
\`\`\`
    }
\`\`\`

Output up to 5 suggestions that could be relevant to the selections.
If there are fewer than 5 suggestions that could be relevant, return only those.
Ensure that there are no duplicate suggestions. 

Please order the suggestions from most relevant to least relevant, where relevance is determined
by the relevance of the statement to the main selections, similarity to the additional selections, and simplicity.

Please keep the suggestions simple, precise, structured, direct and relevant.
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
