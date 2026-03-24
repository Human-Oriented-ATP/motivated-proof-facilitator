import { BundledProofStateSchema, ProofState } from "../core/ProofStateZod"

export async function formalizeProblem(problem: string): Promise<ProofState> {
  const response = await fetch("/api/formalize", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ problem })
  })

  console.log("Received formalize response:", response)

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

  console.log("Received formalize response:", response)

  return BundledProofStateSchema.parse(await response.json()).proofState
}