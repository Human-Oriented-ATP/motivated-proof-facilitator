import React, { JSX } from "react"
import { Statement } from "../src/core/ProofStateZod"

type StatementKind = "atomic" | "conjunction" | "disjunction" | "negation"
  | "implication" | "equivalence" | "universal" | "existential" | "highlight"

const STATEMENT_KINDS: { value: StatementKind; label: string }[] = [
  { value: "atomic", label: "Atomic (text)" },
  { value: "conjunction", label: "∧ Conjunction" },
  { value: "disjunction", label: "∨ Disjunction" },
  { value: "negation", label: "¬ Negation" },
  { value: "implication", label: "→ Implication" },
  { value: "equivalence", label: "↔ Equivalence" },
  { value: "universal", label: "∀ Universal" },
  { value: "existential", label: "∃ Existential" },
  { value: "highlight", label: "★ Highlight" },
]

function getStatementKind(s: Statement): StatementKind {
  if (typeof s === "string") return "atomic"
  return s.kind as StatementKind
}

function makeDefaultStatement(kind: StatementKind): Statement {
  switch (kind) {
    case "atomic": return ""
    case "conjunction": return { kind: "conjunction", statements: ["", ""] }
    case "disjunction": return { kind: "disjunction", statements: ["", ""] }
    case "negation": return { kind: "negation", statement: "" }
    case "implication": return { kind: "implication", antecedent: "", consequent: "" }
    case "equivalence": return { kind: "equivalence", left: "", right: "" }
    case "universal": return { kind: "universal", variable: { name: "", description: "" }, statement: "" }
    case "existential": return { kind: "existential", variable: { name: "", description: "" }, statement: "" }
    case "highlight": return { kind: "highlight", statement: "" }
  }
}

interface StatementBuilderProps {
  value: Statement
  onChange: (s: Statement) => void
  depth?: number
}

/**
 * A recursive, interactive statement builder using dropdowns to select
 * logical connectives and build up complex Statement objects.
 */
export function StatementBuilder({ value, onChange, depth = 0 }: StatementBuilderProps): JSX.Element {
  const kind = getStatementKind(value)

  const handleKindChange = (newKind: StatementKind) => {
    onChange(makeDefaultStatement(newKind))
  }

  const borderStyle: React.CSSProperties = depth > 0
    ? { marginLeft: "12px", borderLeft: "2px solid #e2e8f0", paddingLeft: "12px" }
    : {}

  return (
    <div style={{ ...borderStyle, marginTop: depth > 0 ? "6px" : "0" }}>
      {/* Kind selector */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
        <select
          value={kind}
          onChange={(e) => handleKindChange(e.target.value as StatementKind)}
          style={sbStyles.select}
        >
          {STATEMENT_KINDS.map(k => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>

      {/* Atomic */}
      {kind === "atomic" && typeof value === "string" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter statement (use $...$ for Typst math)..."
          style={sbStyles.input}
        />
      )}

      {/* Conjunction / Disjunction */}
      {typeof value !== "string" && (value.kind === "conjunction" || value.kind === "disjunction") && (
        <div>
          {value.statements.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "start", gap: "4px" }}>
              <div style={{ flex: 1 }}>
                <StatementBuilder
                  value={s}
                  onChange={(newS) => {
                    const newStatements = [...value.statements]
                    newStatements[i] = newS
                    onChange({ kind: value.kind, statements: newStatements } as Statement)
                  }}
                  depth={depth + 1}
                />
              </div>
              {value.statements.length > 2 && (
                <button
                  onClick={() => {
                    const newStatements = value.statements.filter((_, j) => j !== i)
                    onChange({ kind: value.kind, statements: newStatements } as Statement)
                  }}
                  style={sbStyles.removeBtn}
                  title="Remove"
                >✕</button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange({ kind: value.kind, statements: [...value.statements, ""] } as Statement)}
            style={sbStyles.addBtn}
          >
            + Add {value.kind === "conjunction" ? "conjunct" : "disjunct"}
          </button>
        </div>
      )}

      {/* Negation */}
      {typeof value !== "string" && value.kind === "negation" && (
        <StatementBuilder
          value={value.statement}
          onChange={(s) => onChange({ kind: "negation", statement: s })}
          depth={depth + 1}
        />
      )}

      {/* Implication */}
      {typeof value !== "string" && value.kind === "implication" && (
        <div>
          <div style={sbStyles.sublabel}>Antecedent:</div>
          <StatementBuilder
            value={value.antecedent}
            onChange={(s) => onChange({ kind: "implication", antecedent: s, consequent: value.consequent })}
            depth={depth + 1}
          />
          <div style={sbStyles.sublabel}>Consequent:</div>
          <StatementBuilder
            value={value.consequent}
            onChange={(s) => onChange({ kind: "implication", antecedent: value.antecedent, consequent: s })}
            depth={depth + 1}
          />
        </div>
      )}

      {/* Equivalence */}
      {typeof value !== "string" && value.kind === "equivalence" && (
        <div>
          <div style={sbStyles.sublabel}>Left:</div>
          <StatementBuilder
            value={value.left}
            onChange={(s) => onChange({ kind: "equivalence", left: s, right: value.right })}
            depth={depth + 1}
          />
          <div style={sbStyles.sublabel}>Right:</div>
          <StatementBuilder
            value={value.right}
            onChange={(s) => onChange({ kind: "equivalence", left: value.left, right: s })}
            depth={depth + 1}
          />
        </div>
      )}

      {/* Universal / Existential */}
      {typeof value !== "string" && (value.kind === "universal" || value.kind === "existential") && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
            <div style={{ flex: 1 }}>
              <div style={sbStyles.sublabel}>Variable name:</div>
              <input
                type="text"
                value={value.variable.name}
                onChange={(e) => onChange({
                  kind: value.kind, variable: { ...value.variable, name: e.target.value }, statement: value.statement
                } as Statement)}
                placeholder="e.g. $x$"
                style={sbStyles.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={sbStyles.sublabel}>Type / description:</div>
              <input
                type="text"
                value={value.variable.description}
                onChange={(e) => onChange({
                  kind: value.kind, variable: { ...value.variable, description: e.target.value }, statement: value.statement
                } as Statement)}
                placeholder="e.g. $NN$"
                style={sbStyles.input}
              />
            </div>
          </div>
          <div style={sbStyles.sublabel}>Statement:</div>
          <StatementBuilder
            value={value.statement}
            onChange={(s) => onChange({
              kind: value.kind, variable: value.variable, statement: s
            } as Statement)}
            depth={depth + 1}
          />
        </div>
      )}

      {/* Highlight */}
      {typeof value !== "string" && value.kind === "highlight" && (
        <div>
          <div style={sbStyles.sublabel}>Highlighted statement:</div>
          <StatementBuilder
            value={value.statement}
            onChange={(s) => onChange({ kind: "highlight", statement: s })}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  )
}

const sbStyles: Record<string, React.CSSProperties> = {
  select: {
    padding: "5px 8px",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "13px",
    backgroundColor: "white",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #cbd5e0",
    borderRadius: "5px",
    fontSize: "13px",
    boxSizing: "border-box" as const,
  },
  sublabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#718096",
    marginBottom: "3px",
    marginTop: "6px",
  },
  removeBtn: {
    padding: "2px 6px",
    backgroundColor: "transparent",
    color: "#e53e3e",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "8px",
    flexShrink: 0,
  },
  addBtn: {
    padding: "4px 10px",
    backgroundColor: "transparent",
    color: "#3182ce",
    border: "1px dashed #3182ce",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
    marginTop: "6px",
  },
}
