import React from "react"
import { Statement } from "./ProofState"
import { areSubExpressionSelectionsEqual, SubExpressionCoreWithIndex } from "./SubExpression"
import { areProofStateIdsEqual, ProofStateId } from "./ProofDiscoveryStateContext"

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
    const coordA = a[i]
    const coordB = b[i]
    if (coordA === undefined || coordB === undefined || !areStatementCoordinatesEqual(coordA, coordB)) {
      return false
    }
  }
  return true
}

/** A location within the proof state. */
export type ProofStateLocation = 
 { kind: "variable" | "variable_body" | "hypothesis" | "goal" | "library_statement",
   label: string }

export const ProofStateLocationContext = React.createContext<ProofStateLocation>({ kind: "goal", label: "" })

export type ProofStateSelection = {
	proofStateId: ProofStateId
	location: ProofStateLocation
	address: StatementAddress
	selection: Statement | SubExpressionCoreWithIndex
}

function areProofStateSelectionsEqual(a: ProofStateSelection, b: ProofStateSelection): boolean {
    return areProofStateIdsEqual(a.proofStateId, b.proofStateId) &&
      a.location.kind === b.location.kind &&
      a.location.label === b.location.label &&
      areStatementAddressesEqual(a.address, b.address) &&
      ((typeof a.selection === "object" && "text" in a.selection && typeof b.selection === "object" && "text" in b.selection) ? 
        areSubExpressionSelectionsEqual(a.selection, b.selection) : true)
}

export function locationPolarity(location: ProofStateLocation): boolean | null {
  switch (location.kind) {
    case "goal":
      return false
    case "hypothesis":
    case "library_statement":
      return true
    case "variable":
    case "variable_body":
      return null
  }
}

export function coordinatePolarity(coord: StatementCoordinate): boolean | null {
    switch (coord) {
      case "implication_antecedent":
      case "negation":
      case "universal_var":
        return true
      case "equivalence_left":
      case "equivalence_right":
      case "universal_var_type":
      case "existential_var_type":
        return null
      default:
        return false
    }
}

export function addressPolarity(init: boolean | null, address: StatementAddress): boolean | null {
  return address.reduce((polarity, coord) => {
    const coordPolarity = coordinatePolarity(coord)
    if (coordPolarity === null || polarity === null) {
      return null
    } else {
      return polarity !== coordPolarity
    }
  }, init)
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
            return state.filter(s => !areProofStateIdsEqual(s.proofStateId, action.proofStateId))
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