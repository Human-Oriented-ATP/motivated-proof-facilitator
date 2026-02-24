import React, { useState, JSX } from "react"
import { ProofState, ProofStateSchema, ContextVariable, Statement, StatementSchema } from "../src/core/ProofStateZod"
import { StatementBuilder } from "./StatementBuilder"

interface ProofStateEditorProps {
  proofState: ProofState
  onUpdate: (newState: ProofState) => void
}

/**
 * Editor for incrementally building or modifying a ProofState.
 * Supports raw JSON editing, and adding variables, hypotheses, and goals.
 * Hypotheses and goals can be added either via the formalization endpoint
 * or built interactively using the StatementBuilder component.
 */
export function ProofStateEditor({ proofState, onUpdate }: ProofStateEditorProps): JSX.Element {
  // Active panel (only one at a time)
  const [activePanel, setActivePanel] = useState<"none" | "json" | "variable" | "hypothesis" | "goal">("none")

  // Context selector (for multi-context proof states)
  const [selectedContext, setSelectedContext] = useState(0)

  // Raw JSON editing
  const [rawJson, setRawJson] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Add variable state
  const [varName, setVarName] = useState("")
  const [varKind, setVarKind] = useState<"free" | "meta" | "let">("free")
  const [varDescription, setVarDescription] = useState("")
  const [varLetValue, setVarLetValue] = useState("")

  // Add hypothesis state
  const [hypLabel, setHypLabel] = useState("")
  const [hypMode, setHypMode] = useState<"formalize" | "build">("formalize")
  const [hypText, setHypText] = useState("")
  const [hypStatement, setHypStatement] = useState<Statement>("")
  const [hypLoading, setHypLoading] = useState(false)
  const [hypError, setHypError] = useState<string | null>(null)

  // Add goal state
  const [goalLabel, setGoalLabel] = useState("")
  const [goalMode, setGoalMode] = useState<"formalize" | "build">("formalize")
  const [goalText, setGoalText] = useState("")
  const [goalStatement, setGoalStatement] = useState<Statement>("")
  const [goalLoading, setGoalLoading] = useState(false)
  const [goalError, setGoalError] = useState<string | null>(null)

  const ctx = proofState[selectedContext] || { variables: [], hypotheses: [], goals: [] }

  const ensureContext = (): ProofState => {
    if (proofState.length === 0) return [{ variables: [], hypotheses: [], goals: [] }]
    return proofState.map(c => ({ ...c }))
  }

  // Panel toggling
  const togglePanel = (panel: "json" | "variable" | "hypothesis" | "goal") => {
    if (activePanel === panel) {
      setActivePanel("none")
    } else {
      setActivePanel(panel)
      if (panel === "json") {
        setRawJson(JSON.stringify(proofState, null, 2))
        setJsonError(null)
      }
    }
  }

  // --- Raw JSON ---
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(rawJson)
      const validated = ProofStateSchema.parse(parsed)
      onUpdate(validated)
      setJsonError(null)
      setActivePanel("none")
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON")
    }
  }

  // --- Add Variable ---
  const handleAddVariable = () => {
    if (!varName.trim()) return
    const state = ensureContext()
    const idx = Math.min(selectedContext, state.length - 1)
    const newVar: ContextVariable = varKind === "let"
      ? { kind: "let", name: varName, description: varDescription, value: varLetValue }
      : { kind: varKind, name: varName, description: varDescription }
    state[idx] = { ...state[idx], variables: [...state[idx].variables, newVar] }
    onUpdate(state)
    setVarName("")
    setVarDescription("")
    setVarLetValue("")
    setActivePanel("none")
  }

  // --- Formalize helper ---
  const formalizeStatement = async (text: string): Promise<Statement> => {
    const resp = await fetch("https://atp-backend-rygt.onrender.com/formalize-statement", {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statement: text }),
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return StatementSchema.parse(await resp.json())
  }

  // --- Add Hypothesis ---
  const handleAddHypothesis = async () => {
    if (!hypLabel.trim()) return
    setHypError(null)
    let statement: Statement
    if (hypMode === "formalize") {
      if (!hypText.trim()) return
      setHypLoading(true)
      try {
        statement = await formalizeStatement(hypText)
      } catch (err) {
        setHypError(err instanceof Error ? err.message : "Failed to formalize")
        setHypLoading(false)
        return
      }
      setHypLoading(false)
    } else {
      statement = hypStatement
    }
    const state = ensureContext()
    const idx = Math.min(selectedContext, state.length - 1)
    state[idx] = { ...state[idx], hypotheses: [...state[idx].hypotheses, { label: hypLabel, statement }] }
    onUpdate(state)
    setHypLabel("")
    setHypText("")
    setHypStatement("")
    setActivePanel("none")
  }

  // --- Add Goal ---
  const handleAddGoal = async () => {
    if (!goalLabel.trim()) return
    setGoalError(null)
    let statement: Statement
    if (goalMode === "formalize") {
      if (!goalText.trim()) return
      setGoalLoading(true)
      try {
        statement = await formalizeStatement(goalText)
      } catch (err) {
        setGoalError(err instanceof Error ? err.message : "Failed to formalize")
        setGoalLoading(false)
        return
      }
      setGoalLoading(false)
    } else {
      statement = goalStatement
    }
    const state = ensureContext()
    const idx = Math.min(selectedContext, state.length - 1)
    state[idx] = { ...state[idx], goals: [...state[idx].goals, { label: goalLabel, statement }] }
    onUpdate(state)
    setGoalLabel("")
    setGoalText("")
    setGoalStatement("")
    setActivePanel("none")
  }

  // --- Add Context ---
  const handleAddContext = () => {
    onUpdate([...proofState, { variables: [], hypotheses: [], goals: [] }])
    setSelectedContext(proofState.length)
  }

  return (
    <div style={es.container}>
      <div style={es.header}>
        <span style={es.title}>Edit Proof State</span>
        {proofState.length > 1 && (
          <select
            value={selectedContext}
            onChange={(e) => setSelectedContext(Number(e.target.value))}
            style={es.ctxSelect}
          >
            {proofState.map((_, i) => <option key={i} value={i}>Context {i + 1}</option>)}
          </select>
        )}
      </div>

      <div style={es.summary}>
        {ctx.variables.length} var{ctx.variables.length !== 1 ? "s" : ""}
        <span style={es.dot}>·</span>
        {ctx.hypotheses.length} hyp{ctx.hypotheses.length !== 1 ? "s" : ""}
        <span style={es.dot}>·</span>
        {ctx.goals.length} goal{ctx.goals.length !== 1 ? "s" : ""}
      </div>

      {/* Action buttons */}
      <div style={es.buttons}>
        <button onClick={() => togglePanel("json")} style={activePanel === "json" ? es.btnActive : es.btn}>
          Edit JSON
        </button>
        <button onClick={() => togglePanel("variable")} style={activePanel === "variable" ? es.btnActive : es.btn}>
          + Variable
        </button>
        <button onClick={() => togglePanel("hypothesis")} style={activePanel === "hypothesis" ? es.btnActive : es.btn}>
          + Hypothesis
        </button>
        <button onClick={() => togglePanel("goal")} style={activePanel === "goal" ? es.btnActive : es.btn}>
          + Goal
        </button>
        <button onClick={handleAddContext} style={es.btn}>
          + Context
        </button>
      </div>

      {/* Raw JSON Panel */}
      {activePanel === "json" && (
        <div style={es.panel}>
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            style={es.jsonArea}
            rows={14}
            spellCheck={false}
          />
          {jsonError && <div style={es.error}>{jsonError}</div>}
          <div style={es.panelBtns}>
            <button onClick={handleApplyJson} style={es.primaryBtn}>Apply</button>
            <button onClick={() => setActivePanel("none")} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Variable Panel */}
      {activePanel === "variable" && (
        <div style={es.panel}>
          <div style={es.panelHeader}>Add Variable</div>
          <div style={es.row}>
            <div style={{ flex: 1 }}>
              <label style={es.label}>Name</label>
              <input
                type="text"
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
                placeholder="e.g. $x$"
                style={es.input}
              />
            </div>
            <div style={{ width: "130px" }}>
              <label style={es.label}>Kind</label>
              <select
                value={varKind}
                onChange={(e) => setVarKind(e.target.value as "free" | "meta" | "let")}
                style={es.select}
              >
                <option value="free">Free</option>
                <option value="meta">Meta</option>
                <option value="let">Let</option>
              </select>
            </div>
          </div>
          <div>
            <label style={es.label}>Type / Description</label>
            <input
              type="text"
              value={varDescription}
              onChange={(e) => setVarDescription(e.target.value)}
              placeholder="e.g. $NN$ or Group"
              style={es.input}
            />
          </div>
          {varKind === "let" && (
            <div>
              <label style={es.label}>Value</label>
              <input
                type="text"
                value={varLetValue}
                onChange={(e) => setVarLetValue(e.target.value)}
                placeholder="e.g. $f(x)$"
                style={es.input}
              />
            </div>
          )}
          <div style={es.panelBtns}>
            <button onClick={handleAddVariable} disabled={!varName.trim()} style={es.primaryBtn}>
              Add Variable
            </button>
            <button onClick={() => setActivePanel("none")} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Hypothesis Panel */}
      {activePanel === "hypothesis" && (
        <div style={es.panel}>
          <div style={es.panelHeader}>Add Hypothesis</div>
          <div>
            <label style={es.label}>Label</label>
            <input
              type="text"
              value={hypLabel}
              onChange={(e) => setHypLabel(e.target.value)}
              placeholder="e.g. hyp_continuity"
              style={es.input}
            />
          </div>
          <div style={es.modeToggle}>
            <button
              onClick={() => setHypMode("formalize")}
              style={hypMode === "formalize" ? es.modeActive : es.modeInactive}
            >
              Formalize
            </button>
            <button
              onClick={() => setHypMode("build")}
              style={hypMode === "build" ? es.modeActive : es.modeInactive}
            >
              Build Interactively
            </button>
          </div>
          {hypMode === "formalize" ? (
            <div>
              <label style={es.label}>Statement (natural language)</label>
              <input
                type="text"
                value={hypText}
                onChange={(e) => setHypText(e.target.value)}
                placeholder="e.g. f is continuous on [a,b]"
                style={es.input}
              />
            </div>
          ) : (
            <div>
              <label style={es.label}>Build Statement</label>
              <StatementBuilder value={hypStatement} onChange={setHypStatement} />
            </div>
          )}
          {hypError && <div style={es.error}>{hypError}</div>}
          <div style={es.panelBtns}>
            <button
              onClick={handleAddHypothesis}
              disabled={!hypLabel.trim() || hypLoading || (hypMode === "formalize" && !hypText.trim())}
              style={es.primaryBtn}
            >
              {hypLoading ? "Formalizing..." : "Add Hypothesis"}
            </button>
            <button onClick={() => setActivePanel("none")} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Goal Panel */}
      {activePanel === "goal" && (
        <div style={es.panel}>
          <div style={es.panelHeader}>Add Goal</div>
          <div>
            <label style={es.label}>Label</label>
            <input
              type="text"
              value={goalLabel}
              onChange={(e) => setGoalLabel(e.target.value)}
              placeholder="e.g. main_goal"
              style={es.input}
            />
          </div>
          <div style={es.modeToggle}>
            <button
              onClick={() => setGoalMode("formalize")}
              style={goalMode === "formalize" ? es.modeActive : es.modeInactive}
            >
              Formalize
            </button>
            <button
              onClick={() => setGoalMode("build")}
              style={goalMode === "build" ? es.modeActive : es.modeInactive}
            >
              Build Interactively
            </button>
          </div>
          {goalMode === "formalize" ? (
            <div>
              <label style={es.label}>Statement (natural language)</label>
              <input
                type="text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="e.g. the limit exists"
                style={es.input}
              />
            </div>
          ) : (
            <div>
              <label style={es.label}>Build Statement</label>
              <StatementBuilder value={goalStatement} onChange={setGoalStatement} />
            </div>
          )}
          {goalError && <div style={es.error}>{goalError}</div>}
          <div style={es.panelBtns}>
            <button
              onClick={handleAddGoal}
              disabled={!goalLabel.trim() || goalLoading || (goalMode === "formalize" && !goalText.trim())}
              style={es.primaryBtn}
            >
              {goalLoading ? "Formalizing..." : "Add Goal"}
            </button>
            <button onClick={() => setActivePanel("none")} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

const es: Record<string, React.CSSProperties> = {
  container: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#edf2f7",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  title: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#2d3748",
  },
  ctxSelect: {
    padding: "4px 8px",
    border: "1px solid #cbd5e0",
    borderRadius: "4px",
    fontSize: "12px",
    backgroundColor: "white",
  },
  summary: {
    fontSize: "12px",
    color: "#718096",
    marginBottom: "12px",
  },
  dot: {
    margin: "0 6px",
    color: "#cbd5e0",
  },
  buttons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap" as const,
    marginBottom: "8px",
  },
  btn: {
    padding: "5px 12px",
    backgroundColor: "white",
    color: "#4a5568",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  btnActive: {
    padding: "5px 12px",
    backgroundColor: "#3182ce",
    color: "white",
    border: "1px solid #3182ce",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  panel: {
    marginTop: "8px",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  panelHeader: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#2d3748",
    marginBottom: "12px",
  },
  row: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#4a5568",
    marginBottom: "4px",
    marginTop: "8px",
  },
  input: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "13px",
    boxSizing: "border-box" as const,
  },
  select: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "13px",
    backgroundColor: "white",
    boxSizing: "border-box" as const,
  },
  jsonArea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "12px",
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
    lineHeight: "1.4",
  },
  error: {
    backgroundColor: "#fff5f5",
    color: "#c53030",
    border: "1px solid #feb2b2",
    borderRadius: "4px",
    padding: "8px 12px",
    marginTop: "8px",
    fontSize: "12px",
  },
  panelBtns: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
  },
  primaryBtn: {
    padding: "6px 16px",
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  cancelBtn: {
    padding: "6px 16px",
    backgroundColor: "transparent",
    color: "#718096",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  modeToggle: {
    display: "flex",
    gap: "6px",
    marginTop: "12px",
    marginBottom: "8px",
  },
  modeActive: {
    padding: "6px 14px",
    backgroundColor: "#ebf4ff",
    color: "#3182ce",
    border: "1px solid #3182ce",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  modeInactive: {
    padding: "6px 14px",
    backgroundColor: "white",
    color: "#718096",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
}
