import { generateText, Output } from "ai"
import { MODELS } from "./models.js"
import { FilterRequest, FilterResponseSchema } from "../fetchers/filter.js"

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

export const evaluateFilterCondition = async (req: FilterRequest) => {
  console.log("evaluating filter condition with LLM...", req)
  
  return await generateText({
    model: MODELS.filter,
    system: FILTER_PROMPT,
    prompt: JSON.stringify(req, null, 2),
    output: Output.object({
      schema: FilterResponseSchema
    })
  }) 
}
