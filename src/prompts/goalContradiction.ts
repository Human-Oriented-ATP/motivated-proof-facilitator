import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const goalContradictionMove: ProofDiscoveryMove = {
    name: "Prove by contradiction",
    kind: "equivalence",
    classification: "mathematical",
    trigger: "This move is relevant when the only selection in the proof state is a goal statement with \"negative content\".",
    action: "Assume the negation of the goal as a new hypothesis, simplified by pushing the negation through all logical connectives using standard equivalences: De Morgan's laws ($not (A and B) <=> not A or not B$, $not (A or B) <=> not A and not B$), negation of implication ($not (A => B) <=> A and not B$), negation of quantifiers ($not forall x, P(x) <=> exists x, not P(x)$, $not exists x, P(x) <=> forall x, not P(x)$), and double negation elimination ($not not A <=> A$). Replace the goal with a contradiction ($bot$). If there are other goals remaining, split into two proof contexts: one containing the new negated hypothesis and the contradiction as the new goal, and another containing the original hypotheses and the remaining goals.",
    examples: [
        {
            description: "A minimal abstract example with an atomic goal",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" }
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
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "h_not_A",
                                statement: {
                                    kind: "negation",
                                    statement: "$A$"
                                }
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$bot$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An abstract example where the goal involves multiple logical connectives",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", value: "", description: "$NN -> #text[Proposition]$" },
                            { name: "$Q$", kind: "free", value: "", description: "$NN -> #text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "universal",
                                    variable: { name: "$n$", description: "$NN$" },
                                    statement: {
                                        kind: "implication",
                                        antecedent: "$P(n)$",
                                        consequent: "$Q(n)$"
                                    }
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
                        variable: { name: "$n$", description: "$NN$" },
                        statement: {
                            kind: "implication",
                            antecedent: "$P(n)$",
                            consequent: "$Q(n)$"
                        }
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$P$", kind: "free", value: "", description: "$NN -> #text[Proposition]$" },
                            { name: "$Q$", kind: "free", value: "", description: "$NN -> #text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "h_exists_P_not_Q",
                                statement: {
                                    kind: "existential",
                                    variable: { name: "$n$", description: "$NN$" },
                                    statement: {
                                        kind: "conjunction",
                                        statements: [
                                            "$P(n)$",
                                            { kind: "negation", statement: "$Q(n)$" }
                                        ]
                                    }
                                }
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$bot$"
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
                            { name: "$f$", kind: "free", value: "", description: "$RR -> RR$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: {
                                    kind: "implication",
                                    antecedent: "$f$ is differentiable",
                                    consequent: "$f$ is continuous"
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
                        antecedent: "$f$ is differentiable",
                        consequent: "$f$ is continuous"
                    }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$f$", kind: "free", value: "", description: "$RR -> RR$" }
                        ],
                        hypotheses: [
                            {
                                label: "h_diff_not_cont",
                                statement: {
                                    kind: "conjunction",
                                    statements: [
                                        "$f$ is differentiable",
                                        { kind: "negation", statement: "$f$ is continuous" }
                                    ]
                                }
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$bot$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        },
        {
            description: "An abstract example with multiple goals",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$A$"
                            },
                            {
                                label: "other_goal",
                                statement: "$B$"
                            },
                            {
                                label: "another_goal",
                                statement: "$C$"
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
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "h_not_A",
                                statement: {
                                    kind: "negation",
                                    statement: "$A$"
                                }
                            }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$bot$"
                            }
                        ]
                    },
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "other_goal",
                                statement: "$B$"
                            },
                            {
                                label: "another_goal",
                                statement: "$C$"
                            }
                        ]
                    }
                ]
            },
            kind: "example"
        }
    ]
}
