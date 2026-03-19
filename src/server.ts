import express from 'express'
import { formalizeStatementServer } from './endpoints/Formalize';
import bodyParser from "body-parser"
import cors from "cors"
import { runMoveServer } from './endpoints/Move';

const app = express()

const port = process.env.PORT || 3000

app.use(cors());
app.use(bodyParser.json());

app.post("/formalize", async (req, res) => {
  console.log("formalizing...", req.body.problem)
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    const result = await formalizeStatementServer(problem)
    console.log("formalized", result)
    res.send(result)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

app.post("/move", async (req, res) => {
  const { proofState, move, selections } = req.body;
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
    const result = await runMoveServer({ proofState, move, selections });
    res.json({
      reasoning: result.reasoning,
      proofState: [result.proofState]
    });
    console.log("move applied", result.reasoning)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
})

/**
app.post("/filter", async (req, res) => {
  const { proofState, selections, triggerCriterion } = req.body;
  
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
    
    const result = await evaluateFilterCondition(proofState, selections, triggerCriterion);
    
    res.json({ 
      success: true, 
      meetsCondition: result.meetsCondition,
      reasoning: result.reasoning,
      proofState,
      selections,
      triggerCriterion 
    });
    
    console.log("filter result:", result.meetsCondition, "reasoning:", result.reasoning)
  } catch(err) {
    console.error(err)
    res.json({ success: false, error: err instanceof Error ? err.message : String(err) })
  }
})
 */

export default app