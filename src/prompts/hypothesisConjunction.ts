import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const hypothesisConjunctionMove: ProofDiscoveryMove = {
    name: "Split a conjunction in a hypothesis",
    kind: "equivalence",
    classification: "logical",
    trigger: "This move is relevant when the only selection in the proof state is a hypothesis statement that is a conjunction.",
    action: "Split the conjunction into separate hypotheses, one corresponding to each conjunct.",
    examples: [
        {
            description: "A minimal abstract example",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" }, 
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "conj_hyp",
                                statement: {
                                    kind: "conjunction",
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
                    location: { kind: "hypothesis", label: "conj_hyp" },
                    address: [],
                    selection: { kind: "conjunction", statements: [ "$A$", "$B$" ] }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" }, 
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "$A$"
                            },
                            {
                                label: "hyp_B",
                                statement:"$B$"
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
            description: "An abstract example with several conjuncts and additional hypotheses",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$D$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "conj_hyp",
                                statement: {
                                    kind: "conjunction",
                                    statements: [ "$A$", "$B$", "$C$" ]
                                }
                            },
                            {
                                label: "other_hyp",
                                statement: "$D$"
                            }
                        ],
                        goals: []
                    }
                ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "hypothesis", label: "conj_hyp" },
                    address: [],
                    selection: { kind: "conjunction", statements: [ "$A$", "$B$", "$C$" ] }
                }
            ],
            outputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$B$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$C$", kind: "free", value: "", description: "$#text[Proposition]$" },
                            { name: "$D$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {   
                                label: "hyp_A",
                                statement: "$A$"
                            },
                            {   
                                label: "hyp_B",
                                statement: "$B$"
                            },
                            {   
                                label: "hyp_C",
                                statement: "$C$"
                            },
                            {
                                label: "other_hyp",
                                statement: "$D$"
                            }
                        ],
                        goals: []
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
                      variables: [{ name: "$X$", kind: "free", value: "", description: "topological space" }],
                      hypotheses: [
                          {   label: "X_compact_hausdorff",
                              statement: {
                                  kind: "conjunction",
                                  statements: [
                                      "$X$ is compact", "$X$ is Hausdorff"
                                  ]
                              }
                          }
                      ],
                      goals: [
                        {
                            label: "main_goal",
                            statement: "$X$ is compact"
                        }
                      ]
                  }
              ]
            },
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "hypothesis", label: "X_compact_hausdorff" },
                    address: [],
                    selection: { kind: "conjunction", statements: [ "$X$ is compact", "$X$ is Hausdorff" ] }
                }
            ],
            outputState: {
                proofState: [
                   {
                        variables: [{ name: "$X$", kind: "free", value: "", description: "topological space" }],
                        hypotheses: [
                            { label: "X_compact", statement: "$X$ is compact" },
                            { label: "X_hausdorff", statement: "$X$ is Hausdorff" }
                        ],
                        goals: [
                            {
                                label: "main_goal",
                                statement: "$X$ is compact"
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
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "$A$"
                            }
                        ],
                        goals: []
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
            comment: "This is a non-example because the selected hypothesis is not a conjunction.",
            kind: "non-example"
        },
        {
            description: "A non-example involving an incorrect selection",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "$A$", kind: "free", value: "", description: "$#text[Proposition]$" }
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
            selections: [
                {
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "goal_A" },
                    address: [],
                    selection: "$A$"
                }
            ],
            outputState: null,
            comment: "The move is not relevant here, since the selection is a goal rather than a hypothesis.",
            kind: "non-example"
        }
    ]
}