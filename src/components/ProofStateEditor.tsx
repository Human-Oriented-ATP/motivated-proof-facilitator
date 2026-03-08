import React, { useState, useEffect, useRef, JSX } from "react"
import { ProofState, ProofStateSchema, ContextVariable, Statement, StatementSchema } from "../core/ProofStateZod"
import { StatementBuilder } from "./StatementBuilder"

export interface ProofStateEditorProps {
  proofState: ProofState
  onUpdate: (newState: ProofState) => void
}

type EditTarget = { section: "variable" | "hypothesis" | "goal"; idx: number } | null
type AddTarget = "variable" | "hypothesis" | "goal" | null

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

/**
 * Editor for incrementally building or modifying a ProofState.
 * Displays the proof state structure inline with colored section cards
 * matching the proof state viewer. Click any item to edit it in place.
 */
export function ProofStateEditor({ proofState, onUpdate }: ProofStateEditorProps): JSX.Element {
  const [selectedContext, setSelectedContext] = useState(0)
  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [addTarget, setAddTarget] = useState<AddTarget>(null)
  const [showJson, setShowJson] = useState(false)

  // Variable form state
  const [varName, setVarName] = useState("")
  const [varKind, setVarKind] = useState<"free" | "meta" | "let">("free")
  const [varDescription, setVarDescription] = useState("")
  const [varLetValue, setVarLetValue] = useState("")

  // Hypothesis form state
  const [hypLabel, setHypLabel] = useState("")
  const [hypMode, setHypMode] = useState<"formalize" | "build">("build")
  const [hypText, setHypText] = useState("")
  const [hypStatement, setHypStatement] = useState<Statement>("")
  const [hypLoading, setHypLoading] = useState(false)
  const [hypError, setHypError] = useState<string | null>(null)

  // Goal form state
  const [goalLabel, setGoalLabel] = useState("")
  const [goalMode, setGoalMode] = useState<"formalize" | "build">("build")
  const [goalText, setGoalText] = useState("")
  const [goalStatement, setGoalStatement] = useState<Statement>("")
  const [goalLoading, setGoalLoading] = useState(false)
  const [goalError, setGoalError] = useState<string | null>(null)

  // JSON state
  const [rawJson, setRawJson] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Fix stale state bug: when the proofState prop changes (due to an external update),
  // close any open edit/add forms so they don't show stale values.
  const prevProofStateRef = useRef(proofState)
  useEffect(() => {
    if (prevProofStateRef.current !== proofState) {
      prevProofStateRef.current = proofState
      setEditTarget(null)
      setAddTarget(null)
    }
  }, [proofState])

  // Populate form fields whenever editTarget changes
  useEffect(() => {
    if (!editTarget) return
    const cidx = Math.min(selectedContext, Math.max(0, proofState.length - 1))
    const ctx = proofState[cidx] || { variables: [], hypotheses: [], goals: [] }
    if (editTarget.section === "variable") {
      const v = ctx.variables[editTarget.idx]
      if (!v) return
      setVarName(v.name)
      setVarKind(v.kind)
      setVarDescription(v.description)
      setVarLetValue(v.kind === "let" ? v.value : "")
    } else if (editTarget.section === "hypothesis") {
      const h = ctx.hypotheses[editTarget.idx]
      if (!h) return
      setHypLabel(h.label)
      setHypMode("build")
      setHypStatement(h.statement)
      setHypText("")
      setHypError(null)
    } else {
      const g = ctx.goals[editTarget.idx]
      if (!g) return
      setGoalLabel(g.label)
      setGoalMode("build")
      setGoalStatement(g.statement)
      setGoalText("")
      setGoalError(null)
    }
  }, [editTarget])

  const ctxIdx = Math.min(selectedContext, Math.max(0, proofState.length - 1))
  const ctx = proofState[ctxIdx] || { variables: [], hypotheses: [], goals: [] }

  const ensureContext = (): ProofState => {
    if (proofState.length === 0) return [{ variables: [], hypotheses: [], goals: [] }]
    return proofState.map(c => ({ ...c }))
  }

  const closeAll = () => { setEditTarget(null); setAddTarget(null) }

  const startEdit = (section: "variable" | "hypothesis" | "goal", idx: number) => {
    setAddTarget(null)
    // Toggle off if already editing this item
    if (editTarget?.section === section && editTarget.idx === idx) {
      setEditTarget(null)
    } else {
      setEditTarget({ section, idx })
    }
  }

  const startAdd = (section: "variable" | "hypothesis" | "goal") => {
    setEditTarget(null)
    if (addTarget === section) { setAddTarget(null); return }
    setAddTarget(section)
    if (section === "variable") {
      setVarName(""); setVarKind("free"); setVarDescription(""); setVarLetValue("")
    } else if (section === "hypothesis") {
      setHypLabel(""); setHypMode("build"); setHypText(""); setHypStatement(""); setHypError(null)
    } else {
      setGoalLabel(""); setGoalMode("build"); setGoalText(""); setGoalStatement(""); setGoalError(null)
    }
  }

  // ── Save / Delete handlers ──────────────────────────────────────────────

  const handleSaveVariable = () => {
    if (!varName.trim()) return
    const state = ensureContext()
    const newVar: ContextVariable = varKind === "let"
      ? { kind: "let", name: varName, description: varDescription, value: varLetValue }
      : { kind: varKind, name: varName, description: varDescription }
    if (editTarget?.section === "variable") {
      const vars = [...state[ctxIdx].variables]
      vars[editTarget.idx] = newVar
      state[ctxIdx] = { ...state[ctxIdx], variables: vars }
    } else {
      state[ctxIdx] = { ...state[ctxIdx], variables: [...state[ctxIdx].variables, newVar] }
    }
    onUpdate(state)
    closeAll()
  }

  const handleDeleteVariable = (idx: number) => {
    const state = ensureContext()
    state[ctxIdx] = { ...state[ctxIdx], variables: state[ctxIdx].variables.filter((_, i) => i !== idx) }
    onUpdate(state)
    if (editTarget?.section === "variable" && editTarget.idx === idx) setEditTarget(null)
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
      try { statement = await formalizeStatement(hypText) }
      catch (err) { setHypError(err instanceof Error ? err.message : "Failed to formalize"); setHypLoading(false); return }
      setHypLoading(false)
    } else {
      statement = hypStatement
    }
    const state = ensureContext()
    const newHyp = { label: hypLabel, statement }
    if (editTarget?.section === "hypothesis") {
      const hyps = [...state[ctxIdx].hypotheses]
      hyps[editTarget.idx] = newHyp
      state[ctxIdx] = { ...state[ctxIdx], hypotheses: hyps }
    } else {
      state[ctxIdx] = { ...state[ctxIdx], hypotheses: [...state[ctxIdx].hypotheses, newHyp] }
    }
    onUpdate(state)
    closeAll()
  }

  const handleDeleteHypothesis = (idx: number) => {
    const state = ensureContext()
    state[ctxIdx] = { ...state[ctxIdx], hypotheses: state[ctxIdx].hypotheses.filter((_, i) => i !== idx) }
    onUpdate(state)
    if (editTarget?.section === "hypothesis" && editTarget.idx === idx) setEditTarget(null)
  }

  const handleSaveGoal = async () => {
    if (!goalLabel.trim()) return
    setGoalError(null)
    let statement: Statement
    if (goalMode === "formalize") {
      if (!goalText.trim()) return
      setGoalLoading(true)
      try { statement = await formalizeStatement(goalText) }
      catch (err) { setGoalError(err instanceof Error ? err.message : "Failed to formalize"); setGoalLoading(false); return }
      setGoalLoading(false)
    } else {
      statement = goalStatement
    }
    const state = ensureContext()
    const newGoal = { label: goalLabel, statement }
    if (editTarget?.section === "goal") {
      const goals = [...state[ctxIdx].goals]
      goals[editTarget.idx] = newGoal
      state[ctxIdx] = { ...state[ctxIdx], goals: goals }
    } else {
      state[ctxIdx] = { ...state[ctxIdx], goals: [...state[ctxIdx].goals, newGoal] }
    }
    onUpdate(state)
    closeAll()
  }

  const handleDeleteGoal = (idx: number) => {
    const state = ensureContext()
    state[ctxIdx] = { ...state[ctxIdx], goals: state[ctxIdx].goals.filter((_, i) => i !== idx) }
    onUpdate(state)
    if (editTarget?.section === "goal" && editTarget.idx === idx) setEditTarget(null)
  }

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(rawJson)
      const validated = ProofStateSchema.parse(parsed)
      try { onUpdate(validated) }
      catch (err) { setJsonError(err instanceof Error ? err.message : "Update failed"); return }
      setJsonError(null)
      setShowJson(false)
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message
        setJsonError(msg.length > 500 ? msg.slice(0, 500) + "…" : msg)
      } else {
        setJsonError("Invalid JSON")
      }
    }
  }

  const handleAddContext = () => {
    onUpdate([...proofState, { variables: [], hypotheses: [], goals: [] }])
    setSelectedContext(proofState.length)
  }

  // ── Inline form renderers ───────────────────────────────────────────────

  const renderVariableForm = (isEdit: boolean) => (
    <div style={es.inlineForm}>
      <div style={es.formTitle}>{isEdit ? "Edit Variable" : "New Variable"}</div>
      <div style={es.row}>
        <div style={{ flex: 1 }}>
          <label style={es.label}>Name</label>
          <input type="text" value={varName} onChange={e => setVarName(e.target.value)}
            placeholder="e.g. $x$" style={es.input} autoFocus />
        </div>
        <div style={{ width: "120px" }}>
          <label style={es.label}>Kind</label>
          <select value={varKind} onChange={e => setVarKind(e.target.value as "free" | "meta" | "let")} style={es.select}>
            <option value="free">Free</option>
            <option value="meta">Meta</option>
            <option value="let">Let</option>
          </select>
        </div>
      </div>
      <div>
        <label style={es.label}>Type / Description</label>
        <input type="text" value={varDescription} onChange={e => setVarDescription(e.target.value)}
          placeholder="e.g. $NN$ or Group" style={es.input} />
      </div>
      {varKind === "let" && (
        <div>
          <label style={es.label}>Value</label>
          <input type="text" value={varLetValue} onChange={e => setVarLetValue(e.target.value)}
            placeholder="e.g. $f(x)$" style={es.input} />
        </div>
      )}
      <div style={es.formBtns}>
        <button onClick={handleSaveVariable} disabled={!varName.trim()} style={es.primaryBtn}>
          {isEdit ? "Save" : "Add Variable"}
        </button>
        {isEdit && editTarget && (
          <button onClick={() => handleDeleteVariable(editTarget.idx)} style={es.dangerBtn}>Delete</button>
        )}
        <button onClick={closeAll} style={es.cancelBtn}>Cancel</button>
      </div>
    </div>
  )

  const renderHypForm = (isEdit: boolean) => (
    <div style={es.inlineForm}>
      <div style={es.formTitle}>{isEdit ? "Edit Hypothesis" : "New Hypothesis"}</div>
      <div>
        <label style={es.label}>Label</label>
        <input type="text" value={hypLabel} onChange={e => setHypLabel(e.target.value)}
          placeholder="e.g. hyp_continuity" style={es.input} autoFocus />
      </div>
      <div style={es.modeToggle}>
        <button onClick={() => setHypMode("build")} style={hypMode === "build" ? es.modeActive : es.modeInactive}>Build interactively</button>
        <button onClick={() => setHypMode("formalize")} style={hypMode === "formalize" ? es.modeActive : es.modeInactive}>Autoformalize</button>
      </div>
      {hypMode === "formalize" ? (
        <div>
          <label style={es.label}>Statement (natural language)</label>
          <input type="text" value={hypText} onChange={e => setHypText(e.target.value)}
            placeholder="e.g. f is continuous on [a,b]" style={es.input} />
        </div>
      ) : (
        <div>
          <label style={es.label}>Build Statement</label>
          <StatementBuilder value={hypStatement} onChange={setHypStatement} />
        </div>
      )}
      {hypError && <div style={es.error}>{hypError}</div>}
      <div style={es.formBtns}>
        <button onClick={handleSaveHypothesis}
          disabled={!hypLabel.trim() || hypLoading || (hypMode === "formalize" && !hypText.trim())}
          style={es.primaryBtn}>
          {hypLoading ? "Formalizing…" : isEdit ? "Save" : "Add Hypothesis"}
        </button>
        {isEdit && editTarget && (
          <button onClick={() => handleDeleteHypothesis(editTarget.idx)} style={es.dangerBtn}>Delete</button>
        )}
        <button onClick={closeAll} style={es.cancelBtn}>Cancel</button>
      </div>
    </div>
  )

  const renderGoalForm = (isEdit: boolean) => (
    <div style={es.inlineForm}>
      <div style={es.formTitle}>{isEdit ? "Edit Goal" : "New Goal"}</div>
      <div>
        <label style={es.label}>Label</label>
        <input type="text" value={goalLabel} onChange={e => setGoalLabel(e.target.value)}
          placeholder="e.g. main_goal" style={es.input} autoFocus />
      </div>
      <div style={es.modeToggle}>
        <button onClick={() => setGoalMode("build")} style={goalMode === "build" ? es.modeActive : es.modeInactive}>Build interactively</button>
        <button onClick={() => setGoalMode("formalize")} style={goalMode === "formalize" ? es.modeActive : es.modeInactive}>Autoformalize</button>
      </div>
      {goalMode === "formalize" ? (
        <div>
          <label style={es.label}>Statement (natural language)</label>
          <input type="text" value={goalText} onChange={e => setGoalText(e.target.value)}
            placeholder="e.g. the limit exists" style={es.input} />
        </div>
      ) : (
        <div>
          <label style={es.label}>Build Statement</label>
          <StatementBuilder value={goalStatement} onChange={setGoalStatement} />
        </div>
      )}
      {goalError && <div style={es.error}>{goalError}</div>}
      <div style={es.formBtns}>
        <button onClick={handleSaveGoal}
          disabled={!goalLabel.trim() || goalLoading || (goalMode === "formalize" && !goalText.trim())}
          style={es.primaryBtn}>
          {goalLoading ? "Formalizing…" : isEdit ? "Save" : "Add Goal"}
        </button>
        {isEdit && editTarget && (
          <button onClick={() => handleDeleteGoal(editTarget.idx)} style={es.dangerBtn}>Delete</button>
        )}
        <button onClick={closeAll} style={es.cancelBtn}>Cancel</button>
      </div>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={es.container}>

      {/* Header */}
      <div style={es.header}>
        <div style={es.headerLeft}>
          <span style={es.title}>Edit Proof State</span>
          {proofState.length > 1 && (
            <select value={selectedContext} onChange={e => setSelectedContext(Number(e.target.value))} style={es.ctxSelect}>
              {proofState.map((_, i) => <option key={i} value={i}>Context {i + 1}</option>)}
            </select>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={handleAddContext} style={es.toolBtn}>+ Context</button>
          <button
            onClick={() => { if (!showJson) setRawJson(JSON.stringify(proofState, null, 2)); setShowJson(v => !v); setJsonError(null) }}
            style={showJson ? es.jsonBtnActive : es.jsonBtn}
          >{"{ }"} JSON</button>
        </div>
      </div>

      {/* JSON Panel */}
      {showJson && (
        <div style={{ ...es.inlineForm, marginBottom: "20px", borderColor: "#94a3b8" }}>
          <div style={es.formTitle}>Raw JSON</div>
          <textarea value={rawJson} onChange={e => setRawJson(e.target.value)}
            style={es.jsonArea} rows={14} spellCheck={false} />
          {jsonError && <div style={es.error}>{jsonError}</div>}
          <div style={es.formBtns}>
            <button onClick={handleApplyJson} style={es.primaryBtn}>Apply</button>
            <button onClick={() => setShowJson(false)} style={es.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Proof state sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── Variables ── */}
        <div style={es.varCard}>
          <div style={{ ...es.floatingLabel, backgroundColor: "#fef2f2", color: "#b91c1c" }}>VARIABLES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {ctx.variables.length === 0 && addTarget !== "variable" && (
              <div style={es.emptyHint}>No variables — click below to add one.</div>
            )}
            {ctx.variables.map((v, i) => {
              const isEditing = editTarget?.section === "variable" && editTarget.idx === i
              return (
                <React.Fragment key={i}>
                  <div style={isEditing ? es.varItemActive : es.varItem}>
                    {v.kind === "meta" && <span style={{ color: "#9333ea", fontWeight: "bold", fontSize: "13px", minWidth: "14px" }}>?</span>}
                    {v.kind === "let"  && <span style={{ color: "#0891b2", fontWeight: "bold", fontSize: "13px", minWidth: "14px" }}>≔</span>}
                    {v.kind === "free" && <span style={{ minWidth: "14px" }} />}
                    <span style={es.varText}>
                      <strong style={{ color: "#1e293b" }}>{v.name}</strong>
                      <span style={{ color: "#94a3b8", margin: "0 4px" }}>:</span>
                      <span style={{ color: "#64748b" }}>{v.description || <em>no type</em>}</span>
                      {v.kind === "let" && <><span style={{ color: "#94a3b8", margin: "0 4px" }}>≔</span><span style={{ color: "#64748b" }}>{v.value}</span></>}
                    </span>
                    <div style={es.itemActions}>
                      <button onClick={() => startEdit("variable", i)} style={isEditing ? es.editBtnActive : es.editBtn} title="Edit">✎</button>
                      <button onClick={() => handleDeleteVariable(i)} style={es.deleteBtn} title="Delete">×</button>
                    </div>
                  </div>
                  {isEditing && renderVariableForm(true)}
                </React.Fragment>
              )
            })}
            {addTarget === "variable" && renderVariableForm(false)}
          </div>
          <button onClick={() => startAdd("variable")}
            style={addTarget === "variable" ? es.addBtnActive : es.addBtn}>
            {addTarget === "variable" ? "− Variable" : "+ Variable"}
          </button>
        </div>

        {/* ── Hypotheses ── */}
        <div style={es.hypCard}>
          <div style={{ ...es.floatingLabel, backgroundColor: "#fff7ed", color: "#c2410c" }}>HYPOTHESES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ctx.hypotheses.length === 0 && addTarget !== "hypothesis" && (
              <div style={es.emptyHint}>No hypotheses — click below to add one.</div>
            )}
            {ctx.hypotheses.map((h, i) => {
              const isEditing = editTarget?.section === "hypothesis" && editTarget.idx === i
              return (
                <React.Fragment key={i}>
                  <div style={isEditing ? es.hypItemActive : es.hypItem}>
                    <span style={{ color: "#c2410c", fontSize: "16px", fontWeight: "bold", flexShrink: 0, userSelect: "none" }}>•</span>
                    <span style={{ flex: 1, color: "#64748b", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                      {truncate(statementPreview(h.statement), 65)}
                    </span>
                    <span style={es.hypPill}>{h.label}</span>
                    <div style={es.itemActions}>
                      <button onClick={() => startEdit("hypothesis", i)} style={isEditing ? es.editBtnActive : es.editBtn} title="Edit">✎</button>
                      <button onClick={() => handleDeleteHypothesis(i)} style={es.deleteBtn} title="Delete">×</button>
                    </div>
                  </div>
                  {isEditing && renderHypForm(true)}
                </React.Fragment>
              )
            })}
            {addTarget === "hypothesis" && renderHypForm(false)}
          </div>
          <button onClick={() => startAdd("hypothesis")}
            style={addTarget === "hypothesis" ? es.addBtnActive : es.addBtn}>
            {addTarget === "hypothesis" ? "− Hypothesis" : "+ Hypothesis"}
          </button>
        </div>

        {/* ── Goals ── */}
        <div style={es.goalCard}>
          <div style={{ ...es.floatingLabel, backgroundColor: "#eff6ff", color: "#1d4ed8" }}>GOALS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ctx.goals.length === 0 && addTarget !== "goal" && (
              <div style={es.emptyHint}>No goals — click below to add one.</div>
            )}
            {ctx.goals.map((g, i) => {
              const isEditing = editTarget?.section === "goal" && editTarget.idx === i
              return (
                <React.Fragment key={i}>
                  <div style={isEditing ? es.goalItemActive : es.goalItem}>
                    <span style={{ color: "#1d4ed8", fontSize: "15px", fontWeight: "bold", flexShrink: 0, userSelect: "none" }}>⊢</span>
                    <span style={{ flex: 1, color: "#64748b", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                      {truncate(statementPreview(g.statement), 65)}
                    </span>
                    <span style={es.goalPill}>{g.label}</span>
                    <div style={es.itemActions}>
                      <button onClick={() => startEdit("goal", i)} style={isEditing ? es.editBtnActive : es.editBtn} title="Edit">✎</button>
                      <button onClick={() => handleDeleteGoal(i)} style={es.deleteBtn} title="Delete">×</button>
                    </div>
                  </div>
                  {isEditing && renderGoalForm(true)}
                </React.Fragment>
              )
            })}
            {addTarget === "goal" && renderGoalForm(false)}
          </div>
          <button onClick={() => startAdd("goal")}
            style={addTarget === "goal" ? es.addBtnActive : es.addBtn}>
            {addTarget === "goal" ? "− Goal" : "+ Goal"}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const es: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "inherit",
    fontSize: "13px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
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
  ctxSelect: {
    padding: "3px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: "5px",
    fontSize: "12px",
    backgroundColor: "white",
    color: "#374151",
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
  },

  // ── Section cards ──
  varCard: {
    backgroundColor: "#fef2f2",
    border: "2px solid #fecaca",
    borderRadius: "12px",
    padding: "20px",
    paddingTop: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    position: "relative",
  },
  hypCard: {
    backgroundColor: "#fff7ed",
    border: "2px solid #fed7aa",
    borderRadius: "12px",
    padding: "20px",
    paddingTop: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    position: "relative",
  },
  goalCard: {
    backgroundColor: "#eff6ff",
    border: "2px solid #bfdbfe",
    borderRadius: "12px",
    padding: "20px",
    paddingTop: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    top: "-12px",
    left: "20px",
    padding: "0 8px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  emptyHint: {
    color: "#94a3b8",
    fontSize: "12px",
    fontStyle: "italic",
    padding: "4px 0 8px 0",
  },

  // ── Variable items ──
  varItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    cursor: "default",
  },
  varItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: "8px",
    border: "1px solid #f87171",
    boxShadow: "0 0 0 2px rgba(248,113,113,0.2)",
  },
  varText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    minWidth: 0,
  },

  // ── Hypothesis items ──
  hypItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "7px 10px",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: "8px",
    border: "1px solid #fed7aa",
  },
  hypItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "7px 10px",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: "8px",
    border: "1px solid #fb923c",
    boxShadow: "0 0 0 2px rgba(251,146,60,0.2)",
  },
  hypPill: {
    backgroundColor: "#fff7ed",
    border: "1px solid #fb923c",
    color: "#ea580c",
    fontSize: "11px",
    fontWeight: 500,
    padding: "3px 8px",
    borderRadius: "6px",
    whiteSpace: "nowrap" as const,
    userSelect: "none" as const,
    flexShrink: 0,
  },

  // ── Goal items ──
  goalItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "7px 10px",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: "8px",
    border: "1px solid #bfdbfe",
  },
  goalItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "7px 10px",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: "8px",
    border: "1px solid #60a5fa",
    boxShadow: "0 0 0 2px rgba(96,165,250,0.2)",
  },
  goalPill: {
    backgroundColor: "#eff6ff",
    border: "1px solid #60a5fa",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: 500,
    padding: "3px 8px",
    borderRadius: "6px",
    whiteSpace: "nowrap" as const,
    userSelect: "none" as const,
    flexShrink: 0,
  },

  // ── Item controls ──
  itemActions: {
    display: "flex",
    gap: "3px",
    flexShrink: 0,
  },
  editBtn: {
    padding: "2px 6px",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
    lineHeight: 1,
  },
  editBtnActive: {
    padding: "2px 6px",
    backgroundColor: "#dbeafe",
    color: "#2563eb",
    border: "1px solid #93c5fd",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
    lineHeight: 1,
  },
  deleteBtn: {
    padding: "2px 6px",
    backgroundColor: "transparent",
    color: "#fca5a5",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1,
  },

  // ── Add button ──
  addBtn: {
    marginTop: "12px",
    padding: "5px 12px",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px dashed #cbd5e1",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
  },
  addBtnActive: {
    marginTop: "12px",
    padding: "5px 12px",
    backgroundColor: "rgba(255,255,255,0.5)",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
  },

  // ── Inline accordion form ──
  inlineForm: {
    marginTop: "4px",
    padding: "14px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  },
  formTitle: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#475569",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: "10px",
  },
  row: {
    display: "flex",
    gap: "10px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
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
  formBtns: {
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
