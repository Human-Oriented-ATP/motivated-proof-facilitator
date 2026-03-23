import { generateText, Output } from "ai"
import { MODELS } from "./models"
import { ProofState } from "../core/ProofStateZod"

const INFORMALIZE_PROMPT = 
  `
  You take in formal ProofState schemas and convert them back into clear, natural language mathematical statements.
  
  Your task is to take a structured ProofState with variables, hypotheses, and goals, and produce a readable natural language description of the mathematical problem or theorem.
  
  Focus on making the mathematics clear and accessible while preserving all the important mathematical content.
  
  Return only the natural language text, not JSON or structured data.
  `

export const informalizeProofState = async (proofState: ProofState) => {
  console.log("informalizing proof state with model", MODELS.informalize)
  
  let enhancedPrompt = INFORMALIZE_PROMPT

  const maxRetries = 3
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: MODELS.informalize,
        system: enhancedPrompt,
        prompt: JSON.stringify(proofState)
      })
            return result.text
        } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`Informalize attempt ${attempt} failed:`, errorMessage)

      if (attempt < maxRetries) {
        // Enhance prompt with previous error information for retry
        enhancedPrompt = `${INFORMALIZE_PROMPT}

ERROR CORRECTION: Your previous attempt failed with error: ${errorMessage}
Please adjust your approach to avoid this error.`

        console.log(`Retrying informalization (attempt ${attempt + 1}/${maxRetries})...`)
                continue
          }
      
      // If final attempt, throw the error
      throw error
        }
  }
}