import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove";

export const modusPonensMove: ProofDiscoveryMove = {
  "name": "Perform modus ponens",
  "kind": "strengthening",
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
                "name": "$P$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$Q$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
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
                "name": "$P$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$Q$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
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
                "name": "$P$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$Q$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
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
                "name": "$P$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$Q$",
                "description": "$#text[Proposition]$"
              },
              {
                "kind": "free",
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
}