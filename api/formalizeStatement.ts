import { generateText, Output } from "ai"
import { StatementSchema, ProofState } from "./proofState"
import { PROMPTS } from "./prompts"
import { MODELS } from "./models"
import { z } from "zod"

const ParseStatementResponseSchema = z.object({
  label: z.string(),
  statement: StatementSchema
})

export const formalizeStatement = async (
  naturalLanguageStatement: string,
  context?: ProofState
) => {
  console.log("formalizing statement with model", MODELS.formalize_statement.model)
  
  const contextString = context ? 
    `\n\nCurrent proof context:\n${JSON.stringify(context, null, 2)}` : 
    ""
  
  const result = await generateText({
    model: MODELS.formalize_statement.model,
    system: PROMPTS.formalize_statement,
    prompt: naturalLanguageStatement + contextString,
    output: Output.object({
      schema: ParseStatementResponseSchema
    }),
  });
  
  return result;
}