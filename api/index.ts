import express from "express";
import { formalizeStatement } from "./formalize";
import { informalizeProofState } from "./informalize";
import { 
  suggestMovesFromString,
  suggestLogicalStrengthening,
  suggestLogicalWeakening,
  suggestInstantiationSimplest,
  suggestExtrapolation,
  suggestLibraryExtraction,
  suggestTypeGeneralization,
  suggestTermAbstraction,
  suggestLibrarySuggestion
} from "./suggest";
import { runMove } from "./moves";
import { formalizeStatement as formalizeStatementOnly } from "./formalizeStatement";
import { triggerTactics } from "./trigger";
import { evaluateFilterCondition } from "./filter";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

export const SAMPLE_PROBLEM = "If G is a group where x -> x inverse is an automorphism then G is abelian"

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
    const result = await formalizeStatement(problem);
    console.log("formalized", result.text)
    res.send(result.text);
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

// sample endpoint that formlizes the example problem
app.post("/formalize-example", async (_req, res) => {
  try {
    console.log("formalizing example problem...")
    const result = await formalizeStatement(SAMPLE_PROBLEM);
    console.log("formalized example problem", result.text)
    res.send(result.text);
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/solve", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("solving...", problem)
    const result = await formalizeStatement(problem);
    res.send(result.text);
    console.log("solved", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/suggest", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting...", problem)
    const result = await suggestMovesFromString(problem);
    res.send(result.text);
    console.log("suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

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
    const result = await runMove({ proofState, move, selections });
    res.json({
      reasoning: result._output.reasoning,
      proofState: [result._output.proofState]
    });
    console.log("move applied", result._output.reasoning)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/informalize", async (req, res) => {
  const proofState = req.body.proofState || req.body;
  if (!proofState) {
    console.error("no proof state provided")
    res.send("FAILED: no proof state provided")
    return
  }
  try {
    console.log("informalizing proof state...")
    const result = await informalizeProofState(proofState);
    res.send(result.text);
    console.log("informalized", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/formalize-statement", async (req, res) => {
  const { statement, context } = req.body;
  if (!statement) {
    console.error("no statement provided")
    res.send("FAILED: no statement provided")
    return
  }
  try {
    console.log("formalizing statement...", statement)
    const result = await formalizeStatementOnly(statement, context);
    res.send(result.output.statement);
    console.log("formalized statement", result.output)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

// Logical reasoning method endpoints
app.post("/logical-strengthening", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting logical strengthening...", problem)
    const result = await suggestLogicalStrengthening(problem);
    res.send(result.text);
    console.log("logical strengthening suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/logical-weakening", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting logical weakening...", problem)
    const result = await suggestLogicalWeakening(problem);
    res.send(result.text);
    console.log("logical weakening suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/instantiation-simplest", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting simplest instantiation...", problem)
    const result = await suggestInstantiationSimplest(problem);
    res.send(result.text);
    console.log("simplest instantiation suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/extrapolation", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting extrapolation...", problem)
    const result = await suggestExtrapolation(problem);
    res.send(result.text);
    console.log("extrapolation suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/library-extraction", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting library extraction...", problem)
    const result = await suggestLibraryExtraction(problem);
    res.send(result.text);
    console.log("library extraction suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/type-generalization", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting type generalization...", problem)
    const result = await suggestTypeGeneralization(problem);
    res.send(result.text);
    console.log("type generalization suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/term-abstraction", async (req, res) => {
  const problem = req.body.problem;
  if (!problem) {
    console.error("no problem provided")
    res.send("FAILED: no problem provided")
    return
  }
  try {
    console.log("suggesting term abstraction...", problem)
    const result = await suggestTermAbstraction(problem);
    res.send(result.text);
    console.log("term abstraction suggested", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.post("/library-suggest", async (req, res) => {
  const { proofState, selections, moveDescription } = req.body;
  if (!proofState) {
    console.error("no proof state provided")
    res.send("FAILED: no proof state provided")
    return
  }
  if (!selections) {
    console.error("no selections provided")
    res.send("FAILED: no selections provided")
    return
  }
  if (!moveDescription) {
    console.error("no move description provided")
    res.send("FAILED: no move description provided")
    return
  }
  try {
    console.log("suggesting library results...", moveDescription)
    const result = await suggestLibrarySuggestion(proofState, selections, moveDescription);
    res.send(result.text);
    console.log("library suggestions provided", result.text)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

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
});

app.post("/trigger", async (req, res) => {
  const proofState = req.body.proofState || req.body;
  if (!proofState) {
    console.error("no proof state provided")
    res.send("FAILED: no proof state provided")
    return
  }
  try {
    console.log("triggering tactics for proof state...")
    const result = await triggerTactics(proofState);
    res.json(result);
    console.log("triggered tactics", result)
  } catch(err) {
    console.error(err)
    res.send("FAILED: " + err)
  }
});

app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
