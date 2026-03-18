import { ToolLoopAgent, ToolSet } from 'ai';
import { z } from 'zod';
import { ProofStateSchema } from './proofState';
import { PROMPTS } from './prompts';
import { formalizeStatement } from './formalize';
import { runMove } from './moves';
import { MODELS } from './models';

const TOOLS: ToolSet = {
  formalize: {
    description: PROMPTS.formalize,
    inputSchema: z.object({
      input: z.string()
    }),
    execute: ({ input }: { input: string }) => formalizeStatement(input)
  },
  reportProof: {
    description: PROMPTS.share,
    inputSchema: z.string(),
    execute: proof => console.log(proof)
  }
}

for (const move of PROMPTS.moves) {
  TOOLS[move.name] = {
    description: move.description,
    inputSchema: ProofStateSchema,
    execute: async (proofState) => {
      const result = await runMove({ proofState, move: move.description });
      return result._output;
    }
  }
}

const SolverAgent = new ToolLoopAgent({
  model: MODELS.solver.model,
  instructions: PROMPTS.solve,
  tools: TOOLS
})

export const run = async (prompt: string) => {
  const { text } = await SolverAgent.generate({
    prompt,
  });
  return { text };
}
