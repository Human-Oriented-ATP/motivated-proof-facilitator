import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const goalUniversalMove: ProofDiscoveryMove = {
    name: "Peel universally quantified variable in the goal",
    kind: "equivalence",
    classification: "logical",
    trigger: "This move is relevant when the only selection in the proof state is either a goal statement that is a universally quantified statement, or the universally quantified variable within such a goal.",
    action: "Introduce the universally quantified variable as a new free variable and replace the goal with the body of the universally quantified statement. If a variable of that name already exists in the list of variables, please rename the universally quantified variable in the statement before proceeding. If there are other goals remaining, split into two proof contexts: one containing the newly introduced variable and the body as the new goal, and another containing the original variables and the remaining goals.",
    examples: [
        {
            description: "A minimal abstract example with the whole goal selected",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "universal",
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
                        kind: "universal",
                        variable: { name: "$a$", description: "$NN$" },
                        statement: "$P(a)$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" },
                            { name: "$a$", kind: "free", value: "", description: "$NN$" }
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
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "universal",
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
                    address: [ "universal_var" ],
                    selection: "$a$"
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" },
                            { name: "$a$", kind: "free", value: "", description: "$NN$" }
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
            description: "An abstract example with existing variables, hypotheses, and a single goal",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$Q$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "$A$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "universal",
                                    variable: { name: "$a$", description: "$NN$" },
                                    statement: "$Q(a)$"
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
                        kind: "universal",
                        variable: { name: "$a$", description: "$NN$" },
                        statement: "$Q(a)$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$Q$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" },
                            { name: "$a$", kind: "free", value: "", description: "$NN$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "$A$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$Q(a)$"
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
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "univ_goal",
                                statement: {
                                    kind: "universal",
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
                    location: { kind: "goal", label: "univ_goal" },
                    address: [],
                    selection: {
                        kind: "universal",
                        variable: { name: "$a$", description: "$NN$" },
                        statement: "$P(a)$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" },
                            { name: "$a$", kind: "free", value: "", description: "$NN$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "univ_goal",
                                statement: "$P(a)$"
                            }
                        ]
                    },
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" }
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
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "A non-example where the goal is not universally quantified",
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
            comment: "This move is not relevant here since the selected goal is not a universally quantified statement.",
            kind: "non-example"
        },
        {
            description: "A non-example where the selection is a hypothesis rather than a goal",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$a$", kind: "free", value: "", description: "$NN$" },
                            { name: "$P$", kind: "free", value: "", description: "$NN -> \"Proposition\"$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp",
                                statement: {
                                    kind: "universal",
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
                        kind: "universal",
                        variable: { name: "$b$", description: "$NN$" },
                        statement: "$P(b)$"
                    }
                }
            ],
            outputState: null,
            comment: "This move is not relevant here since the selection is a hypothesis, not a goal. Peeling a universal quantifier from a hypothesis is a different move.",
            kind: "non-example"
        }
    ]
}
