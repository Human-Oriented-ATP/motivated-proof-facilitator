import { ProofState } from "../core/ProofStateZod.js"

export async function informalizeProofState(proofState: ProofState): Promise<string> {
    const response = await fetch("/api/informalize", {
        method: "POST", mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofState: proofState }),
    })

    console.log("Received informalize response:", response)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    
    const result = await response.json()
    console.log("Received informalize response:", result)
    return result._output
}