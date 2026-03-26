import { generateText, Output } from "ai"
import { SuggestRequest, SuggestResultsSchema } from "../fetchers/suggest"
import { MODELS } from "./models"

const SUGGEST_PROMPT = 
`
Your task is to suggest useful statements that could help advance the proof.

Your suggestions should be directly related to the list of main selections,
using the additional selections for extra context. 

You may consult the list of variables to properly interpret the selections.

You are required to produce a list of statements related to the selections, following the instructions provided.

Here is the definition of the statement datastructure:

\`\`\`
{
label: "A label for the statement. This should be a short string written in snake case that uniquely identifies the statement.",
statement: "A statement (see format details below)"
}

/** A basic statement within the proof state
 *  written in natural language interspersed with [Typst](https://typst.app/) formulas
 *  enclosed within dollar quotes ($ ... $).
 * 
 * Examples are:
 * - "The function $f$ is injective"
 * - "The group $G$ is abelian"
 * - "$x^2 + 1$ is an irreducible polynomial over $RR$"
 */
type AtomicStatement = string

/** A variable in the proof state.
 *  The description contains the type information of the variable.
 * 
 * Examples are:
 * - { name: "n", description: "$NN$" }
 * - { name: "G", description: "Group" }
 * - { name: "f", description: "$A -> B$" }
 */
type Variable = {
name: string
description: AtomicStatement
}

/** A full statement involving multiple atomic statements joined by logical connectives. */
type Statement =
| AtomicStatement
| { kind: "conjunction"; statements: Statement[] }
| { kind: "disjunction"; statements: Statement[] }
| { kind: "negation"   ; statement: Statement }
| { kind: "implication"; antecedent: Statement; consequent: Statement }
| { kind: "equivalence"; left: Statement; right: Statement }
| { kind: "universal"  ; variable: Variable; statement: Statement }
| { kind: "existential"; variable: Variable; statement: Statement }
| { kind: "highlight"; statement: Statement }

\`\`\`

In some cases, you may be required to produce only atomic statements, which are
essentially plain strings that can include mathematical notation in Typst.

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
