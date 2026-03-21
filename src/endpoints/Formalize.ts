import { generateText, GenerateTextResult, Output, ToolSet } from "ai"
import { MODELS } from "./models"
import { BundledProofState, BundledProofStateSchema, ProofState, ProofStateSchema } from "../core/ProofStateZod"
import z from "zod"

export async function formalizeStatement({ problem }: { problem: string }): Promise<ProofState> {
  const response = await fetch("/api/formalize", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      problem
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  console.log("Received formalize response:", response)

  const data: unknown = await response.json()

  console.log("Received formalize response:", data)

  return BundledProofStateSchema.parse(data).proofState
}