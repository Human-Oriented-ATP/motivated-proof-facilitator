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

const KIND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free:  { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  meta:  { bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe" },
  let:   { bg: "#ecfeff", text: "#0e7490", border: "#a5f3fc" },
  hyp:   { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  goal:  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
}

function KindBadge({ kind }: { kind: string }) {
  const c = KIND_COLORS[kind] ?? { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" }
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em",
      padding: "2px 7px", borderRadius: "4px",
      backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: "nowrap", flexShrink: 0, userSelect: "none",
      textTransform: "uppercase",
    }}>
      {kind}
    </span>
  )
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

      {/* Header */}
      <div style={es.header}>
        <div style={es.headerLeft}>
          <span style={es.title}>Edit Proof State</span>
          <span style={es.statsSummary}>
            {ctx.variables.length}v · {ctx.hypotheses.length}h · {ctx.goals.length}g
          </span>
        </div>
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

      {/* Toolbar */}
      <div style={es.toolbar}>
        <div style={es.toolbarGroup}>
          <button onClick={() => togglePanel("variable")}
            style={activePanel === "variable" && editingIndex === null ? es.toolBtnActive : es.toolBtn}>
            + Var
          </button>
          <button onClick={() => togglePanel("hypothesis")}
            style={activePanel === "hypothesis" && editingIndex === null ? es.toolBtnActive : es.toolBtn}>
            + Hyp
          </button>
          <button onClick={() => togglePanel("goal")}
            style={activePanel === "goal" && editingIndex === null ? es.toolBtnActive : es.toolBtn}>
            + Goal
          </button>
          <button onClick={handleAddContext} style={es.toolBtn}>
            + Context
          </button>
        </div>
        <button onClick={() => togglePanel("json")}
          style={activePanel === "json" ? es.jsonBtnActive : es.jsonBtn}>
          {"{}"} JSON
        </button>
      </div>

      {/* Current items list */}
      {hasItems && (
        <div style={es.itemsList}>
          {ctx.variables.map((v, i) => (
            <div key={`var-${i}`} style={activePanel === "variable" && editingIndex === i ? es.itemRowActive : es.itemRow}>
              <KindBadge kind={v.kind} />
              <span style={es.itemText}>
                <strong>{v.name}</strong>
                {v.description ? <span style={es.itemDesc}> : {v.description}</span> : ""}
                {v.kind === "let" ? <span style={es.itemDesc}> ≔ {v.value}</span> : ""}
              </span>
              <div style={es.itemActions}>
                <button onClick={() => handleEditVariable(i)} style={es.editBtn} title="Edit">✎</button>
                <button onClick={() => handleDeleteVariable(i)} style={es.deleteBtn} title="Delete">×</button>
              </div>
            </div>
          ))}
          {ctx.hypotheses.map((h, i) => (
            <div key={`hyp-${i}`} style={activePanel === "hypothesis" && editingIndex === i ? es.itemRowActive : es.itemRow}>
              <KindBadge kind="hyp" />
              <span style={es.itemText} title={statementPreview(h.statement)}>
                <strong>{h.label}</strong>
                <span style={es.itemSep}> — </span>
                <span style={es.itemPreview}>{truncate(statementPreview(h.statement), 60)}</span>
              </span>
              <div style={es.itemActions}>
                <button onClick={() => handleEditHypothesis(i)} style={es.editBtn} title="Edit">✎</button>
                <button onClick={() => handleDeleteHypothesis(i)} style={es.deleteBtn} title="Delete">×</button>
              </div>
            </div>
          ))}
          {ctx.goals.map((g, i) => (
            <div key={`goal-${i}`} style={activePanel === "goal" && editingIndex === i ? es.itemRowActive : es.itemRow}>
              <KindBadge kind="goal" />
              <span style={es.itemText} title={statementPreview(g.statement)}>
                <strong>{g.label}</strong>
                <span style={es.itemSep}> — </span>
                <span style={es.itemPreview}>{truncate(statementPreview(g.statement), 60)}</span>
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
          <div style={es.panelTitle}>Raw JSON</div>
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
          <div style={es.panelTitle}>{editingIndex !== null ? "Edit Variable" : "New Variable"}</div>
          <div style={es.row}>
            <div style={{ flex: 1 }}>
              <label style={es.label}>Name</label>
              <input type="text" value={varName} onChange={(e) => setVarName(e.target.value)}
                placeholder="e.g. $x$" style={es.input} autoFocus />
            </div>
            <div style={{ width: "120px" }}>
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
            <input type="text" value={varDescription} onChange={(e) => setVarDescription(e.target.value)}
              placeholder="e.g. $NN$ or Group" style={es.input} />
          </div>
          {varKind === "let" && (
            <div>
              <label style={es.label}>Value</label>
              <input type="text" value={varLetValue} onChange={(e) => setVarLetValue(e.target.value)}
                placeholder="e.g. $f(x)$" style={es.input} />
            </div>
          )}
          <div style={es.panelBtns}>
            <button onClick={handleSaveVariable} disabled={!varName.trim()} style={es.primaryBtn}>
              {editingIndex !== null ? "Save" : "Add Variable"}
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
          <div style={es.panelTitle}>{editingIndex !== null ? "Edit Hypothesis" : "New Hypothesis"}</div>
          <div>
            <label style={es.label}>Label</label>
            <input type="text" value={hypLabel} onChange={(e) => setHypLabel(e.target.value)}
              placeholder="e.g. hyp_continuity" style={es.input} autoFocus />
          </div>
          <div style={es.modeToggle}>
            <button onClick={() => setHypMode("formalize")} style={hypMode === "formalize" ? es.modeActive : es.modeInactive}>
              Formalize
            </button>
            <button onClick={() => setHypMode("build")} style={hypMode === "build" ? es.modeActive : es.modeInactive}>
              Build
            </button>
          </div>
          {hypMode === "formalize" ? (
            <div>
              <label style={es.label}>Statement (natural language)</label>
              <input type="text" value={hypText} onChange={(e) => setHypText(e.target.value)}
                placeholder="e.g. f is continuous on [a,b]" style={es.input} />
            </div>
          ) : (
            <div>
              <label style={es.label}>Build Statement</label>
              <StatementBuilder value={hypStatement} onChange={setHypStatement} />
            </div>
          )}
          {hypError && <div style={es.error}>{hypError}</div>}
          <div style={es.panelBtns}>
            <button onClick={handleSaveHypothesis}
              disabled={!hypLabel.trim() || hypLoading || (hypMode === "formalize" && !hypText.trim())}
              style={es.primaryBtn}>
              {hypLoading ? "Formalizing…" : editingIndex !== null ? "Save" : "Add Hypothesis"}
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
          <div style={es.panelTitle}>{editingIndex !== null ? "Edit Goal" : "New Goal"}</div>
          <div>
            <label style={es.label}>Label</label>
            <input type="text" value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)}
              placeholder="e.g. main_goal" style={es.input} autoFocus />
          </div>
          <div style={es.modeToggle}>
            <button onClick={() => setGoalMode("formalize")} style={goalMode === "formalize" ? es.modeActive : es.modeInactive}>
              Formalize
            </button>
            <button onClick={() => setGoalMode("build")} style={goalMode === "build" ? es.modeActive : es.modeInactive}>
              Build
            </button>
          </div>
          {goalMode === "formalize" ? (
            <div>
              <label style={es.label}>Statement (natural language)</label>
              <input type="text" value={goalText} onChange={(e) => setGoalText(e.target.value)}
                placeholder="e.g. the limit exists" style={es.input} />
            </div>
          ) : (
            <div>
              <label style={es.label}>Build Statement</label>
              <StatementBuilder value={goalStatement} onChange={setGoalStatement} />
            </div>
          )}
          {goalError && <div style={es.error}>{goalError}</div>}
          <div style={es.panelBtns}>
            <button onClick={handleSaveGoal}
              disabled={!goalLabel.trim() || goalLoading || (goalMode === "formalize" && !goalText.trim())}
              style={es.primaryBtn}>
              {goalLoading ? "Formalizing…" : editingIndex !== null ? "Save" : "Add Goal"}
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
    fontFamily: "inherit",
    fontSize: "13px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  title: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1e293b",
    letterSpacing: "0.01em",
  },
  statsSummary: {
    fontSize: "11px",
    color: "#94a3b8",
    fontVariantNumeric: "tabular-nums",
  },
  ctxSelect: {
    padding: "3px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: "5px",
    fontSize: "12px",
    backgroundColor: "white",
    color: "#374151",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
    marginBottom: "10px",
  },
  toolbarGroup: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
  },
  toolBtn: {
    padding: "5px 11px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
  },
  toolBtnActive: {
    padding: "5px 11px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #93c5fd",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  jsonBtn: {
    padding: "5px 11px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "monospace",
    flexShrink: 0,
  },
  jsonBtnActive: {
    padding: "5px 11px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "1px solid #94a3b8",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "monospace",
    flexShrink: 0,
  },
  itemsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
    marginBottom: "10px",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  itemRowActive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    backgroundColor: "#eff6ff",
    borderRadius: "6px",
    border: "1px solid #93c5fd",
  },
  itemText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    color: "#1e293b",
    minWidth: 0,
  },
  itemDesc: {
    color: "#64748b",
    fontWeight: 400,
  },
  itemSep: {
    color: "#cbd5e1",
    margin: "0 1px",
  },
  itemPreview: {
    color: "#64748b",
    fontWeight: 400,
    fontStyle: "italic",
  },
  itemActions: {
    display: "flex",
    gap: "3px",
    flexShrink: 0,
  },
  editBtn: {
    padding: "2px 6px",
    backgroundColor: "transparent",
    color: "#3b82f6",
    border: "1px solid #bfdbfe",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
    lineHeight: 1,
  },
  deleteBtn: {
    padding: "2px 6px",
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1,
  },
  panel: {
    marginTop: "2px",
    padding: "14px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  panelTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "4px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: "4px",
    marginTop: "10px",
  },
  input: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    boxSizing: "border-box" as const,
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    boxSizing: "border-box" as const,
  },
  jsonArea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
    lineHeight: "1.45",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
  },
  error: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "8px 12px",
    marginTop: "8px",
    fontSize: "12px",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
  panelBtns: {
    display: "flex",
    gap: "6px",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },
  primaryBtn: {
    padding: "6px 16px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "6px 14px",
    backgroundColor: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "6px 14px",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    marginLeft: "auto",
  },
  modeToggle: {
    display: "flex",
    gap: "4px",
    marginTop: "10px",
    padding: "3px",
    backgroundColor: "#f1f5f9",
    borderRadius: "7px",
    width: "fit-content",
  },
  modeActive: {
    padding: "5px 14px",
    backgroundColor: "white",
    color: "#1d4ed8",
    border: "none",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  modeInactive: {
    padding: "5px 14px",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
  },
}
