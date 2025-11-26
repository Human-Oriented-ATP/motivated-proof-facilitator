import React from "react"
import { Statement } from "./ProofState"
import { areSubExpressionSelectionsEqual, SubExpressionCoreWithIndex } from "./SubExpression"
import { ProofStateId } from "./ProofDiscoveryStateContext"

export type StatementCoordinate = 
 | { kind: "conjunction", idx: number }
 | { kind: "disjunction", idx: number }
 | "implication_antecedent" | "implication_consequent"
 | "negation" 
 | "equivalence_left" | "equivalence_right"
 | "universal_var" | "existential_var"
 | "universal_var_type" | "existential_var_type"
 | "universal_body" | "existential_body"
 | "highlight"

function areStatementCoordinatesEqual(a: StatementCoordinate, b: StatementCoordinate): boolean {
  if (typeof a === "string" && typeof b === "string") {
    return a === b
  } else if (typeof a === "object" && typeof b === "object") {
    return a.kind === b.kind && a.idx === b.idx
  } else {
    return false
  }
}

/** A location within a larger statement described as a path from the root of the statement. */
export type StatementAddress = StatementCoordinate[]

export function areStatementAddressesEqual(a: StatementAddress, b: StatementAddress): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!areStatementCoordinatesEqual(a[i], b[i])) {
      return false
    }
  }
  return true
}

/** A location within the proof state. */
export type ProofStateLocation = 
 { kind: "variable" | "variable_body" | "hypothesis" | "goal",
   label: string }

export const ProofStateLocationContext = React.createContext<ProofStateLocation | null>(null);

export type ProofStateSelection = {
	proofStateId: ProofStateId
	location: ProofStateLocation
	address: StatementAddress
	selection: Statement | SubExpressionCoreWithIndex
}

function areProofStateSelectionsEqual(a: ProofStateSelection, b: ProofStateSelection): boolean {
    return a.proofStateId === b.proofStateId &&
      a.location.kind === b.location.kind &&
      a.location.label === b.location.label &&
      areStatementAddressesEqual(a.address, b.address) &&
      ((typeof a.selection === "object" && "text" in a.selection && typeof b.selection === "object" && "text" in b.selection) ? 
        areSubExpressionSelectionsEqual(a.selection, b.selection) : true)
}

type ProofStateSelectionAction = {
    type: 'TOGGLE_SELECTION'
    selection: ProofStateSelection
} | {
    type: 'CLEAR_ALL_SELECTIONS'
} | {
    type: 'CLEAR_PROOF_STATE_SELECTIONS'
    proofStateId: ProofStateId
}

export function proofStateSelectionReducer(state: ProofStateSelection[], action: ProofStateSelectionAction): ProofStateSelection[] {
    switch (action.type) {
        case 'TOGGLE_SELECTION': {
            const existingIndex = state.findIndex(s => areProofStateSelectionsEqual(s, action.selection))
            if (existingIndex >= 0) {
                // Deselect
                const newState = [...state]
                newState.splice(existingIndex, 1)
                return newState
            } else {
                // Select
                return [...state, action.selection]
            }
        }
        case 'CLEAR_ALL_SELECTIONS': {
            return []
        }
        case 'CLEAR_PROOF_STATE_SELECTIONS': {
            return state.filter(s => s.proofStateId !== action.proofStateId)
        }
        default:
            return state
    }
}

export const ProofStateSelectionContext = React.createContext<{
    selections: ProofStateSelection[]
    dispatch: React.Dispatch<ProofStateSelectionAction>
}>({
    selections: [],
    dispatch: () => {}
})