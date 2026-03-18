import { generateText } from "ai"
import { ProofState } from "./proofState"
import { PROMPTS } from "./prompts"
import { MODELS } from "./models"

export const informalizeProofState = async (proofState: ProofState) => {
  console.log("informalizing proof state with model", MODELS.informalize.model)
  
  let enhancedPrompt = PROMPTS.informalize;
  
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: MODELS.informalize.model,
        system: enhancedPrompt,
        prompt: JSON.stringify(proofState)
      });
      return result;
    } catch (error) {
      console.log(`Informalize attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Enhance prompt with previous error information for retry
        enhancedPrompt = `${PROMPTS.informalize}

ERROR CORRECTION: Your previous attempt failed with error: ${error.message}
Please adjust your approach to avoid this error.`;
        
        console.log(`Retrying informalization (attempt ${attempt + 1}/${maxRetries})...`);
        continue;
      }
      
      // If final attempt, throw the error
      throw error;
    }
  }
}
