import { runMoveServer } from '../src/endpoints/Move'

export default async function handler(req: any, res: any) {
  const { proofState, move, selections } = req.body
  if (!proofState) {
    console.error("no proof state provided")
    res.send("FAILED: no proof state provided")
    return
  }
  if (!move) {
    console.error("no move provided")
    res.send("FAILED: no move provided")
    return
  }
  try {
    console.log("applying move...", move)
    const result = await runMoveServer({ proofState, move, selections })
    res.json({ reasoning: result.reasoning, proofState: [result.proofState] })
    console.log("move applied", result.reasoning)
  } catch (err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
}
