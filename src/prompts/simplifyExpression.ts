import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const simplifyExpressionMove: ProofDiscoveryMove = {
  "name": "Simplify the selected expression",
  "kind": "equivalence",
  "trigger": "This move is relevant when the proof state has a single selected expression or statement, ideally representing a term that can be simplified. This move also applies to statements that can be simplified, not just expressions within atomic statements.",
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
                "name": "$P$",
                "description": "$ZZ -> #text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$x$",
                "description": "$ZZ$"
              },
              {
                "kind": "free",
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
                "name": "$P$",
                "description": "$ZZ -> #text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$x$",
                "description": "$ZZ$"
              },
              {
                "kind": "free",
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
                "name": "$G$",
                "description": "Group"
              },
              {
                "kind": "free",
                "name": "$a$",
                "description": "$G$"
              },
              {
                "kind": "free",
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
                "name": "$G$",
                "description": "Group"
              },
              {
                "kind": "free",
                "name": "$a$",
                "description": "$G$"
              },
              {
                "kind": "free",
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
}