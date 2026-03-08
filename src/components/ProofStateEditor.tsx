import React, { useState, JSX } from "react"
import { ProofState, ProofStateSchema, ContextVariable, Statement, StatementSchema } from "../core/ProofStateZod"
import { StatementBuilder } from "./StatementBuilder"

export interface ProofStateEditorProps {
  proofState: ProofState
  onUpdate: (newState: ProofState) => void
}

/** Returns a concise human-readable preview of a Statement. */
function statementPreview(stmt: Statement): string {
  if (typeof stmt === "string") return stmt || "(empty)"
  switch (stmt.kind) {
    case "conjunction":  return stmt.statements.map(statementPreview).join(" ∧ ")
    case "disjunction":  return stmt.statements.map(statementPreview).join(" ∨ ")
    case "negation":     return `¬(${statementPreview(stmt.statement)})`
    case "implication":  return `${statementPreview(stmt.antecedent)} → ${statementPreview(stmt.consequent)}`
    case "equivalence":  return `${statementPreview(stmt.left)} ↔ ${statementPreview(stmt.right)}`
    case "universal":    return `∀${stmt.variable.name}. ${statementPreview(stmt.statement)}`
    case "existential":  return `∃${stmt.variable.name}. ${statementPreview(stmt.statement)}`
    case "highlight":    return statementPreview(stmt.statement)
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s
}

function kindBadgeStyle(kind: string): React.CSSProperties {
  const palette: Record<string, { bg: string; color: string; border: string }> = {
    free:  { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    meta:  { bg: "#faf5ff", color: "#9333ea", border: "#e9d5ff" },
    let:   { bg: "#ecfeff", color: "#0891b2", border: "#cffafe" },
    hyp:   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    goal:  { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  }
  const p = palette[kind] ?? { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" }
  return {
    fontSize: "10px",
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: p.bg,
    color: p.color,
    border: `1px solid ${p.border}`,
    whiteSpace: "nowrap",
    flexShrink: 0,
    userSelect: "none",
  }
}

/**
 * Editor for incrementally building or modifying a ProofState.
 * Supports raw JSON editing, and adding/editing/deleting variables, hypotheses, and goals.
 * Hypotheses and goals can be added either via the formalization endpoint
 * or built interactively using the StatementBuilder component.
 */
export function ProofStateEditor({ proofState, onUpdate }: ProofStateEditorProps): JSX.Element {
  const [activePanel, setActivePanel] = useState<"none" | "json" | "variable" | "hypothesis" | "goal">("none")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [selectedContext, setSelectedContext] = useState(0)

  const [rawJson, setRawJson] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)

  const [varName, setVarName] = useState("")
  const [varKind, setVarKind] = useState<"free" | "meta" | "let">("free")
  const [varDescription, setVarDescription] = useState("")
  const [varLetValue, setVarLetValue] = useState("")

  const [hypLabel, setHypLabel] = useState("")
  const [hypMode, setHypMode] = useState<"formalize" | "build">("formalize")
  const [hypText, setHypText] = useState("")
  const [hypStatement, setHypStatement] = useState<Statement>("")
  const [hypLoading, setHypLoading] = useState(false)
  const [hypError, setHypError] = useState<string | null>(null)

  const [goalLabel, setGoalLabel] = useState("")
  const [goalMode, setGoalMode] = useState<"formalize" | "build">("formalize")
  const [goalText, setGoalText] = useState("")
  const [goalStatement, setGoalStatement] = useState<Statement>("")
  const [goalLoading, setGoalLoading] = useState(false)
  const [goalError, setGoalError] = useState<string | null>(null)

  const ctx = proofState[selectedContext] || { variables: [], hypotheses: [], goals: [] }
  const ctxIdx = Math.min(selectedContext, Math.max(0, proofState.length - 1))

  const ensureContext = (): ProofState => {
    if (proofState.length === 0) return [{ variables: [], hypotheses: [], goals: [] }]
    return proofState.map(c => ({ ...c }))
  }

  const resetVarForm  = () => { setVarName(""); setVarKind("free"); setVarDescription(""); setVarLetValue("") }
  const resetHypForm  = () => { setHypLabel(""); setHypMode("formalize"); setHypText(""); setHypStatement(""); setHypError(null) }
  const resetGoalForm = () => { setGoalLabel(""); setGoalMode("formalize"); setGoalText(""); setGoalStatement(""); setGoalError(null) }

  const closePanel = () => { setActivePanel("none"); setEditingIndex(null) }

  const togglePanel = (panel: "json" | "variable" | "hypothesis" | "goal") => {
    if (activePanel === panel && editingIndex === null) {
      closePanel()
    } else {
      setEditingIndex(null)
      setActivePanel(panel)
      if (panel === "json") {
        setRawJson(JSON.stringify(proofState, null, 2))
        setJsonError(null)
      } else if (panel === "variable")   { resetVarForm() }
        else if (panel === "hypothesis") { resetHypForm() }
        else if (panel === "goal")       { resetGoalForm() }
    }
  }

  const handleEditVariable = (idx: number) => {
    const v = ctx.variables[idx]
    setVarName(v.name)
    setVarKind(v.kind)
    setVarDescription(v.description)
    setVarLetValue(v.kind === "let" ? v.value : "")
    setEditingIndex(idx)
    setActivePanel("variable")
  }

  const handleEditHypothesis = (idx: number) => {
    const h = ctx.hypotheses[idx]
    setHypLabel(h.label)
    setHypMode("build")
    setHypStatement(h.statement)
    setHypText("")
    setHypError(null)
    setEditingIndex(idx)
    setActivePanel("hypothesis")
  }

  const handleEditGoal = (idx: number) => {
    const g = ctx.goals[idx]
    setGoalLabel(g.label)
    setGoalMode("build")
    setGoalStatement(g.statement)
    setGoalText("")
    setGoalError(null)
    setEditingIndex(idx)
    setActivePanel("goal")
  }

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(rawJson)
      const validated = ProofStateSchema.parse(parsed)
      try {
        onUpdate(validated)
      } catch (updateErr) {
        setJsonError(updateErr instanceof Error ? updateErr.message : "Update failed")
        return
      }
      setJsonError(null)
      closePanel()
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message
        setJsonError(msg.length > 500 ? msg.slice(0, 500) + "…" : msg)
      } else {
        setJsonError("Invalid JSON")
      }
    }
  }

  const handleSaveVariable = () => {
    if (!varName.trim()) return
    const state = ensureContext()
    const newVar: ContextVariable = varKind === "let"
      ? { kind: "let", name: varName, description: varDescription, value: varLetValue }
      : { kind: varKind, name: varName, description: varDescription }
    if (editingIndex !== null) {
      const vars = [...state[ctxIdx].variables]
      vars[editingIndex] = newVar
      state[ctxIdx] = { ...state[ctxIdx], variables: vars }
    } else {
      state[ctxIdx] = { ...state[ctxIdx], variables: [...state[ctxIdx].variables, newVar] }
    }
    onUpdate(state)
    resetVarForm()
    closePanel()
  }

  const handleDeleteVariable = (varIdx: number) => {
    const state = ensureContext()
    state[ctxIdx] = { ...state[ctxIdx], variables: state[ctxIdx].variables.filter((_, i) => i !== varIdx) }
    onUpdate(state)
    if (activePanel === "variable" && editingIndex === varIdx) closePanel()
  }

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

  const handleSaveHypothesis = async () => {
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
    const newHyp = { label: hypLabel, statement }
    if (editingIndex !== null) {
      const hyps = [...state[ctxIdx].hypotheses]
      hyps[editingIndex] = newHyp
      state[ctxIdx] = { ...state[ctxIdx], hypotheses: hyps }
    } else {
      state[ctxIdx] = { ...state[ctxIdx], hypotheses: [...state[ctxIdx].hypotheses, newHyp] }
    }
    onUpdate(state)
    resetHypForm()
    closePanel()
  }

  const handleDeleteHypothesis = (hypIdx: number) => {
    const state = ensureContext()
    state[ctxIdx] = { ...state[ctxIdx], hypotheses: state[ctxIdx].hypotheses.filter((_, i) => i !== hypIdx) }
    onUpdate(state)
    if (activePanel === "hypothesis" && editingIndex === hypIdx) closePanel()
  }

  const handleSaveGoal = async () => {
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
    const newGoal = { label: goalLabel, statement }
    if (editingIndex !== null) {
      const goals = [...state[ctxIdx].goals]
      goals[editingIndex] = newGoal
      state[ctxIdx] = { ...state[ctxIdx], goals: goals }
    } else {
      state[ctxIdx] = { ...state[ctxIdx], goals: [...state[ctxIdx].goals, newGoal] }
    }
    onUpdate(state)
    resetGoalForm()
    closePanel()
  }

  const handleDeleteGoal = (goalIdx: number) => {
    const state = ensureContext()
    state[ctxIdx] = { ...state[ctxIdx], goals: state[ctxIdx].goals.filter((_, i) => i !== goalIdx) }
    onUpdate(state)
    if (activePanel === "goal" && editingIndex === goalIdx) closePanel()
  }

  const handleAddContext = () => {
    onUpdate([...proofState, { variables: [], hypotheses: [], goals: [] }])
    setSelectedContext(proofState.length)
  }

  const hasItems = ctx.variables.length > 0 || ctx.hypotheses.length > 0 || ctx.goals.length > 0

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
        <button onClick={() => togglePanel("variable")} style={activePanel === "variable" && editingIndex === null ? es.btnActive : es.btn}>
          + Variable
        </button>
        <button onClick={() => togglePanel("hypothesis")} style={activePanel === "hypothesis" && editingIndex === null ? es.btnActive : es.btn}>
          + Hypothesis
        </button>
        <button onClick={() => togglePanel("goal")} style={activePanel === "goal" && editingIndex === null ? es.btnActive : es.btn}>
          + Goal
        </button>
        <button onClick={handleAddContext} style={es.btn}>
          + Context
        </button>
      </div>

      {/* Current items list */}
      {hasItems && (
        <div style={es.itemsList}>
          {ctx.variables.map((v, i) => (
            <div key={`var-${i}`} style={activePanel === "variable" && editingIndex === i ? es.itemRowActive : es.itemRow}>
              <span style={kindBadgeStyle(v.kind)}>{v.kind}</span>
              <span style={es.itemText}>
                <strong>{v.name}</strong>
                {v.description ? ` : ${v.description}` : ""}
                {v.kind === "let" ? ` ≔ ${v.value}` : ""}
              </span>
              <div style={es.itemActions}>
                <button onClick={() => handleEditVariable(i)} style={es.editBtn} title="Edit">✎</button>
                <button onClick={() => handleDeleteVariable(i)} style={es.deleteBtn} title="Delete">×</button>
              </div>
            </div>
          ))}
          {ctx.hypotheses.map((h, i) => (
            <div key={`hyp-${i}`} style={activePanel === "hypothesis" && editingIndex === i ? es.itemRowActive : es.itemRow}>
              <span style={kindBadgeStyle("hyp")}>hyp</span>
              <span style={es.itemText} title={statementPreview(h.statement)}>
                <strong>{h.label}</strong>
                {" — "}
                <span style={es.itemPreview}>{truncate(statementPreview(h.statement), 70)}</span>
              </span>
              <div style={es.itemActions}>
                <button onClick={() => handleEditHypothesis(i)} style={es.editBtn} title="Edit">✎</button>
                <button onClick={() => handleDeleteHypothesis(i)} style={es.deleteBtn} title="Delete">×</button>
              </div>
            </div>
          ))}
          {ctx.goals.map((g, i) => (
            <div key={`goal-${i}`} style={activePanel === "goal" && editingIndex === i ? es.itemRowActive : es.itemRow}>
              <span style={kindBadgeStyle("goal")}>goal</span>
              <span style={es.itemText} title={statementPreview(g.statement)}>
                <strong>{g.label}</strong>
                {" — "}
                <span style={es.itemPreview}>{truncate(statementPreview(g.statement), 70)}</span>
              </span>
              <div style={es.itemActions}>
                <button onClick={() => handleEditGoal(i)} style={es.editBtn} title="Edit">✎</button>
                <button onClick={() => handleDeleteGoal(i)} style={es.deleteBtn} title="Delete">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <button onClick={closePanel} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add / Edit Variable Panel */}
      {activePanel === "variable" && (
        <div style={es.panel}>
          <div style={es.panelHeader}>{editingIndex !== null ? "Edit Variable" : "Add Variable"}</div>
          <div style={es.row}>
            <div style={{ flex: 1 }}>
              <label style={es.label}>Name</label>
              <input type="text" value={varName} onChange={(e) => setVarName(e.target.value)} placeholder="e.g. $x$" style={es.input} />
            </div>
            <div style={{ width: "130px" }}>
              <label style={es.label}>Kind</label>
              <select value={varKind} onChange={(e) => setVarKind(e.target.value as "free" | "meta" | "let")} style={es.select}>
                <option value="free">Free</option>
                <option value="meta">Meta</option>
                <option value="let">Let</option>
              </select>
            </div>
          </div>
          <div>
            <label style={es.label}>Type / Description</label>
            <input type="text" value={varDescription} onChange={(e) => setVarDescription(e.target.value)} placeholder="e.g. $NN$ or Group" style={es.input} />
          </div>
          {varKind === "let" && (
            <div>
              <label style={es.label}>Value</label>
              <input type="text" value={varLetValue} onChange={(e) => setVarLetValue(e.target.value)} placeholder="e.g. $f(x)$" style={es.input} />
            </div>
          )}
          <div style={es.panelBtns}>
            <button onClick={handleSaveVariable} disabled={!varName.trim()} style={es.primaryBtn}>
              {editingIndex !== null ? "Save Changes" : "Add Variable"}
            </button>
            {editingIndex !== null && (
              <button onClick={() => handleDeleteVariable(editingIndex)} style={es.dangerBtn}>Delete</button>
            )}
            <button onClick={closePanel} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add / Edit Hypothesis Panel */}
      {activePanel === "hypothesis" && (
        <div style={es.panel}>
          <div style={es.panelHeader}>{editingIndex !== null ? "Edit Hypothesis" : "Add Hypothesis"}</div>
          <div>
            <label style={es.label}>Label</label>
            <input type="text" value={hypLabel} onChange={(e) => setHypLabel(e.target.value)} placeholder="e.g. hyp_continuity" style={es.input} />
          </div>
          <div style={es.modeToggle}>
            <button onClick={() => setHypMode("formalize")} style={hypMode === "formalize" ? es.modeActive : es.modeInactive}>Formalize</button>
            <button onClick={() => setHypMode("build")} style={hypMode === "build" ? es.modeActive : es.modeInactive}>Build Interactively</button>
          </div>
          {hypMode === "formalize" ? (
            <div>
              <label style={es.label}>Statement (natural language)</label>
              <input type="text" value={hypText} onChange={(e) => setHypText(e.target.value)} placeholder="e.g. f is continuous on [a,b]" style={es.input} />
            </div>
          ) : (
            <div>
              <label style={es.label}>Build Statement</label>
              <StatementBuilder value={hypStatement} onChange={setHypStatement} />
            </div>
          )}
          {hypError && <div style={es.error}>{hypError}</div>}
          <div style={es.panelBtns}>
            <button onClick={handleSaveHypothesis} disabled={!hypLabel.trim() || hypLoading || (hypMode === "formalize" && !hypText.trim())} style={es.primaryBtn}>
              {hypLoading ? "Formalizing..." : editingIndex !== null ? "Save Changes" : "Add Hypothesis"}
            </button>
            {editingIndex !== null && (
              <button onClick={() => handleDeleteHypothesis(editingIndex)} style={es.dangerBtn}>Delete</button>
            )}
            <button onClick={closePanel} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Panel */}
      {activePanel === "goal" && (
        <div style={es.panel}>
          <div style={es.panelHeader}>{editingIndex !== null ? "Edit Goal" : "Add Goal"}</div>
          <div>
            <label style={es.label}>Label</label>
            <input type="text" value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)} placeholder="e.g. main_goal" style={es.input} />
          </div>
          <div style={es.modeToggle}>
            <button onClick={() => setGoalMode("formalize")} style={goalMode === "formalize" ? es.modeActive : es.modeInactive}>Formalize</button>
            <button onClick={() => setGoalMode("build")} style={goalMode === "build" ? es.modeActive : es.modeInactive}>Build Interactively</button>
          </div>
          {goalMode === "formalize" ? (
            <div>
              <label style={es.label}>Statement (natural language)</label>
              <input type="text" value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder="e.g. the limit exists" style={es.input} />
            </div>
          ) : (
            <div>
              <label style={es.label}>Build Statement</label>
              <StatementBuilder value={goalStatement} onChange={setGoalStatement} />
            </div>
          )}
          {goalError && <div style={es.error}>{goalError}</div>}
          <div style={es.panelBtns}>
            <button onClick={handleSaveGoal} disabled={!goalLabel.trim() || goalLoading || (goalMode === "formalize" && !goalText.trim())} style={es.primaryBtn}>
              {goalLoading ? "Formalizing..." : editingIndex !== null ? "Save Changes" : "Add Goal"}
            </button>
            {editingIndex !== null && (
              <button onClick={() => handleDeleteGoal(editingIndex)} style={es.dangerBtn}>Delete</button>
            )}
            <button onClick={closePanel} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

const es: Record<string, React.CSSProperties> = {
  container: {
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
  itemsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    marginBottom: "8px",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    backgroundColor: "white",
    borderRadius: "5px",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
  },
  itemRowActive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    backgroundColor: "#ebf4ff",
    borderRadius: "5px",
    border: "1px solid #3182ce",
    fontSize: "12px",
  },
  itemText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    color: "#2d3748",
  },
  itemPreview: {
    color: "#718096",
    fontWeight: 400,
  },
  itemActions: {
    display: "flex",
    gap: "4px",
    flexShrink: 0,
  },
  editBtn: {
    padding: "2px 7px",
    backgroundColor: "transparent",
    color: "#3182ce",
    border: "1px solid #bee3f8",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
    lineHeight: 1,
  },
  deleteBtn: {
    padding: "2px 7px",
    backgroundColor: "transparent",
    color: "#e53e3e",
    border: "1px solid #fed7d7",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    lineHeight: 1,
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
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
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
  dangerBtn: {
    padding: "6px 16px",
    backgroundColor: "transparent",
    color: "#e53e3e",
    border: "1px solid #fc8181",
    borderRadius: "5px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
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
