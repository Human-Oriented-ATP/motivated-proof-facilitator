import prompts from './prompts.yaml';
import { z } from 'zod';

const PromptsSchema = z.object({
  solve: z.string(),
  formalize: z.string(),
  informalize: z.string(),
  share: z.string(),
  suggest: z.string(),
  formalize_statement: z.string(),
  logical_strengthening: z.string(),
  logical_weakening: z.string(),
  instantiation_simplest: z.string(),
  extrapolation: z.string(),
  library_extraction: z.string(),
  type_generalization: z.string(),
  term_abstraction: z.string(),
  library_suggest: z.string(),
  moves: z.array(z.object({
    name: z.string(),
    description: z.string()
  }))
});
export const PROMPTS = PromptsSchema.parse(prompts);
