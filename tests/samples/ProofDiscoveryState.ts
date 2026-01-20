import Graph from 'graphology'
import { ProofDiscoveryState, ProofNode, MoveDescription } from '../../src/core/ProofDiscoveryState'
import { ProofState } from '../../src/core/ProofStateZod'

/** Sample proof discovery states for testing the ProofDiscoveryState graph component */

/**
 * Creates a simple linear proof discovery state with 3 nodes
 */
export function createSimpleProofDiscoveryState(): ProofDiscoveryState {
    const graph = new Graph<ProofNode, MoveDescription>()
    
    const proofState1: ProofState = [{
        variables: [],
        hypotheses: [],
        goals: [{ label: "G1", statement: "$x > 0$" }]
    }]
    
    const proofState2: ProofState = [{
        variables: [{ kind: "free", name: "$x$", description: "$RR$" }],
        hypotheses: [],
        goals: [{ label: "G1", statement: "$x > 0$" }]
    }]
    
    const proofState3: ProofState = [{
        variables: [{ kind: "free", name: "$x$", description: "$RR$" }],
        hypotheses: [{ label: "H1", statement: "$x >= 0$" }],
        goals: [{ label: "G1", statement: "$x > 0$" }]
    }]
    
    graph.addNode(0, { proofState: proofState1 })
    graph.addNode(1, { proofState: proofState2 })
    graph.addNode(2, { proofState: proofState3 })
    
    graph.addDirectedEdge(1, 0, {
        kind: "strengthening",
        description: "Add variable constraint"
    })
    
    graph.addDirectedEdge(2, 1, {
        kind: "strengthening",
        description: "Add hypothesis"
    })
    
    return {
        statement: "Prove that x > 0",
        graph,
        currentNodeId: 2,
        isSolved: false
    }
}

/**
 * Creates a branching proof discovery state with different move types
 */
export function createBranchingProofDiscoveryState(): ProofDiscoveryState {
    const graph = new Graph<ProofNode, MoveDescription>()
    
    const rootState: ProofState = [{
        variables: [],
        hypotheses: [],
        goals: [{ label: "G1", statement: "$x^2 = 4$" }]
    }]
    
    const branch1State: ProofState = [{
        variables: [],
        hypotheses: [],
        goals: [{ label: "G1", statement: "$x = 2$" }]
    }]
    
    const branch2State: ProofState = [{
        variables: [],
        hypotheses: [],
        goals: [{ label: "G1", statement: "$x = -2$" }]
    }]
    
    const weakenedState: ProofState = [{
        variables: [],
        hypotheses: [],
        goals: [{ label: "G1", statement: "$x^2 >= 0$" }]
    }]
    
    const equivalentState: ProofState = [{
        variables: [],
        hypotheses: [],
        goals: [{ label: "G1", statement: "$(x-2)(x+2) = 0$" }]
    }]
    
    graph.addNode(0, { proofState: rootState })
    graph.addNode(1, { proofState: branch1State })
    graph.addNode(2, { proofState: branch2State })
    graph.addNode(3, { proofState: weakenedState })
    graph.addNode(4, { proofState: equivalentState })
    
    // Strengthening edges (from branches to root)
    graph.addDirectedEdge(1, 0, {
        kind: "strengthening",
        description: "Case 1: x = 2"
    })
    
    graph.addDirectedEdge(2, 0, {
        kind: "strengthening",
        description: "Case 2: x = -2"
    })
    
    // Weakening edge
    graph.addDirectedEdge(0, 3, {
        kind: "weakening",
        description: "Relax constraint"
    })
    
    // Equivalence edge
    graph.addUndirectedEdge(0, 4, {
        kind: "equivalence",
        description: "Algebraic reformulation"
    })
    
    return {
        statement: "Solve x^2 = 4",
        graph,
        currentNodeId: 1,
        isSolved: false
    }
}

/**
 * Creates a complex proof discovery state with all move types
 */
export function createComplexProofDiscoveryState(): ProofDiscoveryState {
    const graph = new Graph<ProofNode, MoveDescription>()
    
    // Create 6 nodes
    for (let i = 0; i < 6; i++) {
        const proofState: ProofState = [{
            variables: [],
            hypotheses: [],
            goals: [{ label: `G${i}`, statement: `Goal at node ${i}` }]
        }]
        graph.addNode(i, { proofState })
    }
    
    // Add various edges
    graph.addDirectedEdge(1, 0, { kind: "strengthening", description: "Strengthen goal" })
    graph.addDirectedEdge(2, 0, { kind: "strengthening", description: "Alternative strengthening" })
    graph.addDirectedEdge(0, 3, { kind: "weakening", description: "Weaken goal" })
    graph.addUndirectedEdge(1, 4, { kind: "equivalence", description: "Equivalent formulation" })
    graph.addDirectedEdge(5, 4, { kind: "other", description: "Exploratory move" })
    graph.addDirectedEdge(2, 5, { kind: "other", description: "Another exploration" })
    
    return {
        statement: "Complex proof exploration",
        graph,
        currentNodeId: 4,
        isSolved: false
    }
}

/**
 * Creates a solved proof discovery state
 */
export function createSolvedProofDiscoveryState(): ProofDiscoveryState {
    const state = createSimpleProofDiscoveryState()
    return {
        ...state,
        isSolved: true
    }
}

/** Export all sample proof discovery states */
export const proofDiscoveryStates = {
    simple: createSimpleProofDiscoveryState(),
    branching: createBranchingProofDiscoveryState(),
    complex: createComplexProofDiscoveryState(),
    solved: createSolvedProofDiscoveryState()
}
