import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

const goalConjunctionMove: ProofDiscoveryMove = {
    name: "Split a conjunction in the goal",
    kind: "strengthening",
    trigger: "This move is relevant when the only selection in the proof state is a goal statement that is a conjunction.",
    action: "Split the conjunction into separate goals, one corresponding to each conjunct.",
    examples: [
        {
            description: "A minimal abstract example",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "A", kind: "free", description: "proposition" }, 
                            { name: "B", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "conjunction",
                                    statements: [ "A", "B" ]
                                }
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "main_goal" },
                    address: [],
                    selection: { kind: "conjunction", statements: [ "A", "B" ] }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "A", kind: "free", description: "proposition" }, 
                            { name: "B", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "goal_A",
                                statement: "A"
                            },
                            {
                                label: "goal_B",
                                statement: "B"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An example with several conjuncts and additional goals",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "A", kind: "free", description: "proposition" }, 
                            { name: "B", kind: "free", description: "proposition" },
                            { name: "C", kind: "free", description: "proposition" },
                            { name: "D", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "conjunction",
                                    statements: [ "A", "B", "C" ]
                                }
                            },
                            {
                                label: "other_goal",
                                statement: "D"
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "main_goal" },
                    address: [],
                    selection: { kind: "conjunction", statements: [ "A", "B", "C" ] }
                }
            ] satisfies ProofStateSelection[],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "A", kind: "free", description: "proposition" }, 
                            { name: "B", kind: "free", description: "proposition" },
                            { name: "C", kind: "free", description: "proposition" },
                            { name: "D", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "goal_A",
                                statement: "A"
                            },
                            {
                                label: "goal_B",
                                statement: "B"
                            },
                            {
                                label: "goal_C",
                                statement: "C"
                            },
                            {
                                label: "other_goal",
                                statement: "D"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "A concrete example",
            inputState: {
                proofState: [
                    {
                        variables: [{ name: "X", kind: "free", description: "topological space" }],
                        hypotheses: [],
                        goals: [
                            {
                                label: "X_compact_and_hausdorff",
                                statement: {
                                    kind: "conjunction",
                                    statements: [ "$X$ is compact", "$X$ is Hausdorff" ]
                                }
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "X_compact_and_hausdorff" },
                    address: [],
                    selection: { kind: "conjunction", statements: [ "$X$ is compact", "$X$ is Hausdorff" ] }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [{ name: "X", kind: "free", description: "topological space" }],
                        hypotheses: [],
                        goals: [
                            {
                                label: "X_compact",
                                statement: "X is compact"
                            },
                            {
                                label: "X_hausdorff",
                                statement:"$X$ is Hausdorff"
                            }
                        ]
                    }
                ]
            },
            kind: "example"  
        },
        {
            description: "An abstract non-example",
            inputState: {
                proofState: [
                    {
                        variables: [{ name: "P", kind: "free", description: "proposition" }],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "P"
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "main_goal" },
                    address: [],
                    selection: "P"
                }
            ],
            outputState: null,
            comment: "This move is not relevant here, since the goal is not a conjunction.",
            kind: "non-example"
        },
        {
            description: "A non-example with an incorrect selection",
            inputState: {
                proofState: [
                    {
                        variables: [{ name: "P", kind: "free", description: "proposition" }],
                        hypotheses: [
                            {
                                label: "hyp_P",
                                statement: "P"
                            }
                        ],
                        goals: []
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "hypothesis", label: "hyp_P" },
                    address: [],
                    selection: "P"
                }
            ],
            outputState: null,
            comment: "This move is not relevant here, since the selection is a hypothesis rather than a goal.",
            kind: "non-example"
        }
    ]
}