import { ProofStateSelection, ProofStateSelectionWithPolarity } from "./ProofStateSelectionContext";
import { ProofStateWithLibraryResult } from "./ProofStateZod";

export type MoveKind = "strengthening" | "weakening" | "equivalence" | "other"

export interface ProofDiscoveryMoveExample {
    description: string 
    inputState: ProofStateWithLibraryResult
    selections: ProofStateSelectionWithPolarity[]
    outputState: ProofStateWithLibraryResult | null
    comment?: string
    kind: "example" | "non-example"
}

/**
 * A `ProofDiscoveryMove` is a prompt template for carrying out a move that transforms the proof state.
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
    /** The trigger decides whether the move is relevant for a given set of selections made in a proof state.  */
    trigger: string
    /** The action specifies how the move is supposed to transform the proof state. */
    action: string
    examples: ProofDiscoveryMoveExample[]
}

/**
 * A `ProofDiscoverySuggestionMove` is a prompt template for moves that first display a list of suggestions to the user,
 * before choosing to modify the proof state according to the suggestion selected by the user.
 * 
 * @param name A short description of the move that appears in the move panel.
 * @param trigger The trigger specifies the kinds of selections in the proof state that the move is meant to appear in response to.
 * @param suggestionPrompt A description of the kinds of suggestions that the move is meant to generate in response to the selections in the proof state.
 * @param applySuggestionMove The move that is meant to be applied once the user selects a suggestion. 
 *  This move should be designed to take the user from the current proof state to a new proof state that incorporates the selected suggestion in a meaningful way. 
 *  The exact design of this move will depend on the nature of the suggestions being generated and how they are meant to interact with the current proof state.
 */
export interface ProofDiscoverySuggestionMove {
    name: string
    trigger: string
    suggestionPrompt: string
    applySuggestionMove: ProofDiscoveryMove
}