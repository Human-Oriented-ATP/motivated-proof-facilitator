import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofStateSelection } from "../core/ProofStateSelectionContext"

export const hypothesisExistentialMove: ProofDiscoveryMove = {
  "name": "Obtain a witness from an existentially quantified hypothesis",
  "kind": "equivalence",
  "trigger": "This move is relevant when the only selection in the proof state is an existentially quantified hypothesis.",
  "action": "Peel the existentially quantified variable from the statement and insert it into the list of variables *immediately below* all the variables used in the statement, instead of defaulting to the bottom of the list. If a variable of that name already exists in the list of variables, please rename the existential variable in the statement before proceeding. Replace the hypothesis with the body of the existentially quantified statement.",
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
                "name": "$P$",
                "description": "$alpha -> #text[Proposition]$"
              }
            ],
            "hypotheses": [
              {
                "label": "main_hyp",
                "statement": {
                  "kind": "existential",
                  "variable": {
                    "name": "$x$",
                    "description": "$alpha$"
                  },
                  "statement": "$P(x)$"
                }
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
            "label": "main_hyp"
          },
          "address": [],
          "selection": {
            "kind": "existential",
            "variable": {
              "name": "$x$",
              "description": "$alpha$"
            },
            "statement": "$P(x)$"
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
                "name": "$P$",
                "description": "$alpha -> #text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$x$",
                "description": "$alpha$"
              }
            ],
            "hypotheses": [
              {
                "label": "main_hyp",
                "statement": "$P(x)$"
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
                "name": "$P$",
                "description": "$alpha -> #text[Proposition]$"
              }
            ],
            "hypotheses": [
              {
                "label": "main_hyp",
                "statement": {
                  "kind": "existential",
                  "variable": {
                    "name": "$x$",
                    "description": "$alpha$"
                  },
                  "statement": "$P(x)$"
                }
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
            "label": "main_hyp"
          },
          "address": [
            "existential_var"
          ],
          "selection": "$x$"
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
                "name": "$P$",
                "description": "$alpha -> #text[Proposition]$"
              },
              {
                "kind": "free",
                "name": "$x$",
                "description": "$alpha$"
              }
            ],
            "hypotheses": [
              {
                "label": "main_hyp",
                "statement": "$P(x)$"
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
                "name": "$f$",
                "description": "$alpha -> alpha$"
              },
              {
                "kind": "free",
                "name": "$x$",
                "description": "$alpha$"
              },
              {
                "kind": "let",
                "name": "$y$",
                "description": "$alpha$",
                "value": "$f(x)$"
              },
              {
                "kind": "meta",
                "name": "$m$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
                "name": "$z$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
                "name": "$w$",
                "description": "$alpha$"
              }
            ],
            "hypotheses": [
              {
                "label": "main_hyp",
                "statement": {
                  "kind": "existential",
                  "variable": {
                    "name": "$a$",
                    "description": "$alpha$"
                  },
                  "statement": {
                    "kind": "conjunction",
                    "statements": [
                      "$f(x) = f(a)$",
                      "$f(y) = f(m)$"
                    ]
                  }
                }
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
            "label": "main_hyp"
          },
          "address": [],
          "selection": {
            "kind": "existential",
            "variable": {
              "name": "$a$",
              "description": "$alpha$"
            },
            "statement": {
              "kind": "conjunction",
              "statements": [
                "$f(x) = f(a)$",
                "$f(y) = f(m)$"
              ]
            }
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
                "name": "$x$",
                "description": "$alpha$"
              },
              {
                "kind": "let",
                "value": "$f(x)$",
                "name": "$y$",
                "description": "$alpha$"
              },
              {
                "kind": "meta",
                "name": "$m$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
                "name": "$a$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
                "name": "$z$",
                "description": "$alpha$"
              },
              {
                "kind": "free",
                "name": "$w$",
                "description": "$alpha$"
              }
            ],
            "hypotheses": [
              {
                "label": "main_hyp",
                "statement": {
                  "kind": "conjunction",
                  "statements": [
                    "$f(x) = f(a)$",
                    "$f(y) = f(m)$"
                  ]
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