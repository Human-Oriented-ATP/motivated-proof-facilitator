import { ProofStateSelection } from "./ProofStateSelectionContext";
import { ProofStateWithLibraryResult } from "./ProofStateZod";

export type MoveKind = "strengthening" | "weakening" | "equivalence"

export interface ProofDiscoveryMove {
    name: string
    kind: MoveKind
    /** The trigger decides whether the move is relevant for a given set of selections made in a proof state.  */
    trigger: string
    /** The action specifies how the move is supposed to transform the proof state. */
    action: string
    examples: {
        description: string 
        inputState: ProofStateWithLibraryResult
        outputState: ProofStateWithLibraryResult | null
        comment?: string
        kind: "example" | "non-example"
    }[]
}