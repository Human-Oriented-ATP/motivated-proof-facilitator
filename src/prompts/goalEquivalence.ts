import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const goalEquivalenceMove: ProofDiscoveryMove = {
    name: "Split an equivalence in the goal into two implications",
    kind: "equivalence",
    trigger: "This move is relevant when the only selection in the proof state is a goal statement that is a biconditional (equivalence).",
    action: "Replace the equivalence goal $A <=> B$ with two implication goals: $A => B$ (the forward direction) and $B => A$ (the backward direction), keeping all other goals unchanged.",
    examples: [
        {
            description: "A minimal abstract example",
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
                                    kind: "equivalence",
                                    left: "$A$",
                                    right: "$B$"
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
                        kind: "equivalence",
                        left: "$A$",
                        right: "$B$"
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
                        hypotheses: [],
                        goals: [
                            {
                                label: "forward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$A$",
                                    consequent: "$B$"
                                }
                            },
                            {
                                label: "backward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$B$",
                                    consequent: "$A$"
                                }
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An abstract example with existing hypotheses",
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
                                label: "hyp_C",
                                statement: "$C$"
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "equivalence",
                                    left: "$A$",
                                    right: "$B$"
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
                        kind: "equivalence",
                        left: "$A$",
                        right: "$B$"
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
                                label: "hyp_C",
                                statement: "$C$"
                            }
                        ],
                        goals: [
                            {
                                label: "forward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$A$",
                                    consequent: "$B$"
                                }
                            },
                            {
                                label: "backward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$B$",
                                    consequent: "$A$"
                                }
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An abstract example with additional goals: the new implication goals are inserted in place of the equivalence goal",
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
                                label: "equiv_goal",
                                statement: {
                                    kind: "equivalence",
                                    left: "$A$",
                                    right: "$B$"
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
                    location: { kind: "goal", label: "equiv_goal" },
                    address: [],
                    selection: {
                        kind: "equivalence",
                        left: "$A$",
                        right: "$B$"
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
                        hypotheses: [],
                        goals: [
                            {
                                label: "forward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$A$",
                                    consequent: "$B$"
                                }
                            },
                            {
                                label: "backward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$B$",
                                    consequent: "$A$"
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
            kind: "example"
        },
        {
            description: "A concrete example",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$G$", kind: "free", description: "group" },
                            { name: "$H$", kind: "free", description: "group" },
                            { name: "$phi$", kind: "free", description: "$G -> H$" }
                        ],
                        hypotheses: [{
                            label: "phi_homomorphism",
                            statement: "$phi$ is a group homomorphism"
                        }],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "equivalence",
                                    left: "$phi$ is injective",
                                    right: "$ker(phi) = {e_G}$"
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
                        kind: "equivalence",
                        left: "$phi$ is injective",
                        right: "$ker(phi) = {e_G}$"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$G$", kind: "free", description: "group" },
                            { name: "$H$", kind: "free", description: "group" },
                            { name: "$phi$", kind: "free", description: "$G -> H$" }
                        ],
                        hypotheses: [{
                            label: "phi_homomorphism",
                            statement: "$phi$ is a group homomorphism"
                        }],
                        goals: [
                            {
                                label: "forward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$phi$ is injective",
                                    consequent: "$ker(phi) = {e_G}$"
                                }
                            },
                            {
                                label: "backward",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$ker(phi) = {e_G}$",
                                    consequent: "$phi$ is injective"
                                }
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "A non-example where the goal is not an equivalence",
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
            outputState: null,
            comment: "This move is not relevant here since the selected goal is an implication, not an equivalence.",
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
                                label: "hyp_equiv",
                                statement: {
                                    kind: "equivalence",
                                    left: "$A$",
                                    right: "$B$"
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
                    location: { kind: "hypothesis", label: "hyp_equiv" },
                    address: [],
                    selection: {
                        kind: "equivalence",
                        left: "$A$",
                        right: "$B$"
                    }
                }
            ],
            outputState: null,
            comment: "This move is not relevant here since the selection is a hypothesis, not a goal. Using an equivalence hypothesis is a different move.",
            kind: "non-example"
        }
    ]
}
