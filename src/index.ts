import express from 'express'
import bodyParser from "body-parser"
import cors from "cors"
import { BundledProofStateSchema, ProofState } from '../src/core/ProofStateZod'
import { generateText, Output } from 'ai'
import { MODELS } from '../src/endpoints/models'
import  { MoveResponseSchema }  from './endpoints/Move'
import { ProofStateSelection } from './core/ProofStateSelectionContext'
import { FilterResponse, FilterResponseSchema } from './endpoints/Filter'

const app = express()

app.use(cors())
app.use(bodyParser.json())


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
  - "let": For variables defined to have a specific value (requires "value" field)

  \'\'\'json
  {
    "variables": [
      {
        "name": "variable_name",
        "description": "Mathematical type or description",
        "kind": "free" | "meta" | "let",
        "value": "optional_value_for_let_variables"
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
      {"name": "sqrt_2", "description": "$sqrt(2)$", "kind": "free"}
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

  //Promise<GenerateTextResult<ToolSet, z.infer<typeof BundledProofStateSchema>>> 
const formalizeStatement = async (naturalLanguageStatement: string) => {
  console.log("formalizing statement with model", MODELS.formalize)
  
  let enhancedPrompt = FORMALIZE_PROMPT
  
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: MODELS.formalize,
        system: enhancedPrompt,
        prompt: naturalLanguageStatement,
        output: Output.object({
          schema: BundledProofStateSchema
        }),
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`Formalize attempt ${attempt} failed:`, errorMessage);
      
      if (attempt < maxRetries) {
        // Enhance prompt with previous error information for retry
        enhancedPrompt = `${FORMALIZE_PROMPT}

ERROR CORRECTION: Your previous attempt failed with error: ${errorMessage}
Please adjust your approach to avoid this error.`
        
        console.log(`Retrying formalization (attempt ${attempt + 1}/${maxRetries})...`)
        continue
      }
    }
  }

  throw new Error("Failed to formalize statement after multiple attempts.")
}

app.post("/api/formalize", async (req, res) => {
  console.log("formalizing...", req.body.problem)
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    const result = await formalizeStatement(problem)
    console.log("formalized", result)
    res.send(result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

const runMove = async ({
  proofState,
  move,
  selections
}: {
  proofState: ProofState,
  move: string,
  selections?: ProofStateSelection[]
}) => {
  console.log('Applying move', move)
  const promptData = {
    proofState,
    ...(selections && { selections })
  };
  
  let enhancedMove = `${move}

In addition to applying the move, provide a clear reasoning trace explaining:
1. What the move is trying to accomplish
2. How it transforms the current proof state
3. Why this move makes sense in the context of proving the goal

Return the result as a JSON object with:
- reasoning: your reasoning process explaining the move
- proofState: the updated proof state after applying the move`;

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: MODELS.move,
        system: enhancedMove,
        prompt: JSON.stringify(promptData),
        output: Output.object({
          schema: MoveResponseSchema
        })
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Move attempt ${attempt} failed:`, errorMessage);
      
      if (attempt < maxRetries && errorMessage.includes('discriminator')) {
        // Add more specific instructions about the kind field for retry
        enhancedMove = `${move}

ERROR CORRECTION: Your previous response failed validation.

In addition to applying the move, provide a clear reasoning trace explaining:
1. What the move is trying to accomplish
2. How it transforms the current proof state
3. Why this move makes sense in the context of proving the goal

Return the result as a JSON object with:
- reasoning: your reasoning process explaining the move
- proofState: the updated proof state after applying the move`
        
        continue
      }
    }
  }

  // This is unreachable because we throw on final failure, but keeps control flow explicit.
  throw new Error("Failed to apply move after retries")
}

app.post("/api/move", async (req, res) => {
  const { proofState, move, selections } = req.body;
  if (!proofState) {
    console.error("no proof state provided")
    res.send("FAILED: no proof state provided")
    return
  }
  if (!move) {
    console.error("no move provided")
    res.send("FAILED: no move provided")
    return
  }
  try {
    console.log("applying move...", move)
    const result = await runMove({ proofState, move, selections })
    res.send(result.text)
    console.log("move applied", result.reasoning)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

const FILTER_PROMPT = `
You are a mathematical reasoning filter that determines whether a given proof state and selections meet a specific trigger criterion.

You will be given:
1. A proof state (mathematical context with hypotheses and goals)
2. A list of selections (which could be expressions, terms, hypotheses, etc.)
3. A trigger criterion (a string describing what condition to check for)

Your task is to analyze whether the trigger criterion is satisfied given the proof state and selections.

Consider:
- The mathematical content and structure of the proof state
- The nature and content of the selections
- How the selections relate to the proof state
- Whether the trigger criterion is met based on logical, mathematical, or structural analysis

Provide:
- A boolean indicating whether the condition is met
- Clear reasoning explaining your decision

You MUST respond with a JSON object containing exactly these two fields:

\`\`\`json
{
  "meetsCondition": boolean,
  "reasoning": "string explaining your decision"
}
\`\`\`

Be precise in your analysis and consider both the mathematical meaning and structural properties.
`

const evaluateFilterCondition = async (
  proofState: ProofState,
  selections: any[],
  triggerCriterion: string
) => {
  console.log("evaluating filter condition with LLM...", {
    model: MODELS.filter,
    triggerCriterion,
    selectionsCount: selections.length
  })
  
  const input = {
    proofState,
    selections,
    triggerCriterion
  }
  
  const result = await generateText({
    model: MODELS.filter,
    system: FILTER_PROMPT,
    prompt: JSON.stringify(input, null, 2),
    output: Output.object({
      schema: FilterResponseSchema
    }),
  })
  
  return result
}

app.post("/api/filter", async (req, res) => {
  const { proofState, selections, triggerCriterion } = req.body
  
  if (!proofState) {
    console.error("no proof state provided")
    res.json({ success: false, error: "no proof state provided" })
    return
  }
  
  if (!selections) {
    console.error("no selections provided")
    res.json({ success: false, error: "no selections provided" })
    return
  }
  
  if (!triggerCriterion) {
    console.error("no trigger criterion provided")
    res.json({ success: false, error: "no trigger criterion provided" })
    return
  }
  
  try {
    console.log("filtering with criterion:", triggerCriterion)
    console.log("selections:", selections)
    
    const result = await evaluateFilterCondition(proofState, selections, triggerCriterion)
    
    return res.send(result.text)

  } catch(err) {
    console.error(err)
    res.json({ success: false, error: err instanceof Error ? err.message : String(err) })
  }
})

export default app