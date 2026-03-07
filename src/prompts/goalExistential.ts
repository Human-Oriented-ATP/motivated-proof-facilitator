import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const goalExistentialMove: ProofDiscoveryMove = {
    name: "Peel existentially quantified variable in the goal",
    kind: "equivalence",
    trigger: "This move is relevant when the only selection in the proof state is either a goal statement that is an existentially quantified statement, or the existentially quantified variable within such a goal.",
    action: "Introduce the existentially quantified variable as a new metavariable at the bottom of the variables list and replace the goal with the body of the existential statement. If there are other goals remaining, split into two proof contexts: one containing the newly introduced metavariable and the body as the new goal, and another containing the original variables and the remaining goals.",
    examples: [
        {
            description: "A minimal abstract example with the whole goal selected",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "existential",
                                    variable: { name: "$a$", description: "$NN$" },
                                    statement: "$P(a)$"
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
                    selection: {
                        kind: "existential",
                        variable: { name: "$a$", description: "$NN$" },
                        statement: "$P(a)$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" },
                            { name: "$a$", kind: "meta", description: "$NN$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$P(a)$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "A minimal abstract example with just the variable selected",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "existential",
                                    variable: { name: "$a$", description: "$NN$" },
                                    statement: "$P(a)$"
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
                    address: [ "existential_var" ],
                    selection: "$a$"
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" },
                            { name: "$a$", kind: "meta", description: "$NN$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$P(a)$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An abstract example with multiple goals: the selected goal is split off into a new proof context",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "exists_goal",
                                statement: {
                                    kind: "existential",
                                    variable: { name: "$a$", description: "$NN$" },
                                    statement: "$P(a)$"
                                }
                            },
                            {
                                label: "other_goal",
                                statement: "$B$"
                            },
                            {
                                label: "yet_another_goal",
                                statement: "$C$"
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "exists_goal" },
                    address: [],
                    selection: {
                        kind: "existential",
                        variable: { name: "$a$", description: "$NN$" },
                        statement: "$P(a)$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" },
                            { name: "$a$", kind: "meta", description: "$NN$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "exists_goal",
                                statement: "$P(a)$"
                            }
                        ]
                    },
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[Proposition]$" },
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "other_goal",
                                statement: "$B$"
                            },
                            {
                                label: "yet_another_goal",
                                statement: "$C$"
                            }
                        ]
                    },
                ]
            },
            kind: "example"
        },
        {
            description: "A non-example where the goal is not existentially quantified",
            inputState: {
                proofState: [
                    {
                        variables: [],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$P$"
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
                    selection: "$P$"
                }
            ],
            outputState: null,
            comment: "This move is not relevant here since the selected goal is not an existentially quantified statement.",
            kind: "non-example"
        },
        {
            description: "A non-example where the selection is a hypothesis rather than a goal",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$a$", kind: "free", description: "$NN$" },
                            { name: "$P$", kind: "free", description: "$NN -> \"proposition\"$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp",
                                statement: {
                                    kind: "existential",
                                    variable: { name: "$b$", description: "$NN$" },
                                    statement: "$P(b)$"
                                }
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$Q$"
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
                    selection: {
                        kind: "existential",
                        variable: { name: "$b$", description: "$NN$" },
                        statement: "$P(b)$"
                    }
                }
            ],
            outputState: null,
            comment: "This move is not relevant here since the selection is a hypothesis, not a goal. Peeling an existential quantifier from a hypothesis is a different move.",
            kind: "non-example"
        }
    ]
}