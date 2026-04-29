import React from "react"
import { nullProofDiscoveryState, ProofDiscoveryAction, ProofDiscoveryState, ProofNodeId } from "./ProofDiscoveryState";

/** A proof state is made up of one or more proof contexts, each consisting of 
 * a list of variables involved in the proof, hypotheses concerning them
 * and goals to be proved. 
 * 
 * A `ProofStateId` records node in the proof discovery graph and the particular context within it
 * being referred to.
 * */
export type ProofStateId = {
    proofNodeId: ProofNodeId,
    proofContextId: number
}

export function areProofStateIdsEqual(a: ProofStateId, b: ProofStateId): boolean {
    return a.proofNodeId === b.proofNodeId && a.proofContextId === b.proofContextId
}

export const ProofStateIdContext = React.createContext<ProofStateId>({ proofNodeId: -1, proofContextId: -1 })

export const ProofDiscoveryStateContext = React.createContext<{
   proofDiscoveryState: ProofDiscoveryState 
   dispatchProofDiscoveryAction: React.Dispatch<ProofDiscoveryAction>
}>({
    proofDiscoveryState: nullProofDiscoveryState,
    dispatchProofDiscoveryAction: () => {}
})