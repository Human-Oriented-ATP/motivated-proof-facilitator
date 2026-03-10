import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const unfoldDefinitionMove: ProofDiscoveryMove = {
  "name": "Unfold the definition",
  "kind": "equivalence",
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
                "name": "$alpha$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
                "name": "$beta$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
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
                "name": "$alpha$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
                "name": "$beta$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
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
                "name": "$X$",
                "description": "metric space"
              },
              {
                "kind": "free",
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
                "name": "$X$",
                "description": "metric space"
              },
              {
                "kind": "free",
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
}