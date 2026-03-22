import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const dischargeGoalMove: ProofDiscoveryMove = {
  "name": "Discharge obviously true goal",
  "kind": "strengthening",
  "trigger": "This move appears when the only selection is a goal statement that is a simple fact that feels obviously true.",
  "action": "Remove the goal from the list of goals.",
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
                "kind": "free", "value": "",
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
      comment: "Since the goal statement is not a simple fact that feels obviously true, the move should not be applied.",
      "kind": "non-example"
    }
  ]
}