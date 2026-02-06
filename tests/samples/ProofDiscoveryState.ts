import Graph from 'graphology'
import { ProofDiscoveryState, ProofNode, MoveDescription, proofDiscoveryStateReducer, ProofDiscoveryAction, nullProofDiscoveryState } from '../../src/core/ProofDiscoveryState'
import { ProofState } from '../../src/core/ProofStateZod'
import { sampleProofStates } from './ProofState'

const sampleProofDiscoveryStateActions: ProofDiscoveryAction[] = [
    {
        action: "initialize",
        statement: sampleProofStates[0].description,
        proofState: sampleProofStates[0].proofState
    },
    {
        action: "addToLibrary",
        statement: {
                    label: "infinitely_many_twin_primes",
                    statement: {
                        kind: "universal",
                        variable: { name: "$N$", description: "$NN$" },
                        statement: {
                            kind: "existential",
                            variable: { name: "$p$", description: "$NN$" },
                            statement: {
                                kind: "conjunction",
                                statements: [
                                    "$p$ is prime",
                                    "$p + 2$ is prime",
                                    "$p > N$"
                                ]
                            }
                        }
                    }
                }
    }, 
    {
        action: "addToLibrary",
        statement: { 
                    label: "graph_fundamental_group",
                    statement: { 
                        kind: "universal", variable: { name: "$X$", description: "Graph" },
                        statement: { kind: "universal", variable: { name: "$x$", description: "vertex of $X$" },
                        statement: "$upright(\"fundamental_group\")(X, x)$ is a free group" }
                    }
                }
    },
    {
        action: "addToLibrary",
        statement: {
                    label: "flt",
                    statement: {
                        kind: "universal",
                        variable: { name: "$n$", description: "$NN$" },
                        statement: {
                            kind: "universal",
                            variable: { name: "$x$", description: "$NN$" },
                            statement: {
                                kind: "universal",
                                variable: { name: "$y$", description: "$NN$" },
                                statement: {
                                    kind: "implication",
                                    antecedent: {
                                        kind: "conjunction",
                                        statements: [
                                            "$n > 2$",
                                            "$x^n + y^n = z^n$"
                                        ]
                                    },
                                    consequent: "$x * y * z = 0$"
                                    }
                                }
                            }
                        }
                    }
    },
    {
        action: "transition",
        move: {
            kind: "strengthening",
            description: "<placeholder> Rewrite the goal"
        },
        newProofState: sampleProofStates[1].proofState
    },
    {
        action: "transition",
        move: {
            kind: "weakening",
            description: "<placeholder> Apply a known theorem"
        },
        newProofState: sampleProofStates[2].proofState
    },
    {
        action: "transition",
        move: {
            kind: "equivalence",
            description: "<placeholder> Apply logical strengthening"
        },
        newProofState: sampleProofStates[3].proofState
    },
    {
        action: "transition",
        move: {
            kind: "other",
            description: "<placeholder> Apply an exploratory move"
        },
        newProofState: sampleProofStates[4].proofState
    },
    {
        action: "transition",
        move: {
            kind: "strengthening",
            description: "<placeholder> By abstract nonsense"
        },
        newProofState: sampleProofStates[5].proofState
    },
    {
        action: "setHighlightedStatement",
        index: 2
    },
]

export const sampleProofDiscoveryState: ProofDiscoveryState = sampleProofDiscoveryStateActions.reduce(proofDiscoveryStateReducer, nullProofDiscoveryState) 