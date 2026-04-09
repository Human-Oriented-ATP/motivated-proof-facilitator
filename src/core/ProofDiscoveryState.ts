import Graph from 'graphology';
import { LabelledStatement, ProofState, Statement } from './ProofStateZod'

export type MoveKind = "strengthening" | "weakening" | "equivalence" | "backtrack" | "other"

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
| { action: "backtrack", nodeId: ProofNodeId }
| { action: "undo" }
| { action: "setHighlightedStatement", index: number }
| { action: "clearHighlightedStatement" }
| { action: "finish" }

export function proofDiscoveryStateReducer(state: ProofDiscoveryState, action: ProofDiscoveryAction): ProofDiscoveryState {
    switch (action.action) {
        case "initialize": {
            // start from a fresh graph rather than mutating the existing one
            const newGraph = new Graph<ProofNode, MoveDescription>()
            newGraph.addNode(0, { proofState: action.proofState })
            return {
                ...state,
                graph: newGraph,
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
            // copy graph and update the node
            const repairedGraph = state.graph.copy()
            repairedGraph.setNodeAttribute(action.nodeId, 'proofState', action.newProofState)
            return {
                ...state,
                graph: repairedGraph
            }
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
            // clone graph before mutating
            const newNodeId = state.graph.order
            const newGraph = state.graph.copy()
            newGraph.addNode(newNodeId, { proofState: action.newProofState })
            switch (action.move.kind) {
                case "strengthening":
                    newGraph.addDirectedEdge(newNodeId, state.currentNodeId, action.move)
                    break
                case "weakening":
                    newGraph.addDirectedEdge(state.currentNodeId, newNodeId, action.move)
                    break
                case "equivalence":
                    newGraph.addUndirectedEdge(newNodeId, state.currentNodeId, action.move)
                    break
                case "other":
                    // TODO: Make this edge grayed and dotted
                    newGraph.addDirectedEdge(newNodeId, state.currentNodeId, action.move)
            }
            return {
                ...state,
                graph: newGraph,
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
        case "backtrack": {
            if (!state.graph.hasNode(action.nodeId)) {
                throw new Error(`Node with ID ${action.nodeId} does not exist.`)
            }
            const leaves = getLeafDescendants(state.graph, action.nodeId)

            // Collect all goals from leaf nodes
            const allGoals = leaves.flatMap(leafId =>
                state.graph.getNodeAttribute(leafId, 'proofState').flatMap(ctx => ctx.goals)
            )

            // Build the negated conjunction hypothesis
            const negatedStatement: Statement = allGoals.length === 1
                ? { kind: "negation", statement: allGoals[0]!.statement }
                : { kind: "negation", statement: { kind: "conjunction", statements: allGoals.map(g => g.statement) } }

            const backtrackedHypothesis: LabelledStatement = {
                label: "backtrack_hypothesis",
                statement: negatedStatement
            }

            // New node: selected node's proof state with the hypothesis added to the first context
            const selectedProofState = state.graph.getNodeAttribute(action.nodeId, 'proofState')
            const newProofState = selectedProofState.map((ctx, i) =>
                i === 0 ? { ...ctx, hypotheses: [...ctx.hypotheses, backtrackedHypothesis] } : ctx
            )

            const newNodeId = state.graph.order
            const newGraph = state.graph.copy()
            newGraph.addNode(newNodeId, { proofState: newProofState })

            // Connect new node to each leaf via backtrack edges
            for (const leafId of leaves) {
                newGraph.addDirectedEdge(newNodeId, leafId, {
                    kind: "backtrack",
                    description: "Close goals through backtracking"
                })
            }

            newGraph.addDirectedEdge(newNodeId, action.nodeId, {
                kind: "strengthening",
                description: "Revisit node with new hypothesis from backtracking"
            })

            return {
                ...state,
                graph: newGraph,
                currentNodeId: newNodeId
            }
        }
        case "undo": {
            // Find the parent: the neighbor with the smallest ID.
            // Since node IDs are always increasing, the parent is always
            // the minimum-ID neighbor regardless of edge kind or direction.
            let parentId: string | undefined
            state.graph.forEachEdge(state.currentNodeId, (_edge, _attrs, source, target) => {
                const other = source === state.currentNodeId.toString() ? target : source
                if (parentId === undefined || parseInt(other) < parseInt(parentId)) {
                    parentId = other
                }
            })

            if (parentId === undefined) {
                // Root node — nothing to undo
                return state
            }

            const undoneGraph = state.graph.copy()
            undoneGraph.dropNode(state.currentNodeId)

            return {
                ...state,
                graph: undoneGraph,
                currentNodeId: parseInt(parentId)
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

/**
 * Returns all leaf descendants of a node reachable via strengthening and equivalence edges,
 * only considering nodes with ID strictly greater than nodeId.
 *
 * Phase 1: BFS to collect all reachable descendants.
 * Phase 2: A node is a leaf if none of the collected nodes are its strengthening children.
 */
function getLeafDescendants(graph: ProofDiscoveryGraph, nodeId: ProofNodeId): ProofNodeId[] {
    // Phase 1: collect all reachable descendants (including nodeId itself as the starting point)
    const visited = new Set<string>()
    const queue: string[] = [nodeId.toString()]
    visited.add(nodeId.toString())

    while (queue.length > 0) {
        const current = queue.shift()!

        graph.forEachInEdge(current, (_edge, attrs, source) => {
            if (attrs.kind !== 'strengthening') return
            if (parseInt(source) <= nodeId) return
            if (!visited.has(source)) {
                visited.add(source)
                queue.push(source)
            }
        })

        graph.forEachUndirectedEdge(current, (_edge, attrs, source, target) => {
            if (attrs.kind !== 'equivalence') return
            const other = source === current ? target : source
            if (parseInt(other) <= nodeId) return
            if (!visited.has(other)) {
                visited.add(other)
                queue.push(other)
            }
        })
    }

    // Phase 2: a node is a leaf if:
    //   - none of the visited nodes are its strengthening children, AND
    //   - it has no equivalence neighbour in visited with a strictly greater ID
    const leaves: ProofNodeId[] = []
    for (const nodeStr of visited) {
        const id = parseInt(nodeStr)
        let isLeaf = true

        graph.forEachInEdge(nodeStr, (_edge, attrs, source) => {
            if (attrs.kind !== 'strengthening') return
            if (visited.has(source)) isLeaf = false
        })

        graph.forEachUndirectedEdge(nodeStr, (_edge, attrs, source, target) => {
            if (attrs.kind !== 'equivalence') return
            const other = source === nodeStr ? target : source
            if (visited.has(other) && parseInt(other) > id) isLeaf = false
        })

        if (isLeaf) leaves.push(id)
    }

    return leaves
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