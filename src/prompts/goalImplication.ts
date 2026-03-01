import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const goalImplicationMove: ProofDiscoveryMove = {
    name: "Introduce hypothesis from an implication in the goal",
    kind: "equivalence",
    trigger: "This move is relevant when the only selection in the proof state is either a goal statement that is an implication, or the antecedent of such a goal.",
    action: "Move the antecedent of the implication into the hypotheses as a new hypothesis and replace the goal with the consequent of the implication. If there are other goals remaining, split into two proof contexts: one containing the new hypothesis and the consequent as the new goal, and another containing the original hypotheses and the remaining goals.",
    examples: [
        {
            description: "A minimal abstract example with the whole goal selected",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$A$",
                                    consequent: "$B$"
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
                        kind: "implication",
                        antecedent: "$A$",
                        consequent: "$B$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" }
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
                                statement: "$B$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "A minimal abstract example with just the antecedent selected",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$A$",
                                    consequent: "$B$"
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
                    address: [ "implication_antecedent" ],
                    selection: "$A$"
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" }
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
                                statement: "$B$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An abstract example with existing variables, hypotheses, and a single implication goal",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" }
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
                                    kind: "implication",
                                    antecedent: "$B$",
                                    consequent: "$C$"
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
                        kind: "implication",
                        antecedent: "$B$",
                        consequent: "$C$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "$A$"
                            },
                            {
                                label: "hyp_B",
                                statement: "$B$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$C$"
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
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "impl_goal",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$A$",
                                    consequent: "$B$"
                                }
                            },
                            {
                                label: "other_goal",
                                statement: "$C$"
                            },
                            {
                                label: "yet_another_goal",
                                statement: "$D$"
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "impl_goal" },
                    address: [],
                    selection: {
                        kind: "implication",
                        antecedent: "$A$",
                        consequent: "$B$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "$A$"
                            }
                        ],
                        goals: [
                            {
                                label: "impl_goal",
                                statement: "$B$"
                            }
                        ]
                    },
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "other_goal",
                                statement: "$C$"
                            },
                            {
                                label: "yet_another_goal",
                                statement: "$D$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "A non-example where the goal is not an implication",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" }
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
            comment: "This move is not relevant here since the selected goal is not an implication.",
            kind: "non-example"
        },
        {
            description: "A non-example where the selection is a hypothesis rather than a goal",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_impl",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$A$",
                                    consequent: "$B$"
                                }
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$C$"
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "hypothesis", label: "hyp_impl" },
                    address: [],
                    selection: {
                        kind: "implication",
                        antecedent: "$A$",
                        consequent: "$B$"
                    }
                }
            ],
            outputState: null,
            comment: "This move is not relevant here since the selection is a hypothesis, not a goal. Using an implication hypothesis to derive new facts is a different move.",
            kind: "non-example"
        }
    ]
}
