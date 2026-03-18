import { generateText, Output } from "ai"
import { ProofStateSchema } from "./proofState"
import { PROMPTS } from "./prompts"
import { MODELS } from "./models"

export const formalizeStatement = async (naturalLanguageStatement: string) => {
  console.log("formalizing statement with model", MODELS.formalize.model)
  
  let enhancedPrompt = PROMPTS.formalize;
  
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: MODELS.formalize.model,
        system: enhancedPrompt,
        prompt: naturalLanguageStatement,
        output: Output.object({
          schema: ProofStateSchema
        }),
      });
      return result;
    } catch (error) {
      console.log(`Formalize attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Enhance prompt with previous error information for retry
        enhancedPrompt = `${PROMPTS.formalize}

ERROR CORRECTION: Your previous attempt failed with error: ${error.message}
Please adjust your approach to avoid this error.`;
        
        console.log(`Retrying formalization (attempt ${attempt + 1}/${maxRetries})...`);
        continue;
      }
      
      // If final attempt, throw the error
      throw error;
    }
  }
}