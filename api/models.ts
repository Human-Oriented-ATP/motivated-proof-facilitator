import { z } from 'zod';
import models from './models.yaml';

const ModelSchema = z.object({
  model: z.string()
});
const ModelConfigSchema = z.object({
  formalize: ModelSchema,
  informalize: ModelSchema,
  moves: ModelSchema,
  solver: ModelSchema,
  suggest: ModelSchema,
  formalize_statement: ModelSchema,
  filter: ModelSchema
});

export const MODELS = ModelConfigSchema.parse(models);
