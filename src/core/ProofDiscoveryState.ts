import Graph from 'graphology';
import { ProofState } from './ProofStateZod'

export type MoveKind = "strengthening" | "weakening" | "equivalence" | "other"

export interface MoveDescription {
    kind: MoveKind
    description: string
}

export interface ProofNode {
    proofState: ProofState
}

export type ProofNodeId = number

type ProofDiscoveryGraph = Graph<ProofNode, MoveDescription>

export interface ProofDiscoveryState {
    statement: string
    graph: ProofDiscoveryGraph
    currentNodeId: ProofNodeId
    isSolved: boolean
}

export const nullProofDiscoveryState = {
    statement: "",
    graph: new Graph<ProofNode, MoveDescription>(),
    currentNodeId: -1,
    isSolved: false
}

export type ProofDiscoveryAction =
| { action: "initialize", statement: string, proofState: ProofState }
| { action: "repair", nodeId: ProofNodeId, newProofState: ProofState }
| { action: "focus", nodeId: ProofNodeId }
| { action: "transition",
    move: MoveDescription,
    newProofState: ProofState }
| { action: "finish" }

export function proofDiscoveryStateReducer(state: ProofDiscoveryState, action: ProofDiscoveryAction): ProofDiscoveryState {
    switch (action.action) {
        case "initialize": {
            if (state.graph.order > 0) {
                state.graph.clear()
            }
            state.graph.addNode(0, { proofState: action.proofState })
            return {
                ...state,
                statement: action.statement,
                currentNodeId: 0,
                isSolved: false
            }
        }
        case "repair": {
            if (!state.graph.hasNode(action.nodeId)) {
                throw new Error(`Node with ID ${action.nodeId} does not exist.`)
            }
            state.graph.setNodeAttribute(action.nodeId, 'proofState', action.newProofState)
            return state
        }
        case "focus": {
            if (!state.graph.hasNode(action.nodeId)) {
                throw new Error(`Node with ID ${action.nodeId} does not exist.`)
            }
            return {
                ...state,
                currentNodeId: action.nodeId
            }
        }
        case "transition": {
            const newNodeId = state.graph.order
            state.graph.addNode(newNodeId, { proofState: action.newProofState })
            switch (action.move.kind) {
                case "strengthening":
                    state.graph.addDirectedEdge(newNodeId, state.currentNodeId, action.move)
                    break
                case "weakening":
                    state.graph.addDirectedEdge(state.currentNodeId, newNodeId, action.move)
                    break
                case "equivalence":
                    state.graph.addUndirectedEdge(newNodeId, state.currentNodeId, action.move)
                    break
                case "other":
                    // TODO: Make this edge grayed and dotted
                    state.graph.addDirectedEdge(newNodeId, state.currentNodeId, action.move)
            }
            return {
                ...state,
                currentNodeId: newNodeId
            }
        }
        case "finish": {
            return {
                ...state,
                isSolved: true
            }
        }
        default:
            return state
    }
}