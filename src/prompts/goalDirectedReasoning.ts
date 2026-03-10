import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const goalDirectedReasoningMove: ProofDiscoveryMove = {
  "name": "Perform goal-directed forwards reasoning",
  "kind": "strengthening",
  "trigger": "This move appears when the user has selected at least one hypothesis and at least one goal in the same proof context.",
  "action": "This move creates a new hypothesis that is derived from some of the selected hypotheses and is syntactically similar to at least one of the selected goals. Avoid dropping the level of abstraction; ideally, the new hypothesis should be syntactically similar to one of the selected goals (and not just have semantic resemblance). Avoid introducing hypotheses that already exist in the proof state.",
  "examples": [
    {
      "description": "",
      "inputState": {
        "proofState": [
          {
            "variables": [
              {
                "kind": "free",
                "name": "$X$",
                "description": "$#text[Topological space]$"
              },
              {
                "kind": "free",
                "name": "$U$",
                "description": "subset of $X$"
              },
              {
                "kind": "free",
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
                "name": "$X$",
                "description": "$#text[Topological space]$"
              },
              {
                "kind": "free",
                "name": "$U$",
                "description": "subset of $X$"
              },
              {
                "kind": "free",
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
                "name": "$a$",
                "description": "$RR$"
              },
              {
                "kind": "free",
                "name": "$b$",
                "description": "$RR$"
              },
              {
                "kind": "free",
                "name": "$c$",
                "description": "$RR$"
              },
              {
                "kind": "free",
                "name": "$d$",
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
                "name": "$a$",
                "description": "$RR$"
              },
              {
                "kind": "free",
                "name": "$b$",
                "description": "$RR$"
              },
              {
                "kind": "free",
                "name": "$c$",
                "description": "$RR$"
              },
              {
                "kind": "free",
                "name": "$d$",
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
    }
  ]
}