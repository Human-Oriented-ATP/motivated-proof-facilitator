import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const goalDisjunctionMove: ProofDiscoveryMove = {
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
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "disjunction",
                                    statements: [ "$A$", "$B$" ]
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
                    address: [ { kind: "disjunction", idx: 0 } ],
                    selection: "$A$"
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "goal_A",
                                statement: "$A$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An example with several disjuncts",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "disjunction",
                                    statements: [ "$A$", "$B$", "$C$" ]
                                }
                            },
                            {
                                label: "other_goal",
                                statement: "$D$"
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "main_goal" },
                    address: [ { kind: "disjunction", idx: 2 } ],
                    selection: "$C$"
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "goal_C",
                                statement: "$C$"
                            },
                            {
                                label: "other_goal",
                                statement: "$D$"
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
                            { name: "$X$", kind: "free", description: "topological space" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "disjunction",
                                    statements: [
                                        "$X$ is first-countable",
                                        "$X$ is Hausdorff"
                                    ]
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
                    address: [ { kind: "disjunction", idx: 1 } ],
                    selection: "$X$ is Hausdorff"
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$X$", kind: "free", description: "topological space" }
                        ],
                        hypotheses: [],
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
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$A$"
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
                    selection: "$A$"
                }
            ],
            outputState: null,
            comment: "This is a non-example because the selected statement is not a disjunct within a disjunctive goal — the goal itself is atomic.",
            kind: "non-example"
        },
        {
            description: "A non-example where the entire disjunction is selected rather than one disjunct",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "disjunction",
                                    statements: [ "$A$", "$B$" ]
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
                    selection: { kind: "disjunction", statements: [ "$A$", "$B$" ] }
                }
            ],
            outputState: null,
            comment: "This move requires exactly one disjunct to be selected. Selecting the whole disjunction does not indicate which disjunct to commit to.",
            kind: "non-example"
        },
        {
            description: "A non-example where the selection is a hypothesis rather than a goal disjunct",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp",
                                statement: "$A$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "disjunction",
                                    statements: [ "$B$", "$C$" ]
                                }
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "hypothesis", label: "hyp" },
                    address: [],
                    selection: "$A$"
                }
            ],
            outputState: null,
            comment: "The move is not relevant here, since the selection is a hypothesis rather than a disjunct within a goal.",
            kind: "non-example"
        }
    ]
}