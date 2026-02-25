import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"

const goalDisjunctionMove: ProofDiscoveryMove = {
    name: "Choose a branch in a disjunctive goal",
    kind: "strengthening",
    trigger: "This move is relevant when the only selection in the proof state is a single disjunct within a goal statement that is a disjunction.",
    action: "Replace the disjunctive goal with the selected disjunct as the new goal.",
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
                                    kind: "disjunction",
                                    statements: [
                                        { kind: "highlight", statement: "A" },
                                        "B"
                                    ]
                                }
                            }
                        ]
                    }
                ]
            },
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
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An example with several disjuncts and the last one selected",
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
                                    kind: "disjunction",
                                    statements: [
                                        "A",
                                        "B",
                                        { kind: "highlight", statement: "C" }
                                    ]
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
                        variables: [
                            { name: "X", kind: "free", description: "topological space" }
                        ],
                        hypotheses: [
                            {
                                label: "X_metric",
                                statement: "$X$ is a metric space"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "disjunction",
                                    statements: [
                                        "$X$ is first-countable",
                                        { kind: "highlight", statement: "$X$ is Hausdorff" }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            },
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "X", kind: "free", description: "topological space" }
                        ],
                        hypotheses: [
                            {
                                label: "X_metric",
                                statement: "$X$ is a metric space"
                            }
                        ],
                        goals: [
                            {
                                label: "X_hausdorff",
                                statement: "$X$ is Hausdorff"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An abstract non-example where the goal is not a disjunction",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "A", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: { kind: "highlight", statement: "A" }
                            }
                        ]
                    }
                ]
            },
            outputState: null,
            comment: "This is a non-example because the highlighted statement is not a disjunct within a disjunctive goal — the goal itself is atomic.",
            kind: "non-example"
        },
        {
            description: "A non-example where the entire disjunction is selected rather than one disjunct",
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
                                    kind: "highlight",
                                    statement: {
                                        kind: "disjunction",
                                        statements: [ "A", "B" ]
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            outputState: null,
            comment: "This move requires exactly one disjunct to be selected. Highlighting the whole disjunction does not indicate which disjunct to commit to.",
            kind: "non-example"
        },
        {
            description: "A non-example where the selection is a hypothesis rather than a goal disjunct",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "A", kind: "free", description: "proposition" },
                            { name: "B", kind: "free", description: "proposition" },
                            { name: "C", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp",
                                statement: { kind: "highlight", statement: "A" }
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "disjunction",
                                    statements: [ "B", "C" ]
                                }
                            }
                        ]
                    }
                ]
            },
            outputState: null,
            comment: "The move is not relevant here, since the selection is a hypothesis rather than a disjunct within a goal.",
            kind: "non-example"
        }
    ]
}

export default goalDisjunctionMove
