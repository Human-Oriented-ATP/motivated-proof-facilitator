import { ProofDiscoveryMove, ProofDiscoverySuggestionMove } from "../core/ProofDiscoveryMove"
import { goalBackwardsReasoningPrompt } from "./goalBackwardsReasoning"
import { hypothesisFowardsReasoningPrompt } from "./hypothesisForwardsReasoning"
import { equivalentStatementsPrompt } from "./equivalentStatements"

export const suggestionMoves: ProofDiscoverySuggestionMove[] = [
    equivalentStatementsPrompt,
    hypothesisFowardsReasoningPrompt,
    goalBackwardsReasoningPrompt
]

export const moves: ProofDiscoveryMove[] = 
[
  {
    "name": "Prove by contradiction",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "mathematical",
    "trigger": "This move is relevant when the only selection in the proof state is a goal statement with \"negative content\".",
    "action": "Assume the negation of the goal as a new hypothesis, simplified by pushing the negation through all logical connectives using standard equivalences: De Morgan's laws ($not (A and B) <=> not A or not B$, $not (A or B) <=> not A and not B$), negation of implication ($not (A => B) <=> A and not B$), negation of quantifiers ($not forall x, P(x) <=> exists x, not P(x)$, $not exists x, P(x) <=> forall x, not P(x)$), and double negation elimination ($not not A <=> A$). Replace the goal with a contradiction ($bot$). If there are other goals remaining, split into two proof contexts: one containing the new negated hypothesis and the contradiction as the new goal, and another containing the original hypotheses and the remaining goals.",
    "examples": [
      {
        "description": "A minimal abstract example with an atomic goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$A$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "h_not_A",
                  "statement": {
                    "kind": "negation",
                    "statement": "$A$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$bot$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example where the goal involves multiple logical connectives",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> #text[Proposition]$"
                },
                {
                  "name": "$Q$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> #text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$n$",
                      "description": "$NN$"
                    },
                    "statement": {
                      "kind": "implication",
                      "antecedent": "$P(n)$",
                      "consequent": "$Q(n)$"
                    }
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "universal",
              "variable": {
                "name": "$n$",
                "description": "$NN$"
              },
              "statement": {
                "kind": "implication",
                "antecedent": "$P(n)$",
                "consequent": "$Q(n)$"
              }
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> #text[Proposition]$"
                },
                {
                  "name": "$Q$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> #text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "h_exists_P_not_Q",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$n$",
                      "description": "$NN$"
                    },
                    "statement": {
                      "kind": "conjunction",
                      "statements": [
                        "$P(n)$",
                        {
                          "kind": "negation",
                          "statement": "$Q(n)$"
                        }
                      ]
                    }
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$bot$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A concrete example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$f$",
                  "kind": "free",
                  "value": "",
                  "description": "$RR -> RR$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$f$ is differentiable",
                    "consequent": "$f$ is continuous"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "implication",
              "antecedent": "$f$ is differentiable",
              "consequent": "$f$ is continuous"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$f$",
                  "kind": "free",
                  "value": "",
                  "description": "$RR -> RR$"
                }
              ],
              "hypotheses": [
                {
                  "label": "h_diff_not_cont",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$f$ is differentiable",
                      {
                        "kind": "negation",
                        "statement": "$f$ is continuous"
                      }
                    ]
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$bot$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with multiple goals",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$A$"
                },
                {
                  "label": "other_goal",
                  "statement": "$B$"
                },
                {
                  "label": "another_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "h_not_A",
                  "statement": {
                    "kind": "negation",
                    "statement": "$A$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$bot$"
                }
              ]
            },
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "other_goal",
                  "statement": "$B$"
                },
                {
                  "label": "another_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      }
    ]
  },
  {
    "name": "Rewrite using equality result",
    "kind": "strengthening",
    "runWithGuardrails": true,
    "classification": "mathematical",
    "trigger": "This move is relevant when the proof state has exactly two selections, one of which is a hypothesis or library result whose conclusion is an equality, and the second selection is a term.",
    "action": "Rewrite the selected term using the selected equality result, i.e., replace the selected term with an expression derived from one side of the equality if the other side matches the selected term. If the equality is conditional on other statements, introduce those statements as new goals. If the equality involves universally quantified variables, instantiate them appropriately while performing the rewrite. \n\nModify only the selected term and keep the rest of the proof state (included the selected equality result) intact. ",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha -> alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "eq_hyp",
                  "statement": "$a = b$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$f(a) = f(b)$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "eq_hyp"
            },
            "address": [],
            "selection": "$a = b$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "a",
              "source_start": 2,
              "source_end": 3,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha -> alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "eq_hyp",
                  "statement": "$a = b$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$f(b) = f(b)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha -> alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$alpha -> #text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "eq_hyp",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$x$",
                      "description": "$alpha$"
                    },
                    "statement": {
                      "kind": "implication",
                      "antecedent": "$P(x)$",
                      "consequent": "$f(x) = a$"
                    }
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P(f(b))$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "eq_hyp"
            },
            "address": [],
            "selection": {
              "kind": "universal",
              "variable": {
                "name": "$x$",
                "description": "$alpha$"
              },
              "statement": {
                "kind": "implication",
                "antecedent": "$P(x)$",
                "consequent": "$f(x) = a$"
              }
            }
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "f(b)",
              "source_start": 2,
              "source_end": 6,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha -> alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$alpha -> #text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "eq_hyp",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$x$",
                      "description": "$alpha$"
                    },
                    "statement": {
                      "kind": "implication",
                      "antecedent": "$P(x)$",
                      "consequent": "$f(x) = a$"
                    }
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P(a)$"
                },
                {
                  "label": "side_goal",
                  "statement": "$P(b)$"
                }
              ]
            }
          ]
        },
        "comment": "The expression $f(b)$ unifies with the pattern $f(x)$, and the condition $P(x)$ generates a goal $P(b)$ as a result.",
        "kind": "example"
      }
    ]
  },
  {
    "name": "Unfold the definition",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "mathematical",
    "trigger": "This move is relevant when there is a single selection in the proof state, ideally representing a definition that can be unfold to something more concrete.",
    "action": "This move unfolds the selected definition and replaces it with an equivalent expression, usually conceptually simpler than the original. When there are multiple possibilities, definitions at a higher level of abstraction are favoured. Care must be taken to ensure that the variable names in the unfolded definition, including bound variable names, do not clash with existing variable names in the proof state. Use different letters of the alphabet for new variable names wherever possible.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "n_even",
                  "statement": "$n$ is even"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "n_even"
            },
            "address": [],
            "selection": "$n$ is even"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "n_even",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$k$",
                      "description": "$NN$"
                    },
                    "statement": "$n = 2k$"
                  }
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$beta$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha ->beta$"
                }
              ],
              "hypotheses": [
                {
                  "label": "f_inj",
                  "statement": "$f$ is injective"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "f_inj"
            },
            "address": [],
            "selection": "$f$ is injective"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$beta$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha ->beta$"
                }
              ],
              "hypotheses": [
                {
                  "label": "f_inj",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$x$",
                      "description": "$alpha$"
                    },
                    "statement": {
                      "kind": "universal",
                      "variable": {
                        "name": "$y$",
                        "description": "$alpha$"
                      },
                      "statement": {
                        "kind": "implication",
                        "antecedent": "$f(x) = f(y)$",
                        "consequent": "$x = y$"
                      }
                    }
                  }
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$X$",
                  "description": "metric space"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$U$",
                  "description": "subset of $X$"
                }
              ],
              "hypotheses": [
                {
                  "label": "U_closed",
                  "statement": "$U$ is closed"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "U_closed"
            },
            "address": [],
            "selection": "$U$ is closed"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$X$",
                  "description": "metric space"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$U$",
                  "description": "subset of $X$"
                }
              ],
              "hypotheses": [
                {
                  "label": "U_closed",
                  "statement": "$U^c$ is open"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "n_odd",
                  "statement": "$n$ is odd"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "n_odd"
            },
            "address": [],
            "selection": "$n$ is odd"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "n_odd",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$k$",
                      "description": "$NN$"
                    },
                    "statement": "$n = 2k + 1$"
                  }
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      }
    ]
  },
  {
    "name": "Simplify the selected expression",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "mathematical",
    "trigger": "This move is relevant when the proof state has a single selection, ideally representing a term that can be simplified. This move also applies to composite statements that can be simplified, not just expressions within atomic statements.",
    "action": "This move replaces the selected expression with an equivalent one that is simpler in an intuitive sense.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$ZZ -> #text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$ZZ$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$y$",
                  "description": "$ZZ$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P(x + 2 dot y - x - y)$"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "P_hyp"
            },
            "address": [],
            "selection": {
              "text": "(x + 2 dot y - x - y)",
              "source_start": 1,
              "source_end": 22,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$ZZ -> #text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$ZZ$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$y$",
                  "description": "$ZZ$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P(y)$"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$G$",
                  "description": "Group"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$G$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$G$"
                }
              ],
              "hypotheses": [
                {
                  "label": "G_eq",
                  "statement": "$(a^(-1))^(-1) dot b dot b^(-1) = a$ "
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "G_eq"
            },
            "address": [],
            "selection": {
              "text": "(a^(-1))^(-1)",
              "source_start": 0,
              "source_end": 13,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$G$",
                  "description": "Group"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$G$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$G$"
                }
              ],
              "hypotheses": [
                {
                  "label": "G_eq",
                  "statement": "$a dot b dot b^(-1) = a$"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$RR$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$x dot (sin^2(x) + cos^2(x)) - x = 0$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "(sin^2(x) + cos^2(x))",
              "source_start": 6,
              "source_end": 27,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$RR$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$x dot 1 - x = 0$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      }
    ]
  },
  {
    "name": "Isolate the selected variable in the (in)equality",
    "kind": "equivalence",
    "classification": "mathematical",
    "runWithGuardrails": true,
    "trigger": "This move is relevant when the proof state contains two selections, one of which is an equation or inequality, and the other is a variable within that equation or inequality.",
    "action": "Manipulate the equality or inequality using valid operations to make one of the sides the selected variable and the other an expression which does not contain the variable.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$y$",
                  "description": "$RR$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$2 dot x + 3 dot y = 7$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "2 dot x + 3 dot y = 7",
              "source_start": 0,
              "source_end": 21,
              "index": 0
            }
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "y",
              "source_start": 16,
              "source_end": 17,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$y$",
                  "description": "$RR$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$y = (7 - 2 dot x)/3$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "name": "$a$",
                  "description": "$RR$",
                  "value": ""
                },
                {
                  "kind": "free",
                  "name": "$b$",
                  "description": "$RR$",
                  "value": ""
                },
                {
                  "kind": "free",
                  "name": "$c$",
                  "description": "$RR$",
                  "value": ""
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$5 (a - c) <= b$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "a",
              "source_start": 3,
              "source_end": 4,
              "index": 0
            }
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "5 (a - c) <= b",
              "source_start": 0,
              "source_end": 14,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$a$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$b$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$c$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$a <= (b/5 + c)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$a$",
                  "description": "$RR_(>0)$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$b$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$c$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$log(a) + b < c$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "a",
              "source_start": 4,
              "source_end": 5,
              "index": 0
            }
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "log(a) + b < c",
              "source_start": 0,
              "source_end": 14,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$a$",
                  "description": "$RR_(>0)$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$b$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$c$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$a < exp(c - b)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      }
    ]
  },
  {
    "name": "Discharge obviously true goal",
    "kind": "strengthening",
    "classification": "mathematical",
    "runWithGuardrails": true,
    "trigger": "This move appears when the selections contain a single goal statement and any number of hypotheses, where the goal is a simple fact that is trivially true given the selected hypotheses, and the proof does not rely on any unselected hypotheses.",
    "action": "Remove the goal from the list of goals. Include a proof that the goal can be deduced from the selected hypotheses. ",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$x = x$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$x = x$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$1$ is an odd number"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$1$ is an odd number"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [],
              "hypotheses": [],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [],
              "hypotheses": [],
              "goals": [
                {
                  "label": "flt",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$n$",
                      "description": "$NN$"
                    },
                    "statement": {
                      "kind": "universal",
                      "variable": {
                        "name": "$x$",
                        "description": "$NN$"
                      },
                      "statement": {
                        "kind": "universal",
                        "variable": {
                          "name": "$y$",
                          "description": "$NN$"
                        },
                        "statement": {
                          "kind": "implication",
                          "antecedent": {
                            "kind": "conjunction",
                            "statements": [
                              "$n > 2$",
                              "$x^n + y^n = z^n$"
                            ]
                          },
                          "consequent": "$x dot y dot z = 0$"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "flt"
            },
            "address": [],
            "selection": {
              "kind": "universal",
              "variable": {
                "name": "$n$",
                "description": "$NN$"
              },
              "statement": {
                "kind": "universal",
                "variable": {
                  "name": "$x$",
                  "description": "$NN$"
                },
                "statement": {
                  "kind": "universal",
                  "variable": {
                    "name": "$y$",
                    "description": "$NN$"
                  },
                  "statement": {
                    "kind": "implication",
                    "antecedent": {
                      "kind": "conjunction",
                      "statements": [
                        "$n > 2$",
                        "$x^n + y^n = z^n$"
                      ]
                    },
                    "consequent": "$x dot y dot z = 0$"
                  }
                }
              }
            }
          }
        ],
        "outputState": null,
        "comment": "Since the goal statement is not a simple fact that feels obviously true, the move should not be applied.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Perform goal-directed forwards reasoning",
    "kind": "strengthening",
    "classification": "mathematical",
    "runWithGuardrails": false,
    "trigger": "This move appears when the user has selected at least one hypothesis and at least one goal in the same proof context.",
    "action": "This move creates a new hypothesis that is derived from some of the selected hypotheses and is syntactically similar to at least one of the selected goals. \nSyntactic similarity means that the parse tree of the new hypothesis matches better with that of one of the selected goals.\n\nIt is important that the new statement is a mathematical consequence of the selected hypotheses. Include a proof of the fact that the suggestion follows from the selected hypotheses in the reasoning trace. Do not make deductions from unselected hypotheses.\n\nFavour suggestions that use all information in the hypotheses and create strong matches with one of the selected goals.\n\nAvoid dropping the level of abstraction, and avoid introducing hypotheses that already exist in the proof state.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$X$",
                  "description": "$#text[Topological space]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$U$",
                  "description": "subset of $X$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$V$",
                  "description": "subset of $X$"
                }
              ],
              "hypotheses": [
                {
                  "label": "U_open",
                  "statement": "$U$ is open"
                },
                {
                  "label": "V_closed",
                  "statement": "$V$ is closed"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$U^c sect V$ is closed"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "U_open"
            },
            "address": [],
            "selection": "$U$ is open"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$U^c sect V$ is closed"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$X$",
                  "description": "$#text[Topological space]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$U$",
                  "description": "subset of $X$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$V$",
                  "description": "subset of $X$"
                }
              ],
              "hypotheses": [
                {
                  "label": "U_open",
                  "statement": "$U$ is open"
                },
                {
                  "label": "V_closed",
                  "statement": "$V$ is closed"
                },
                {
                  "label": "U_complement_closed",
                  "statement": "$U^c$ is closed"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$U^c sect V$ is closed"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$c$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$d$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$RR$"
                }
              ],
              "hypotheses": [
                {
                  "label": "a_le_c",
                  "statement": "$a <= c$"
                },
                {
                  "label": "b_le_d",
                  "statement": "$b <= d$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$a + b <= n$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "a_le_c"
            },
            "address": [],
            "selection": "$a <= c$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "b_le_d"
            },
            "address": [],
            "selection": "$b <= d$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$a + b <= n$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$b$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$c$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$d$",
                  "description": "$RR$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$RR$"
                }
              ],
              "hypotheses": [
                {
                  "label": "a_le_c",
                  "statement": "$a <= c$"
                },
                {
                  "label": "b_le_d",
                  "statement": "$b <= d$"
                },
                {
                  "label": "sum_le_sum",
                  "statement": "$a + b <= c + d$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$a + b <= n$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "name": "$n$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "meta",
                  "name": "$k$",
                  "description": "$NN$",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "n_even",
                  "statement": "$n$ is even"
                }
              ],
              "goals": [
                {
                  "label": "k_div_n",
                  "statement": "$k divides n$ "
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "n_even"
            },
            "address": [],
            "selection": "$n$ is even"
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "k_div_n"
            },
            "address": [],
            "selection": "$k divides n$ "
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$n$",
                  "description": "$NN$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$k$",
                  "description": "$NN$",
                  "kind": "meta",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "n_even",
                  "statement": "$n$ is even"
                },
                {
                  "label": "two_div_n",
                  "statement": "$2 divides n$"
                }
              ],
              "goals": [
                {
                  "label": "k_div_n",
                  "statement": "$k divides n$ "
                }
              ]
            }
          ]
        },
        "comment": "$2 divides n$ is an especially good match with the goal in this situation not only because it matches the syntax tree of the goal very well, but also because the variable $k$ in the goal is a metavariable, which makes it possible to set it to any suitable value to match it up with the newly generated hypothesis, unlike a free variable.",
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "name": "$a$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "free",
                  "name": "$b$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "free",
                  "name": "$c$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "meta",
                  "name": "$d$",
                  "description": "$NN$",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp",
                  "statement": "$a dot b + a dot c$"
                }
              ],
              "goals": [
                {
                  "label": "goal",
                  "statement": "$a dot d$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp"
            },
            "address": [],
            "selection": "$a dot b + a dot c$"
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "goal"
            },
            "address": [],
            "selection": "$a dot d$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$a$",
                  "description": "$NN$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$b$",
                  "description": "$NN$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$c$",
                  "description": "$NN$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$d$",
                  "description": "$NN$",
                  "kind": "meta",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp",
                  "statement": "$a dot b + a dot c$"
                },
                {
                  "label": "derived_goal_like",
                  "statement": "$a dot (b + c)$"
                }
              ],
              "goals": [
                {
                  "label": "goal",
                  "statement": "$a dot d$"
                }
              ]
            }
          ]
        },
        "comment": "This is a good suggestion since it matches very well with the goal, having the \"dot\" operation as the root node of the parse tree instead of a \"+\", and $a$ as the left leaf - just like the goal - and $d$ is a meta variable, making this an even better match than if it were a free variable.",
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "name": "$theta$",
                  "description": "$RR$",
                  "value": ""
                },
                {
                  "kind": "meta",
                  "name": "$x$",
                  "description": "$RR$",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "sin_geq_0",
                  "statement": "$sin(theta) >= 0$"
                },
                {
                  "label": "theta_bounds",
                  "statement": "$0 <= theta <= pi/2$"
                }
              ],
              "goals": [
                {
                  "label": "x_ge_0",
                  "statement": "$x >= 0$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "sin_geq_0"
            },
            "address": [],
            "selection": "$sin(theta) >= 0$"
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "theta_bounds"
            },
            "address": [],
            "selection": "$0 <= theta <= pi/2$"
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "x_ge_0"
            },
            "address": [],
            "selection": "$x >= 0$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$theta$",
                  "description": "$RR$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$x$",
                  "description": "$RR$",
                  "kind": "meta",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "sin_geq_0",
                  "statement": "$sin(theta) >= 0$"
                },
                {
                  "label": "theta_bounds",
                  "statement": "$0 <= theta <= pi/2$"
                },
                {
                  "label": "cos_theta_ge_0_derived",
                  "statement": "$cos(theta) >= 0$"
                }
              ],
              "goals": [
                {
                  "label": "x_ge_0",
                  "statement": "$x >= 0$"
                }
              ]
            }
          ]
        },
        "comment": "This is a good deduction since it uses both selected hypotheses. In contrast, a suggestion like $sin^2(theta) >=0$ would have been sub-optimal since it doesn't use the second hypothesis or `sin`.",
        "kind": "example"
      }
    ]
  },
  {
    "name": "Solve one open goal using another ",
    "kind": "strengthening",
    "runWithGuardrails": true,
    "classification": "mathematical",
    "trigger": "This move is relevant when there are two goals within the same proof context of the proof state selected, where one goal is an easy consequence of the other.",
    "action": "Remove the goal that can be easily deduced from the other.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P$"
                },
                {
                  "label": "other_goal",
                  "statement": "$P$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$P$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "other_goal"
            },
            "address": [],
            "selection": "$P$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "other_goal",
                  "statement": "$P$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "n_multiple_4",
                  "statement": "$n$ is a multiple of $4$"
                },
                {
                  "label": "n_even",
                  "statement": "$n$ is even"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "n_multiple_4"
            },
            "address": [],
            "selection": "$n$ is a multiple of $4$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "n_even"
            },
            "address": [],
            "selection": "$n$ is even"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$n$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "n_multiple_4",
                  "statement": "$n$ is a multiple of $4$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      }
    ]
  },
  {
    "name": "Split a conjunction in the goal",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is a goal statement that is a conjunction.",
    "action": "Split the conjunction into separate goals, one corresponding to each conjunct.",
    "examples": [
      {
        "description": "A minimal abstract example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$A$",
                      "$B$"
                    ]
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "conjunction",
              "statements": [
                "$A$",
                "$B$"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "goal_A",
                  "statement": "$A$"
                },
                {
                  "label": "goal_B",
                  "statement": "$B$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An example with several conjuncts and additional goals",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$A$",
                      "$B$",
                      "$C$"
                    ]
                  }
                },
                {
                  "label": "other_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "conjunction",
              "statements": [
                "$A$",
                "$B$",
                "$C$"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "goal_A",
                  "statement": "$A$"
                },
                {
                  "label": "goal_B",
                  "statement": "$B$"
                },
                {
                  "label": "goal_C",
                  "statement": "$C$"
                },
                {
                  "label": "other_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A concrete example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$X$",
                  "kind": "free",
                  "value": "",
                  "description": "topological space"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "X_compact_and_hausdorff",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$X$ is compact",
                      "$X$ is Hausdorff"
                    ]
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "X_compact_and_hausdorff"
            },
            "address": [],
            "selection": {
              "kind": "conjunction",
              "statements": [
                "$X$ is compact",
                "$X$ is Hausdorff"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$X$",
                  "kind": "free",
                  "value": "",
                  "description": "topological space"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "X_compact",
                  "statement": "X is compact"
                },
                {
                  "label": "X_hausdorff",
                  "statement": "$X$ is Hausdorff"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract non-example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$P$"
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here, since the goal is not a conjunction.",
        "kind": "non-example"
      },
      {
        "description": "A non-example with an incorrect selection",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_P",
                  "statement": "$P$"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp_P"
            },
            "address": [],
            "selection": "$P$"
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here, since the selection is a hypothesis rather than a goal.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Choose a branch in a disjunctive goal",
    "kind": "strengthening",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is a single disjunct within a goal statement that is a disjunction.",
    "action": "Replace the disjunctive goal with the selected disjunct as the new goal.",
    "examples": [
      {
        "description": "A minimal abstract example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$A$",
                      "$B$"
                    ]
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [
              {
                "kind": "disjunction",
                "idx": 0
              }
            ],
            "selection": "$A$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "goal_A",
                  "statement": "$A$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An example with several disjuncts",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$A$",
                      "$B$",
                      "$C$"
                    ]
                  }
                },
                {
                  "label": "other_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [
              {
                "kind": "disjunction",
                "idx": 2
              }
            ],
            "selection": "$C$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "goal_C",
                  "statement": "$C$"
                },
                {
                  "label": "other_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A concrete example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$X$",
                  "kind": "free",
                  "value": "",
                  "description": "topological space"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$X$ is first-countable",
                      "$X$ is Hausdorff"
                    ]
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [
              {
                "kind": "disjunction",
                "idx": 1
              }
            ],
            "selection": "$X$ is Hausdorff"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$X$",
                  "kind": "free",
                  "value": "",
                  "description": "topological space"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "X_hausdorff",
                  "statement": "$X$ is Hausdorff"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract non-example where the goal is not a disjunction",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$A$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": null,
        "comment": "This is a non-example because the selected statement is not a disjunct within a disjunctive goal — the goal itself is atomic.",
        "kind": "non-example"
      },
      {
        "description": "A non-example where the entire disjunction is selected rather than one disjunct",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$A$",
                      "$B$"
                    ]
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "disjunction",
              "statements": [
                "$A$",
                "$B$"
              ]
            }
          }
        ],
        "outputState": null,
        "comment": "This move requires exactly one disjunct to be selected. Selecting the whole disjunction does not indicate which disjunct to commit to.",
        "kind": "non-example"
      },
      {
        "description": "A non-example where the selection is a hypothesis rather than a goal disjunct",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$B$",
                      "$C$"
                    ]
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": null,
        "comment": "The move is not relevant here, since the selection is a hypothesis rather than a disjunct within a goal.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Split an equivalence in the goal into two implications",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is a goal statement that is a biconditional (equivalence).",
    "action": "Replace the equivalence goal $A <=> B$ with two implication goals: $A => B$ (the forward direction) and $B => A$ (the backward direction), keeping all other goals unchanged.",
    "examples": [
      {
        "description": "A minimal abstract example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "equivalence",
                    "left": "$A$",
                    "right": "$B$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "equivalence",
              "left": "$A$",
              "right": "$B$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "forward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                },
                {
                  "label": "backward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$B$",
                    "consequent": "$A$"
                  }
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with existing hypotheses",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_C",
                  "statement": "$C$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "equivalence",
                    "left": "$A$",
                    "right": "$B$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "equivalence",
              "left": "$A$",
              "right": "$B$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_C",
                  "statement": "$C$"
                }
              ],
              "goals": [
                {
                  "label": "forward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                },
                {
                  "label": "backward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$B$",
                    "consequent": "$A$"
                  }
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with additional goals: the new implication goals are inserted in place of the equivalence goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "equiv_goal",
                  "statement": {
                    "kind": "equivalence",
                    "left": "$A$",
                    "right": "$B$"
                  }
                },
                {
                  "label": "other_goal",
                  "statement": "$C$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "equiv_goal"
            },
            "address": [],
            "selection": {
              "kind": "equivalence",
              "left": "$A$",
              "right": "$B$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "forward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                },
                {
                  "label": "backward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$B$",
                    "consequent": "$A$"
                  }
                },
                {
                  "label": "other_goal",
                  "statement": "$C$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A concrete example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$G$",
                  "kind": "free",
                  "value": "",
                  "description": "group"
                },
                {
                  "name": "$H$",
                  "kind": "free",
                  "value": "",
                  "description": "group"
                },
                {
                  "name": "$phi$",
                  "kind": "free",
                  "value": "",
                  "description": "$G -> H$"
                }
              ],
              "hypotheses": [
                {
                  "label": "phi_homomorphism",
                  "statement": "$phi$ is a group homomorphism"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "equivalence",
                    "left": "$phi$ is injective",
                    "right": "$ker(phi) = {e_G}$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "equivalence",
              "left": "$phi$ is injective",
              "right": "$ker(phi) = {e_G}$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$G$",
                  "kind": "free",
                  "value": "",
                  "description": "group"
                },
                {
                  "name": "$H$",
                  "kind": "free",
                  "value": "",
                  "description": "group"
                },
                {
                  "name": "$phi$",
                  "kind": "free",
                  "value": "",
                  "description": "$G -> H$"
                }
              ],
              "hypotheses": [
                {
                  "label": "phi_homomorphism",
                  "statement": "$phi$ is a group homomorphism"
                }
              ],
              "goals": [
                {
                  "label": "forward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$phi$ is injective",
                    "consequent": "$ker(phi) = {e_G}$"
                  }
                },
                {
                  "label": "backward",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$ker(phi) = {e_G}$",
                    "consequent": "$phi$ is injective"
                  }
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A non-example where the goal is not an equivalence",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "implication",
              "antecedent": "$A$",
              "consequent": "$B$"
            }
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selected goal is an implication, not an equivalence.",
        "kind": "non-example"
      },
      {
        "description": "A non-example where the selection is a hypothesis rather than a goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_equiv",
                  "statement": {
                    "kind": "equivalence",
                    "left": "$A$",
                    "right": "$B$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp_equiv"
            },
            "address": [],
            "selection": {
              "kind": "equivalence",
              "left": "$A$",
              "right": "$B$"
            }
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selection is a hypothesis, not a goal. Using an equivalence hypothesis is a different move.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Peel existentially quantified variable in the goal",
    "kind": "equivalence",
    "classification": "logical",
    "runWithGuardrails": true,
    "trigger": "This move is relevant when the only selection in the proof state is either an existentially quantified statement in the goal, or the existentially quantified variable within such a goal.",
    "action": "Introduce the existentially quantified variable as a new metavariable at the bottom of the variables list and replace the goal with the body of the existential statement. If a variable of that name already exists in the list of variables, please rename the existential variable in the statement before proceeding. The behaviour of this move is the same even when there are multiple goals in the proof context.",
    "examples": [
      {
        "description": "A minimal abstract example with the whole goal selected",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$a$",
                      "description": "$NN$"
                    },
                    "statement": "$P(a)$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "existential",
              "variable": {
                "name": "$a$",
                "description": "$NN$"
              },
              "statement": "$P(a)$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                },
                {
                  "name": "$a$",
                  "kind": "meta",
                  "value": "",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P(a)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A minimal abstract example with just the variable selected",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$a$",
                      "description": "$NN$"
                    },
                    "statement": "$P(a)$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [
              "existential_var"
            ],
            "selection": "$a$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                },
                {
                  "name": "$a$",
                  "kind": "meta",
                  "value": "",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P(a)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with multiple goals",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "exists_goal",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$a$",
                      "description": "$NN$"
                    },
                    "statement": "$P(a)$"
                  }
                },
                {
                  "label": "other_goal",
                  "statement": "$B$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "exists_goal"
            },
            "address": [],
            "selection": {
              "kind": "existential",
              "variable": {
                "name": "$a$",
                "description": "$NN$"
              },
              "statement": "$P(a)$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "description": "$#text[Proposition]$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$B$",
                  "description": "$#text[Proposition]$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$C$",
                  "description": "$#text[Proposition]$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$P$",
                  "description": "$NN -> \"Proposition\"$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$a$",
                  "description": "$NN$",
                  "kind": "meta",
                  "value": ""
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "exists_goal",
                  "statement": "$P(a)$"
                },
                {
                  "label": "other_goal",
                  "statement": "$B$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A non-example where the goal is not existentially quantified",
        "inputState": {
          "proofState": [
            {
              "variables": [],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$P$"
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selected goal is not an existentially quantified statement.",
        "kind": "non-example"
      },
      {
        "description": "A non-example where the selection is a hypothesis rather than a goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$a$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN$"
                },
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$b$",
                      "description": "$NN$"
                    },
                    "statement": "$P(b)$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$Q$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp"
            },
            "address": [],
            "selection": {
              "kind": "existential",
              "variable": {
                "name": "$b$",
                "description": "$NN$"
              },
              "statement": "$P(b)$"
            }
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selection is a hypothesis, not a goal. Peeling an existential quantifier from a hypothesis is a different move.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Introduce hypothesis from an implication in the goal",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is either a goal statement that is an implication, or the antecedent of such a goal.",
    "action": "Move the antecedent of the implication into the hypotheses as a new hypothesis and replace the goal with the consequent of the implication. If there are other goals remaining, split into two proof contexts: one containing the new hypothesis and the consequent as the new goal, and another containing the original hypotheses and the remaining goals.",
    "examples": [
      {
        "description": "A minimal abstract example with the whole goal selected",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "implication",
              "antecedent": "$A$",
              "consequent": "$B$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$B$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A minimal abstract example with just the antecedent selected",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [
              "implication_antecedent"
            ],
            "selection": "$A$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$B$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with existing variables, hypotheses, and a single implication goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$B$",
                    "consequent": "$C$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "implication",
              "antecedent": "$B$",
              "consequent": "$C$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                },
                {
                  "label": "hyp_B",
                  "statement": "$B$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with multiple goals: the selected goal is split off into a new proof context",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "impl_goal",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                },
                {
                  "label": "other_goal",
                  "statement": "$C$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "impl_goal"
            },
            "address": [],
            "selection": {
              "kind": "implication",
              "antecedent": "$A$",
              "consequent": "$B$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "impl_goal",
                  "statement": "$B$"
                }
              ]
            },
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "other_goal",
                  "statement": "$C$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$D$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A non-example where the goal is not an implication",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$A$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selected goal is not an implication.",
        "kind": "non-example"
      },
      {
        "description": "A non-example where the selection is a hypothesis rather than a goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_impl",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$A$",
                    "consequent": "$B$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp_impl"
            },
            "address": [],
            "selection": {
              "kind": "implication",
              "antecedent": "$A$",
              "consequent": "$B$"
            }
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selection is a hypothesis, not a goal. Using an implication hypothesis to derive new facts is a different move.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Peel universally quantified variable in the goal",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is either a goal statement that is a universally quantified statement, or the universally quantified variable within such a goal.",
    "action": "Introduce the universally quantified variable as a new free variable and replace the goal with the body of the universally quantified statement. If a variable of that name already exists in the list of variables, please rename the universally quantified variable in the statement before proceeding. If there are other goals remaining, split into two proof contexts: one containing the newly introduced variable and the body as the new goal, and another containing the original variables and the remaining goals.",
    "examples": [
      {
        "description": "A minimal abstract example with the whole goal selected",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$a$",
                      "description": "$NN$"
                    },
                    "statement": "$P(a)$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "universal",
              "variable": {
                "name": "$a$",
                "description": "$NN$"
              },
              "statement": "$P(a)$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                },
                {
                  "name": "$a$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P(a)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A minimal abstract example with just the variable selected",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$a$",
                      "description": "$NN$"
                    },
                    "statement": "$P(a)$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [
              "universal_var"
            ],
            "selection": "$a$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                },
                {
                  "name": "$a$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P(a)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with existing variables, hypotheses, and a single goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$Q$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$a$",
                      "description": "$NN$"
                    },
                    "statement": "$Q(a)$"
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "universal",
              "variable": {
                "name": "$a$",
                "description": "$NN$"
              },
              "statement": "$Q(a)$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$Q$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                },
                {
                  "name": "$a$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$Q(a)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with multiple goals: the selected goal is split off into a new proof context",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "univ_goal",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$a$",
                      "description": "$NN$"
                    },
                    "statement": "$P(a)$"
                  }
                },
                {
                  "label": "other_goal",
                  "statement": "$B$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "univ_goal"
            },
            "address": [],
            "selection": {
              "kind": "universal",
              "variable": {
                "name": "$a$",
                "description": "$NN$"
              },
              "statement": "$P(a)$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                },
                {
                  "name": "$a$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "univ_goal",
                  "statement": "$P(a)$"
                }
              ]
            },
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "other_goal",
                  "statement": "$B$"
                },
                {
                  "label": "yet_another_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A non-example where the goal is not universally quantified",
        "inputState": {
          "proofState": [
            {
              "variables": [],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$P$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$P$"
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selected goal is not a universally quantified statement.",
        "kind": "non-example"
      },
      {
        "description": "A non-example where the selection is a hypothesis rather than a goal",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$a$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN$"
                },
                {
                  "name": "$P$",
                  "kind": "free",
                  "value": "",
                  "description": "$NN -> \"Proposition\"$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp",
                  "statement": {
                    "kind": "universal",
                    "variable": {
                      "name": "$b$",
                      "description": "$NN$"
                    },
                    "statement": "$P(b)$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$Q$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp"
            },
            "address": [],
            "selection": {
              "kind": "universal",
              "variable": {
                "name": "$b$",
                "description": "$NN$"
              },
              "statement": "$P(b)$"
            }
          }
        ],
        "outputState": null,
        "comment": "This move is not relevant here since the selection is a hypothesis, not a goal. Peeling a universal quantifier from a hypothesis is a different move.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Split a conjunction in a hypothesis",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is a hypothesis statement that is a conjunction.",
    "action": "Split the conjunction into separate hypotheses, one corresponding to each conjunct.",
    "examples": [
      {
        "description": "A minimal abstract example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "conj_hyp",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$A$",
                      "$B$"
                    ]
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "conj_hyp"
            },
            "address": [],
            "selection": {
              "kind": "conjunction",
              "statements": [
                "$A$",
                "$B$"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                },
                {
                  "label": "hyp_B",
                  "statement": "$B$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with several conjuncts and additional hypotheses",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "conj_hyp",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$A$",
                      "$B$",
                      "$C$"
                    ]
                  }
                },
                {
                  "label": "other_hyp",
                  "statement": "$D$"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "conj_hyp"
            },
            "address": [],
            "selection": {
              "kind": "conjunction",
              "statements": [
                "$A$",
                "$B$",
                "$C$"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                },
                {
                  "label": "hyp_B",
                  "statement": "$B$"
                },
                {
                  "label": "hyp_C",
                  "statement": "$C$"
                },
                {
                  "label": "other_hyp",
                  "statement": "$D$"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "A concrete example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$X$",
                  "kind": "free",
                  "value": "",
                  "description": "topological space"
                }
              ],
              "hypotheses": [
                {
                  "label": "X_compact_hausdorff",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$X$ is compact",
                      "$X$ is Hausdorff"
                    ]
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$X$ is compact"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "X_compact_hausdorff"
            },
            "address": [],
            "selection": {
              "kind": "conjunction",
              "statements": [
                "$X$ is compact",
                "$X$ is Hausdorff"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$X$",
                  "kind": "free",
                  "value": "",
                  "description": "topological space"
                }
              ],
              "hypotheses": [
                {
                  "label": "X_compact",
                  "statement": "$X$ is compact"
                },
                {
                  "label": "X_hausdorff",
                  "statement": "$X$ is Hausdorff"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$X$ is compact"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract non-example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp_A"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": null,
        "comment": "This is a non-example because the selected hypothesis is not a conjunction.",
        "kind": "non-example"
      },
      {
        "description": "A non-example involving an incorrect selection",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "goal_A",
                  "statement": "$A$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "goal_A"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": null,
        "comment": "The move is not relevant here, since the selection is a goal rather than a hypothesis.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Perform case distinction on a disjunctive hypothesis",
    "kind": "strengthening",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is a hypothesis statement that is a disjunction.",
    "action": "Split the disjunction into separate proof states (cases), one corresponding to each disjunct. In each case, the disjunctive hypothesis is replaced by the corresponding disjunct as a new hypothesis.",
    "examples": [
      {
        "description": "A minimal abstract example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "disj_hyp",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$A$",
                      "$B$"
                    ]
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "disj_hyp"
            },
            "address": [],
            "selection": {
              "kind": "disjunction",
              "statements": [
                "$A$",
                "$B$"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            },
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_B",
                  "statement": "$B$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$C$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract example with several disjuncts and additional hypotheses",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$E$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "disj_hyp",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$A$",
                      "$B$",
                      "$C$"
                    ]
                  }
                },
                {
                  "label": "other_hyp",
                  "statement": "$D$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$E$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "disj_hyp"
            },
            "address": [],
            "selection": {
              "kind": "disjunction",
              "statements": [
                "$A$",
                "$B$",
                "$C$"
              ]
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$E$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                },
                {
                  "label": "other_hyp",
                  "statement": "$D$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$E$"
                }
              ]
            },
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$E$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_B",
                  "statement": "$B$"
                },
                {
                  "label": "other_hyp",
                  "statement": "$D$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$E$"
                }
              ]
            },
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$C$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$D$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$E$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_C",
                  "statement": "$C$"
                },
                {
                  "label": "other_hyp",
                  "statement": "$D$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$E$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "An abstract non-example",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp_A",
                  "statement": "$A$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$B$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp_A"
            },
            "address": [],
            "selection": "$A$"
          }
        ],
        "outputState": null,
        "comment": "This is a non-example because the selected hypothesis is not a disjunction.",
        "kind": "non-example"
      },
      {
        "description": "A non-example involving an incorrect selection",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                },
                {
                  "name": "$B$",
                  "kind": "free",
                  "value": "",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": {
                    "kind": "disjunction",
                    "statements": [
                      "$A$",
                      "$B$"
                    ]
                  }
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "kind": "disjunction",
              "statements": [
                "$A$",
                "$B$"
              ]
            }
          }
        ],
        "outputState": null,
        "comment": "The move is not relevant here, since the selection is a goal rather than a hypothesis.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Obtain a witness from an existentially quantified hypothesis",
    "kind": "equivalence",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the only selection in the proof state is an existentially quantified hypothesis.",
    "action": "Peel the existentially quantified variable from the statement and insert it into the list of variables *immediately below* all the variables used in the statement, instead of defaulting to the bottom of the list. If a variable of that name already exists in the list of variables, please rename the existential variable in the statement before proceeding. Replace the hypothesis with the body of the existentially quantified statement.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$alpha -> #text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "main_hyp",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$x$",
                      "description": "$alpha$"
                    },
                    "statement": "$P(x)$"
                  }
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "main_hyp"
            },
            "address": [],
            "selection": {
              "kind": "existential",
              "variable": {
                "name": "$x$",
                "description": "$alpha$"
              },
              "statement": "$P(x)$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$alpha -> #text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "main_hyp",
                  "statement": "$P(x)$"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$alpha -> #text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "main_hyp",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$x$",
                      "description": "$alpha$"
                    },
                    "statement": "$P(x)$"
                  }
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "main_hyp"
            },
            "address": [
              "existential_var"
            ],
            "selection": "$x$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$alpha -> #text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "main_hyp",
                  "statement": "$P(x)$"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha -> alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$alpha$"
                },
                {
                  "kind": "let",
                  "name": "$y$",
                  "description": "$alpha$",
                  "value": "$f(x)$"
                },
                {
                  "kind": "meta",
                  "value": "",
                  "name": "$m$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$z$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$w$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "main_hyp",
                  "statement": {
                    "kind": "existential",
                    "variable": {
                      "name": "$a$",
                      "description": "$alpha$"
                    },
                    "statement": {
                      "kind": "conjunction",
                      "statements": [
                        "$f(x) = f(a)$",
                        "$f(y) = f(m)$"
                      ]
                    }
                  }
                }
              ],
              "goals": []
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "main_hyp"
            },
            "address": [],
            "selection": {
              "kind": "existential",
              "variable": {
                "name": "$a$",
                "description": "$alpha$"
              },
              "statement": {
                "kind": "conjunction",
                "statements": [
                  "$f(x) = f(a)$",
                  "$f(y) = f(m)$"
                ]
              }
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$alpha$",
                  "description": "$#text[Type]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$f$",
                  "description": "$alpha -> alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$alpha$"
                },
                {
                  "kind": "let",
                  "value": "$f(x)$",
                  "name": "$y$",
                  "description": "$alpha$"
                },
                {
                  "kind": "meta",
                  "value": "",
                  "name": "$m$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$a$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$z$",
                  "description": "$alpha$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$w$",
                  "description": "$alpha$"
                }
              ],
              "hypotheses": [
                {
                  "label": "main_hyp",
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$f(x) = f(a)$",
                      "$f(y) = f(m)$"
                    ]
                  }
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      }
    ]
  },
  {
    "name": "Instantiate metavariables in equality",
    "kind": "strengthening",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when the proof state contains a single selection which is an equality.",
    "action": "This move examines both sides of the equality, and if they are structurally identical apart from metavariables, it instantiates the metavariables to the values that make the two sides equal. Instantiating a metavariable involves first checking whether the term it is being assigned to has the same type as the metavariable and contains only variables that occur above the metavariable in the list of variables. If this is the case, the metavariable is replaced with a let variable with the term as its value, and all occurrences of the metavariable in the proof state are replaced with the term.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                },
                {
                  "kind": "meta",
                  "value": "",
                  "name": "$m$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "m_even",
                  "statement": "$m$ is even"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$m = x + 2$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": "$m = x + 2$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                },
                {
                  "kind": "let",
                  "value": "$x + 2$",
                  "name": "$m$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "m_even",
                  "statement": "$x + 2$ is even"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "meta",
                  "value": "",
                  "name": "$m$",
                  "description": "$NN$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "m_even",
                  "statement": "$m$ is even"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$m = x + 2$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "m = x + 2",
              "source_start": 0,
              "source_end": 9,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "let",
                  "value": "$x + 2$",
                  "name": "$m$",
                  "description": "$NN$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "m_even",
                  "statement": "$x + 2$ is even"
                }
              ],
              "goals": []
            }
          ]
        },
        "comment": "This example is invalid since $m$ is instantiated to be $x + 2$, while $x$ appears below $m$ in the list of variables.",
        "kind": "non-example"
      }
    ]
  },
  {
    "name": "Close goal with hypothesis",
    "kind": "strengthening",
    "classification": "logical",
    "runWithGuardrails": true,
    "trigger": "This move is relevant if the selections are a hypothesis and a goal in the same proof state context that are roughly the same structurally and which can potentially unify.",
    "action": "This move examines both expressions, and if they are structurally identical apart from metavariables, it instantiates the metavariables to the values that make the two expressions equal and then clears the goal. Instantiating a metavariable involves first checking whether the term it is being assigned to has the same type as the metavariable and contains only variables that occur above the metavariable in the list of variables. If this is the case, the metavariable is replaced with a let variable with the term as its value, and all occurrences of the metavariable in the proof state are replaced with the term.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P$"
                }
              ],
              "goals": [
                {
                  "label": "P_goal",
                  "statement": "$P$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "P_hyp"
            },
            "address": [],
            "selection": "$P$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "P_goal"
            },
            "address": [],
            "selection": "$P$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P$"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$NN ->#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                },
                {
                  "kind": "meta",
                  "value": "",
                  "name": "$a$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P(3 dot (x + 2))$"
                }
              ],
              "goals": [
                {
                  "label": "P_goal",
                  "statement": "$P(3 dot (a + 2))$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "P_hyp"
            },
            "address": [],
            "selection": "$P(3 dot (x + 2))$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "P_goal"
            },
            "address": [],
            "selection": "$P(3 dot (a + 2))$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$NN ->#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                },
                {
                  "kind": "let",
                  "value": "$x$",
                  "name": "$a$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P(3 dot (x + 2))$"
                }
              ],
              "goals": []
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$NN ->#text[Proposition]$"
                },
                {
                  "kind": "meta",
                  "value": "",
                  "name": "$a$",
                  "description": "$NN$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$x$",
                  "description": "$NN$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P(3 dot (x + 2))$"
                }
              ],
              "goals": [
                {
                  "label": "P_goal",
                  "statement": "$P(3 dot (a + 2))$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "P_hyp"
            },
            "address": [],
            "selection": "$P(3 dot (x + 2))$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "P_goal"
            },
            "address": [],
            "selection": "$P(3 dot (a + 2))$"
          }
        ],
        "outputState": null,
        "kind": "non-example",
        "comment": "In this example, the metavariable $a$ cannot be instantiated to $x$ because $x$ occurs below $a$ in the list of variables, so the move is not applicable."
      }
    ]
  },
  {
    "name": "Perform modus ponens",
    "kind": "strengthening",
    "runWithGuardrails": true,
    "classification": "logical",
    "trigger": "This move is relevant when there are two selections within a proof state context, one of which is a hypothesis and the other is either the antecedent of an implication hypothesis or the whole implication hypothesis itself. Moreover, the hypothesis needs to be structurally similar and must potentially unify with the antecedent.",
    "action": "This move examines the hypothesis and the antecedent of the implication hypothesis, and if they are structurally identical apart from metavariables or universally quantified variables, it instantiates the metavariables to the values that make the two expressions equal and then replaces the implication hypothesis with just its consequent.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$Q$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$R$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P$"
                },
                {
                  "label": "imp_hyp",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$P$",
                    "consequent": "$Q$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$R$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "P_hyp"
            },
            "address": [],
            "selection": "$P$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "imp_hyp"
            },
            "address": [],
            "selection": {
              "kind": "implication",
              "antecedent": "$P$",
              "consequent": "$Q$"
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$Q$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$R$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P$"
                },
                {
                  "label": "imp_hyp",
                  "statement": "$Q$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$R$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$Q$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$R$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P$"
                },
                {
                  "label": "imp_hyp",
                  "statement": {
                    "kind": "implication",
                    "antecedent": "$P$",
                    "consequent": "$Q$"
                  }
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$R$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "P_hyp"
            },
            "address": [],
            "selection": "$P$"
          },
          {
            "proofStateId": {
              "proofNodeId": -1,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "imp_hyp"
            },
            "address": [
              "implication_antecedent"
            ],
            "selection": "$P$"
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "value": "",
                  "name": "$P$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$Q$",
                  "description": "$#text[Proposition]$"
                },
                {
                  "kind": "free",
                  "value": "",
                  "name": "$R$",
                  "description": "$#text[Proposition]$"
                }
              ],
              "hypotheses": [
                {
                  "label": "P_hyp",
                  "statement": "$P$"
                },
                {
                  "label": "imp_hyp",
                  "statement": "$Q$"
                }
              ],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$R$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      }
    ]
  },
  {
    "name": "Instantiate metavariable with selected expression",
    "kind": "strengthening",
    "classification": "logical",
    "runWithGuardrails": true,
    "trigger": "This move is relevant when there are two expressions selected in the proof state, one of which is a metavariable.",
    "action": "This move instantiates the metavariable with the other selected term. Instantiating a metavariable involves first checking whether the term it is being assigned to has the same type as the metavariable and contains only variables that occur above the metavariable in the list of variables. If this is the case, the metavariable is replaced with a let variable with the term as its value, and all occurrences of the metavariable in the proof state are replaced with the term.",
    "examples": [
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "name": "$a$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "free",
                  "name": "$b$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "meta",
                  "name": "$x$",
                  "description": "$NN$",
                  "value": ""
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$x <= (a + b)$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "variable",
              "label": "$x$"
            },
            "address": [],
            "selection": {
              "text": "x",
              "source_start": 0,
              "source_end": 1,
              "index": 0
            }
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "goal",
              "label": "main_goal"
            },
            "address": [],
            "selection": {
              "text": "(a + b)",
              "source_start": 5,
              "source_end": 12,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$a$",
                  "description": "$NN$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$b$",
                  "description": "$NN$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$x$",
                  "description": "$NN$",
                  "kind": "let",
                  "value": "$(a + b)$"
                }
              ],
              "hypotheses": [],
              "goals": [
                {
                  "label": "main_goal",
                  "statement": "$(a + b) <= (a + b)$"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "name": "$A$",
                  "description": "$#text[Group]$",
                  "value": ""
                },
                {
                  "kind": "meta",
                  "name": "$B$",
                  "description": "$#text[Group]$",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "A_abelian",
                  "statement": "$A$ is abelian"
                }
              ],
              "goals": [
                {
                  "label": "prod_is_abelian",
                  "statement": "$B times B$ is abelian"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "variable",
              "label": "$B$"
            },
            "address": [],
            "selection": {
              "text": "B",
              "source_start": 0,
              "source_end": 1,
              "index": 0
            }
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "A_abelian"
            },
            "address": [],
            "selection": {
              "text": "A",
              "source_start": 0,
              "source_end": 1,
              "index": 0
            }
          }
        ],
        "outputState": {
          "proofState": [
            {
              "variables": [
                {
                  "name": "$A$",
                  "description": "$#text[Group]$",
                  "kind": "free",
                  "value": ""
                },
                {
                  "name": "$B$",
                  "description": "$#text[Group]$",
                  "kind": "let",
                  "value": "$A$"
                }
              ],
              "hypotheses": [
                {
                  "label": "A_abelian",
                  "statement": "$A$ is abelian"
                }
              ],
              "goals": [
                {
                  "label": "prod_is_abelian",
                  "statement": "$A times A$ is abelian"
                }
              ]
            }
          ]
        },
        "kind": "example"
      },
      {
        "description": "",
        "inputState": {
          "proofState": [
            {
              "variables": [
                {
                  "kind": "free",
                  "name": "$a$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "meta",
                  "name": "$m$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "free",
                  "name": "$b$",
                  "description": "$NN$",
                  "value": ""
                },
                {
                  "kind": "free",
                  "name": "$c$",
                  "description": "$NN$",
                  "value": ""
                }
              ],
              "hypotheses": [
                {
                  "label": "hyp",
                  "statement": "$c = (a + b)$"
                }
              ],
              "goals": [
                {
                  "label": "goal",
                  "statement": "$m >= a$"
                }
              ]
            }
          ]
        },
        "selections": [
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "variable",
              "label": "$m$"
            },
            "address": [],
            "selection": {
              "text": "m",
              "source_start": 0,
              "source_end": 1,
              "index": 0
            }
          },
          {
            "proofStateId": {
              "proofNodeId": 0,
              "proofContextId": 0
            },
            "location": {
              "kind": "hypothesis",
              "label": "hyp"
            },
            "address": [],
            "selection": {
              "text": "(a + b)",
              "source_start": 4,
              "source_end": 11,
              "index": 0
            }
          }
        ],
        "outputState": null,
        "comment": "Since $b$ occurs below the metavariable $m$, $m$ cannot be instantiated with $(a + b)$ in this proof state.",
        "kind": "non-example"
      }
    ]
  }
]