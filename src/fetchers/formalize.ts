import { BundledProofStateSchema, ProofState } from "../core/ProofStateZod"

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

  console.log("Received formalize response:", response)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`)
  }

  console.log("Received formalize response:", response)

  const data: unknown = await response.json()

  console.log("Received formalize response:", data)

  return BundledProofStateSchema.parse(data).proofState
}