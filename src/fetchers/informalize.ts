import { ProofState } from "../core/ProofStateZod"

export async function informalizeProofState(proofState: ProofState): Promise<string> {
const response = await fetch("/api/informalize", {
    method: "POST", mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proofState: proofState }),
    })
    if (!response.ok) 
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`)
    const data = await response.text()
    return data
}