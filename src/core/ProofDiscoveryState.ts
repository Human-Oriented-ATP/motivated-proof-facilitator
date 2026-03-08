import Graph from 'graphology';
import { LabelledStatement, ProofState, Statement } from './ProofStateZod'

export type MoveKind = "strengthening" | "weakening" | "equivalence" | "other"

export interface MoveDescription {
    kind: MoveKind
    description: string,
    reasoning?: string
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
    library: LabelledStatement[]
    highlightedLibraryStatement?: number
    isSolved: boolean
}

export const nullProofDiscoveryState = {
    statement: "",
    graph: new Graph<ProofNode, MoveDescription>(),
    currentNodeId: -1,
    library: [],
    highlightedLibraryStatement: undefined,
    isSolved: false
}

export type ProofDiscoveryAction =
| { action: "initialize", statement: string, proofState: ProofState }
| { action: "repair", nodeId: ProofNodeId, newProofState: ProofState }
| { action: "focus", nodeId: ProofNodeId }
| { action: "transition",
    move: MoveDescription,
    newProofState: ProofState }
| { action: "addToLibrary", statement: LabelledStatement }
| { action: "setHighlightedStatement", index: number }
| { action: "clearHighlightedStatement" }
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
                isSolved: false,
                library: [],
                highlightedLibraryStatement: undefined
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
                currentNodeId: newNodeId,
                highlightedLibraryStatement: undefined
            }
        }
        case "finish": {
            return {
                ...state,
                isSolved: true,
                highlightedLibraryStatement: undefined
            }
        }
        case "addToLibrary": {
            return {
                ...state,
                library: [...state.library, action.statement],
                highlightedLibraryStatement: state.library.length
            }
        }
        case "setHighlightedStatement": {
            return {
                ...state,
                highlightedLibraryStatement: action.index
            }
        }
        case "clearHighlightedStatement": {
            return {
                ...state,
                highlightedLibraryStatement: undefined
            }
        }
        default:
            return state
    }
}

export function getCurrentProofState(proofDiscoveryState: ProofDiscoveryState): ProofState {
    return proofDiscoveryState.graph.getNodeAttribute(proofDiscoveryState.currentNodeId, 'proofState')
}

/**
 * Checks whether the current proof state has no goals in any context,
 * and is reachable from the original goal (node 0) through only
 * strengthening and equivalence edges (no weakenings).
 */
export function isProofComplete(state: ProofDiscoveryState): boolean {
    if (state.graph.order === 0) return false

    // Check all contexts have no goals
    const currentProofState = getCurrentProofState(state)
    if (currentProofState.some(ctx => ctx.goals.length > 0)) return false

    // Trivial case: we're already at the root
    if (state.currentNodeId === 0) return true

    // BFS from current node following only strengthening/equivalence edges toward node 0
    const visited = new Set<string>()
    const queue: string[] = [state.currentNodeId.toString()]
    visited.add(state.currentNodeId.toString())

    while (queue.length > 0) {
        const nodeId = queue.shift()!

        // Follow directed outgoing edges (strengthening: new -> old)
        state.graph.forEachOutEdge(nodeId, (_edge, attrs, _source, target) => {
            if (visited.has(target)) return
            if (attrs.kind === 'strengthening') {
                visited.add(target)
                queue.push(target)
            }
        })

        // Follow undirected edges (equivalences) in either direction
        state.graph.forEachUndirectedEdge(nodeId, (_edge, attrs, source, target) => {
            const other = source === nodeId ? target : source
            if (visited.has(other)) return
            if (attrs.kind === 'equivalence') {
                visited.add(other)
                queue.push(other)
            }
        })
    }

    return visited.has('0')
}

/**
 * Serializes the proof discovery state to a JSON-friendly object.
 */
export function serializeProofDiscoveryState(state: ProofDiscoveryState) {
    const nodes: { id: number; proofState: ProofState }[] = []
    state.graph.forEachNode((nodeId, attrs) => {
        nodes.push({ id: parseInt(nodeId), proofState: attrs.proofState })
    })

    const edges: { source: number; target: number; kind: MoveKind; description: string; undirected: boolean }[] = []
    state.graph.forEachEdge((_edge, attrs, source, target, _sa, _ta, undirected) => {
        edges.push({
            source: parseInt(source),
            target: parseInt(target),
            kind: attrs.kind,
            description: attrs.description,
            undirected,
        })
    })

    return {
        statement: state.statement,
        nodes,
        edges,
        currentNodeId: state.currentNodeId,
    }
}