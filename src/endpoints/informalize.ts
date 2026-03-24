import { generateText } from "ai"
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
  
    return await generateText({
        model: MODELS.informalize,
        system: INFORMALIZE_PROMPT,
        prompt: JSON.stringify(proofState)
    })
}