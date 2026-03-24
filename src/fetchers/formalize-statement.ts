import { ProofState } from "../core/ProofStateZod"
import { Statement, StatementSchema } from "../core/ProofStateZod"

export async function formalizeStatement({ statement, context }: { statement: string; context?: ProofState }): Promise<Statement> {
    const response = await fetch("/api/formalize-statement", {
        method: "POST", mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement, context })
    })
 
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
 
    return StatementSchema.parse(await response.json())
}