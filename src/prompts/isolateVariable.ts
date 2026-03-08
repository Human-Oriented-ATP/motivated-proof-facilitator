import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const isolateVariableMove: ProofDiscoveryMove = {
  "name": "Isolate the selected variable in the equality",
  "kind": "equivalence",
  "trigger": "This move is relevant when the proof state contains two selections, one of which is an equation and the other is a variable within that equation.",
  "action": "Manipulate the equality using valid operations to make one of the sides the selected variable and the other an expression which does not contain the variable.",
  "examples": [
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
              },
              {
                "kind": "free",
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
                "name": "$x$",
                "description": "$RR$"
              },
              {
                "kind": "free",
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
    }
  ]
}