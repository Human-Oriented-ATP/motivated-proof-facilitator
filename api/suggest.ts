import { generateText, Output } from "ai"
import { PROMPTS } from "./prompts"
import { MODELS } from "./models"
import { z } from "zod"
import { ProofState } from "./proofState"
import { formalizeStatement } from "./formalize"

const SuggestionSchema = z.object({
  moves: z.array(z.object({
    name: z.string(),
    reason: z.string()
  }))
})

export const suggestMoves = async (proofState: ProofState) => {
  console.log("suggesting moves...")
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.suggest,
    prompt: JSON.stringify(proofState),
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestMovesFromString = async (naturalLanguageInput: string) => {
  const formalResult = await formalizeStatement(naturalLanguageInput);
  return suggestMoves(formalResult.output);
}

// Logical reasoning method functions
export const suggestLogicalStrengthening = async (naturalLanguageInput: string) => {
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.logical_strengthening,
    prompt: naturalLanguageInput,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestLogicalWeakening = async (naturalLanguageInput: string) => {
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.logical_weakening,
    prompt: naturalLanguageInput,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestInstantiationSimplest = async (naturalLanguageInput: string) => {
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.instantiation_simplest,
    prompt: naturalLanguageInput,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestExtrapolation = async (naturalLanguageInput: string) => {
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.extrapolation,
    prompt: naturalLanguageInput,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestLibraryExtraction = async (naturalLanguageInput: string) => {
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.library_extraction,
    prompt: naturalLanguageInput,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestTypeGeneralization = async (naturalLanguageInput: string) => {
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.type_generalization,
    prompt: naturalLanguageInput,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestTermAbstraction = async (naturalLanguageInput: string) => {
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.term_abstraction,
    prompt: naturalLanguageInput,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}

export const suggestLibrarySuggestion = async (proofState: ProofState, selections: object, moveDescription: string) => {
  const prompt = JSON.stringify({
    proofState,
    selections,
    moveDescription
  });
  
  const result = await generateText({
    model: MODELS.suggest.model,
    system: PROMPTS.library_suggest,
    prompt,
    output: Output.object({
      schema: SuggestionSchema
    }),
  });
  return result;
}
