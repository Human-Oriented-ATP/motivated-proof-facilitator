import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"

const hypothesisConjunctionMove: ProofDiscoveryMove = {
    name: "Split a conjunction in a hypothesis",
    kind: "strengthening",
    trigger: "This move is relevant when the only selection in the proof state is a hypothesis statement that is a conjunction.",
    action: "Split the conjunction into separate hypotheses, one corresponding to each conjunct.",
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
                        hypotheses: [
                            {
                                label: "conj_hyp",
                                statement: {
                                    kind: "highlight", 
                                    statement: {
                                        kind: "conjunction",
                                        statements: [ "A", "B" ]
                                    }
                                }
                            }
                        ],
                        goals: []
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
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: "A"
                            },
                            {
                                label: "hyp_B",
                                statement:"B"
                            }
                        ],
                        goals: []
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
                            { name: "A", kind: "free", description: "proposition" },
                            { name: "B", kind: "free", description: "proposition" },
                            { name: "C", kind: "free", description: "proposition" },
                            { name: "D", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [
                            {
                                label: "conj_hyp",
                                statement: {
                                    kind: "highlight",
                                    statement: {
                                        kind: "conjunction",
                                        statements: [ "A", "B", "C" ]
                                    }
                                }
                            },
                            {
                                label: "other_hyp",
                                statement: "D"
                            }
                        ],
                        goals: []
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
                        hypotheses: [
                            {   
                                label: "hyp_A",
                                statement: "A"
                            },
                            {   
                                label: "hyp_B",
                                statement: "B"
                            },
                            {   
                                label: "hyp_C",
                                statement: "C"
                            },
                            {
                                label: "other_hyp",
                                statement: "D"
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
                      variables: [{ name: "X", kind: "free", description: "topological space" }],
                      hypotheses: [
                          {   label: "X_compact_hausdorff",
                              statement: {
                                  kind: "highlight", 
                                  statement: {
                                      kind: "conjunction",
                                      statements: [
                                          "$X$ is compact", "$X$ is Hausdorff"
                                      ]
                                  }
                              }
                          }
                      ],
                      goals: []
                  }
              ]
            },
            outputState: {
                proofState: [
                   {
                        variables: [{ name: "X", kind: "free", description: "topological space" }],
                        hypotheses: [
                            { label: "X_compact", statement: "$X$ is compact" },
                            { label: "X_hausdorff", statement: "$X$ is Hausdorff" }
                        ],
                        goals: []
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
                            { name: "A", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [
                            {
                                label: "hyp_A",
                                statement: {
                                    kind: "highlight",
                                    statement: "A"
                                }
                            }
                        ],
                        goals: []
                    }
                ]
            },
            outputState: null,
            comment: "This is a non-example because the highlighted hypothesis is not a conjunction.",
            kind: "non-example"
        },
        {
            description: "A non-example involving an incorrect selection",
            inputState: {
                proofState: [
                    {
                        variables: [
                            { name: "A", kind: "free", description: "proposition" }
                        ],
                        hypotheses: [],
                        goals: [
                            {
                                label: "goal_A",
                                statement: {
                                    kind: "highlight",
                                    statement: "A"
                                }
                            }
                        ]
                    }
                ]
            },
            outputState: null,
            comment: "The move is not relevant here, since the selection is a goal rather than a hypothesis.",
            kind: "non-example"
        }
    ]
}