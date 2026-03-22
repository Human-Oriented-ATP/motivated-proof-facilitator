import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const instantiateMetavariablesMove: ProofDiscoveryMove = {
  "name": "Instantiate metavariables in equality",
  "kind": "strengthening",
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
                "kind": "free", "value": "",
                "name": "$x$",
                "description": "$NN$"
              },
              {
                "kind": "meta", "value": "",
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
                "kind": "free", "value": "",
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
                "kind": "meta", "value": "",
                "name": "$m$",
                "description": "$NN$"
              },
              {
                "kind": "free", "value": "",
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
                "kind": "free", "value": "",
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
}