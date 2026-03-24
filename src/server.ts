import express from 'express'
import bodyParser from "body-parser"
import cors from "cors"
import { formalizeProblem } from  "./endpoints/formalize.js"
import { runMove } from './endpoints/move.js'
import { evaluateFilterCondition } from './endpoints/filter.js'
import { formalizeStatement } from './endpoints/formalize-statement.js'
import { informalizeProofState } from './endpoints/informalize.js'
import { suggestStatements } from './endpoints/suggest.js'

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.post("/api/formalize", async (req, res) => {
  console.log("formalizing...", req.body.problem)
  const problem: string = req.body.problem
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    const result = await formalizeProblem(problem)
    console.log("formalized", result)
    res.send(result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

app.post("/api/move", async (req, res) => {
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
    const result = await runMove({ proofState, move, selections })
    res.send(result.text)
    console.log("move applied", result.reasoning)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

app.post("/api/filter", async (req, res) => {
  const { proofState, selections, name, triggerCriterion } = req.body
  
  if (!proofState) {
    console.error("no proof state provided")
    res.json({ success: false, error: "no proof state provided" })
    return
  }
  if (!selections) {
    console.error("no selections provided")
    res.json({ success: false, error: "no selections provided" })
    return
  }
  if (!triggerCriterion) {
    console.error("no trigger criterion provided")
    res.json({ success: false, error: "no trigger criterion provided" })
    return
  }
  try {
    console.log("filtering with criterion:", triggerCriterion)
    console.log("selections:", selections)
    
    const result = await evaluateFilterCondition({ proofState, selections, name, triggerCriterion })
    
    return res.send(result.text)

  } catch(err) {
    console.error(err)
    res.json({ success: false, error: err instanceof Error ? err.message : String(err) })
  }
})

app.post("/formalize-statement", async (req, res) => {
  const { statement, context } = req.body
  if (!statement) {
    console.error("no statement provided")
    res.send("FAILED: no statement provided")
    return
  }
  try {
    console.log("formalizing statement...", statement)
    const result = await formalizeStatement(statement, context)
    res.send(result.output.statement)
    console.log("formalized statement", result.output)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

app.post("/informalize", async (req, res) => {
  const proofState = req.body.proofState || req.body
  if (!proofState) {
    console.error("no proof state provided")
    res.send("FAILED: no proof state provided")
    return
  }
  try {
    console.log("informalizing proof state...")
    const result = await informalizeProofState(proofState)
    res.send(result)
    console.log("informalized", result)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

app.post("/api/suggest", async (req, res) => {
  try {
    console.log("generating suggestions...")
    const result = await suggestStatements(req.body)
    res.send(result)
    console.log("suggestions generated")
  } catch (err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

export default app