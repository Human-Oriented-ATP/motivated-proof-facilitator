import { ProofStateSelection } from "./ProofStateSelectionContext";
import { ProofState } from "./ProofStateZod";

export type MoveKind = "strengthening" | "weakening" | "equivalence"

export interface ProofDiscoveryMove {
    name: string
    kind: MoveKind
    /** The trigger decides whether the move is relevant for a given set of selections made in a proof state.  */
    trigger: {
        description: string
        examples: { proofState: ProofState, selections: ProofStateSelection[] }[]
        nonexamples: { proofState: ProofState, selections: ProofStateSelection[] }[]
    },
    /** The action specifies how the move is supposed to transform the proof state. */
    action: {
        prompt: string
        examples: { inputState: ProofState, outputState: ProofState }[]
        nonexamples: { inputState: ProofState, outputState: ProofState }[]
    }
}