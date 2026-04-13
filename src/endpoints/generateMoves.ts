import { moves } from "../prompts/moves.js"
import { GenerateMoveResponseSchema, GenerateMovesRequest } from "../fetchers/generateMoves.js"
import { generateText, Output } from "ai"
import { MODELS } from "./models.js"

const GENERATE_MOVES_PROMPT =
`
You are provided with a list of ProofDiscoveryMoves that propose to transform proof states in various ways.

The format of a \`ProofDiscoveryMove\` is given below.

\`\`\`
export type MoveKind = "strengthening" | "weakening" | "equivalence" | "other"

export interface ProofDiscoveryMoveExample {
    description: string 
    inputState: ProofStateWithLibraryResult
    selections: ProofStateSelection[]
    outputState: ProofStateWithLibraryResult | null
    comment?: string
    kind: "example" | "non-example"
}

/**
 * A \`ProofDiscoveryMove\` is a prompt template for carrying out a move that transforms the proof state.
 * 
 * @param name A short description of the move that appears in the move panel.
 * @param kind The move can be a strengthening move, a weakening move, an equivalence move, or some other kind of move, according to how it is meant to transform the proof discovery state.
 * @param trigger The trigger specifies the kinds of selections in the proof state that the move is meant to appear in response to.
 * @param action The action specifies how the move is supposed to transform the proof state. 
 * @param examples The examples and non-examples provide additional context for carrying out the move in accordance with the action.
 */
export interface ProofDiscoveryMove {
    name: string
    kind: MoveKind
    classification: "mathematical" | "logical"
    /** Whether to allow a move to fail if it isn't applicable in a certain context. */
    runWithGuardrails: boolean
    /** The trigger decides whether the move is relevant for a given set of selections made in a proof state.  */
    trigger: string
    /** The action specifies how the move is supposed to transform the proof state. */
    action: string
    examples?: ProofDiscoveryMoveExample[]
}
\`\`\`


You will also be provided the current proof state and the list of selections made within it, and your task is to 
determine which of the moves are relevant to the current proof state and selections, according to each move's trigger criterion, 
and to apply the relevant moves to produce new proof states.

Here is the list of moves to consider:
${JSON.stringify(moves, null, 0)}

The expected return format is an array of responses of the form
\`\`\`
{
    name: string, // the name of the move being applied
    proofState: { ... }, // the new proof state resulting from applying the move
    reasoning: string // a brief and clear explanation of why the move is relevant and applicable and the decisions that went into producing the new proof state.
}
\`\`\`

Be sure to carefully consider the mathematical content and structure of the proof state, as well as the nature of the selections, 
when determining whether a move's trigger criterion is satisfied and when applying the move to produce a new proof state.

Please make sure to rank the moves in order of mathematical relevance, with the most relevant move first.
A move can be considered to make progress if it combines two matching terms to produce a new one, or reduces the 
effective number of variables in the goal, and it's important to take into account factors such as these in deciding the relevance.
`

export const generateMoves = async(req: GenerateMovesRequest) => {
    console.log('Generating moves for proof state', req.proofState, 'with selections', req.selections)

    return await generateText({
        model: MODELS.generate_moves,
        system: GENERATE_MOVES_PROMPT,
        prompt: JSON.stringify(req, null, 2),
        output: Output.array({
            element: GenerateMoveResponseSchema,
            description: "A list of moves that are relevant to the current proof state and selections, along with the new proof states and associated reasoning traces, ranked in order of relevance with the most relevant move first."
        }),
        maxRetries:  3
    })
}