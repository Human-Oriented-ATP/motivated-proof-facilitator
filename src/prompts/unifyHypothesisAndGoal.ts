import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const unifyHypothesisAndGoalMove: ProofDiscoveryMove = {
  "name": "Unify hypothesis with goal",
  "kind": "strengthening",
  "classification": "logical",
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
                "kind": "free", "value": "",
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
                "kind": "free", "value": "",
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
                "kind": "free", "value": "",
                "name": "$P$",
                "description": "$NN ->#text[Proposition]$"
              },
              {
                "kind": "free", "value": "",
                "name": "$x$",
                "description": "$NN$"
              },
              {
                "kind": "meta", "value": "",
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
                "kind": "free", "value": "",
                "name": "$P$",
                "description": "$NN ->#text[Proposition]$"
              },
              {
                "kind": "free", "value": "",
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
                "kind": "free", "value": "",
                "name": "$P$",
                "description": "$NN ->#text[Proposition]$"
              },
              {
                "kind": "meta", "value": "",
                "name": "$a$",
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
      comment: "In this example, the metavariable $a$ cannot be instantiated to $x$ because $x$ occurs below $a$ in the list of variables, so the move is not applicable."
    }
  ]
}