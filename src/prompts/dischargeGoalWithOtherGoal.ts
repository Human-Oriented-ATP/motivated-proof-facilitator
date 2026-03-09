import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const dischargeGoalWithOtherGoalMove: ProofDiscoveryMove = {
  "name": "Solve one open goal using another ",
  "kind": "strengthening",
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
}