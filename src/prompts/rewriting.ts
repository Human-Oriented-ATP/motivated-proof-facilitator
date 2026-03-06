import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

const rewritingPrompt: ProofDiscoveryMove = {
  "name": "Rewrite using equality result",
  "kind": "strengthening",
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
                "name": "$alpha$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
                "name": "$f$",
                "description": "$alpha -> alpha$"
              },
              {
                "kind": "free",
                "name": "$a$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
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
                "name": "$alpha$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
                "name": "$f$",
                "description": "$alpha -> alpha$"
              },
              {
                "kind": "free",
                "name": "$a$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
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
                "name": "$alpha$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
                "name": "$f$",
                "description": "$alpha -> alpha$"
              },
              {
                "kind": "free",
                "name": "$P$",
                "description": "$alpha -> #text[proposition]$"
              },
              {
                "kind": "free",
                "name": "$a$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
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
                "name": "$alpha$",
                "description": "$#text[Type]$"
              },
              {
                "kind": "free",
                "name": "$f$",
                "description": "$alpha -> alpha$"
              },
              {
                "kind": "free",
                "name": "$P$",
                "description": "$alpha -> #text[proposition]$"
              },
              {
                "kind": "free",
                "name": "$a$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
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
}