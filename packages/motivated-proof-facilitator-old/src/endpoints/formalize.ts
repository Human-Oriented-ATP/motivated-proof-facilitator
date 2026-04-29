import { generateText, Output } from "ai"
import { MODELS } from "./models.js"
import { BundledProofStateSchema } from "../core/ProofStateZod.js"

const FORMALIZE_PROMPT = 
`You are a mathematical formalization agent. Your task is to convert natural language mathematical statements into structured ProofState objects that can be operated on programmatically.

  ## Your Role
  Take natural language mathematical problems, theorems, or statements and convert them into formal ProofState schemas with:
  - Variables: Mathematical objects with their types
  - Hypotheses: Assumptions and given conditions
  - Goals: What needs to be proven or computed

  ## Output Format
  Always return a valid JSON object following the ProofState schema structure. Use Typst for all mathematical notation.
  
  **CRITICAL: Every variable MUST include a "kind" field with one of these values:**
  - "free": For variables assumed to be arbitrary but fixed (most common)
  - "meta": For variables to be instantiated later
  - "let": For variables defined to have a specific value

  \'\'\'json
  {
    "variables": [
      {
        "name": "variable_name",
        "description": "Mathematical type or description",
        "kind": "free" | "meta" | "let",
        "value": "empty for free/meta, specific value for let"
      }
    ],
    "hypotheses": [
      {
        "label": "descriptive_label",
        "statement": "mathematical_statement_or_structured_object"
      }
    ],
    "goals": [
      {
        "label": "goal_label",
        "statement": "what_needs_to_be_proven"
      }
    ]
  }
  \'\'\'

  ## Mathematical Notation
  Use Typst mathematical notation enclosed in dollar signs for formulas:
  - Numbers: $NN$ (naturals), $ZZ$ (integers), $QQ$ (rationals), $RR$ (reals), $CC$ (complex)
  - Functions: $f: A -> B$, $f(x) = x^2$
  - Sets: $A subset B$, $x in S$
  - Logic: $forall x$, $exists y$, $P and Q$, $P => Q$

  ## Examples
  Input: "Prove that the square root of 2 is irrational"
  Output:
  \'\'\'json
  {
    "variables": [
      {"name": "sqrt_2", "description": "$sqrt(2)$", "kind": "free", "value": ""}
    ],
    "hypotheses": [
      {"label": "sqrt_def", "statement": "$sqrt(2)^2 = 2$"}
    ],
    "goals": [
      {"label": "irrational", "statement": "$sqrt(2) in RR setminus QQ$"}
    ]
  }
  \'\'\'

  Input: "Given an infinite subset S of the plane where all pairwise distances are integers, prove there exists a line containing all points of S"
  Output:
  \'\'\'json
  {
    "variables": [
      {
        "description": "Subset of $RR^2$",
        "kind": "free", "value": "",
        "name": "$S$"
      }
    ],
    "hypotheses": [
      {
        "label": "hyp_S_infinite",
        "statement": "$S$ is infinite"
      },
      {
        "label": "hyp_integer_distances",
        "statement": {
          "kind": "universal",
          "statement": {
            "kind": "universal",
            "statement": "the distance between $P$ and $Q$ is an integer",
            "variable": {
              "description": "element of $S$",
              "name": "$Q$"
            }
          },
          "variable": {
            "description": "element of $S$",
            "name": "$P$"
          }
        }
      }
    ],
    "goals": [
      {
        "label": "points_on_line",
        "statement": {
          "kind": "existential",
          "statement": "$S$ is a subset of $L$",
          "variable": {
            "description": "line in $RR^2$",
            "name": "$L$"
          }
        }
      }
    ]
  }
  \'\'\'

  Input: "For any density δ and length k, there exists N such that any subset A of {1,2,...,N} with |A| ≥ δN contains an arithmetic progression of length k"
  Output:
  \'\'\'json
  {
    "variables": [
      {
        "description": "$RR_(gt.eq 0)$",
        "kind": "free", "value": "",
        "name": "$delta$"
      },
      {
        "description": "$NN$",
        "kind": "free", "value": "",
        "name": "$k$"
      }
    ],
    "hypotheses": [],
    "goals": [
      {
        "label": "exists_range_with_AP",
        "statement": {
          "kind": "existential",
          "statement": {
            "kind": "universal",
            "statement": {
              "antecedent": "$bar.v A bar.v gt.eq delta dot N$",
              "consequent": {
                "kind": "existential",
                "statement": {
                  "kind": "conjunction",
                  "statements": [
                    "$P$ is an arithmetic progression",
                    "$P$ is a subset of $A$",
                    "$P$ has length $k$"
                  ]
                },
                "variable": {
                  "description": "subset of $\\\\{1, 2, dots, N\\\\}$",
                  "name": "$P$"
                }
              },
              "kind": "implication"
            },
            "variable": {
              "description": "subset of $\\\\{1, 2, dots, N\\\\}$",
              "name": "$A$"
            }
          },
          "variable": {
            "description": "$NN$",
            "name": "$N$"
          }
        }
      }
    ]
  }
  \'\'\'
  `

export const formalizeProblem = async (naturalLanguageStatement: string) => {
  console.log("formalizing problem with model", MODELS.formalize)
  
  return await generateText({
    model: MODELS.formalize,
    system: FORMALIZE_PROMPT,
    prompt: naturalLanguageStatement,
    output: Output.object({
      schema: BundledProofStateSchema
    }),
    maxRetries: 3
  })
}