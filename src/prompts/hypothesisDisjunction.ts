import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const hypothesisDisjunctionMove: ProofDiscoveryMove = {
    name: "Perform case distinction on a disjunctive hypothesis",
    kind: "strengthening",
    trigger: "This move is relevant when the only selection in the proof state is a hypothesis statement that is a disjunction.",
    action: "Split the disjunction into separate proof states (cases), one corresponding to each disjunct. In each case, the disjunctive hypothesis is replaced by the corresponding disjunct as a new hypothesis.",
    examples: [
        {
            description: "A minimal abstract example",
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
                                label: "disj_hyp",
                                statement: {
                                    kind: "disjunction",
                                    statements: [ "$A$", "$B$" ]
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
                    location: { kind: "hypothesis", label: "disj_hyp" },
                    address: [],
                    selection: { kind: "disjunction", statements: [ "$A$", "$B$" ] }
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
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$C$"
                            }
                        ]
                    },
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
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
            description: "An abstract example with several disjuncts and additional hypotheses",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$E$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "disj_hyp",
                                statement: {
                                    kind: "disjunction",
                                    statements: [ "$A$", "$B$", "$C$" ]
                                }
                            },
                            {
                                label: "other_hyp",
                                statement: "$D$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$E$"
                            }
                        ]
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "hypothesis", label: "disj_hyp" },
                    address: [],
                    selection: { kind: "disjunction", statements: [ "$A$", "$B$", "$C$" ] }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$E$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "$A$"
                            },
                            {
                                label: "other_hyp",
                                statement: "$D$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$E$"
                            }
                        ]
                    },
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$E$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_B",
                                statement: "$B$"
                            },
                            {
                                label: "other_hyp",
                                statement: "$D$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$E$"
                            }
                        ]
                    },
                    {
                        variables: [
                            { name: "$A$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$B$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$C$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$D$", kind: "free", description: "$#text[proposition]$" },
                            { name: "$E$", kind: "free", description: "$#text[proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_C",
                                statement: "$C$"
                            },
                            {
                                label: "other_hyp",
                                statement: "$D$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$E$"
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
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "hypothesis", label: "hyp_A" },
                    address: [],
                    selection: "$A$"
                }
            ],
            outputState: null,
            comment: "This is a non-example because the selected hypothesis is not a disjunction.",
            kind: "non-example"
        },
        {
            description: "A non-example involving an incorrect selection",
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
            comment: "The move is not relevant here, since the selection is a goal rather than a hypothesis.",
            kind: "non-example"
        }
    ]
}
