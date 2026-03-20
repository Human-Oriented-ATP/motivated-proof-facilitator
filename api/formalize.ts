import { formalizeStatementServer } from '../src/endpoints/Formalize'

export default async function handler(req: any, res: any) {
  console.log("formalizing...", req.body.problem)
  const problem = req.body.problem
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    const result = await formalizeStatementServer(problem)
    console.log("formalized", result)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
}
