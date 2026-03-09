import React, { JSX } from "react"
import { Statement } from "../core/ProofStateZod"
import {
  Box,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Typography,
  FormControl,
  SelectChangeEvent,
} from "@mui/material"

type StatementKind = "atomic" | "conjunction" | "disjunction" | "negation"
  | "implication" | "equivalence" | "universal" | "existential" | "highlight"

const STATEMENT_KINDS: { value: StatementKind; label: string }[] = [
  { value: "atomic",      label: "Atomic (text)" },
  { value: "conjunction", label: "∧  Conjunction" },
  { value: "disjunction", label: "∨  Disjunction" },
  { value: "negation",    label: "¬  Negation" },
  { value: "implication", label: "→  Implication" },
  { value: "equivalence", label: "↔  Equivalence" },
  { value: "universal",   label: "∀  Universal" },
  { value: "existential", label: "∃  Existential" },
  { value: "highlight",   label: "★  Highlight" },
]

function getStatementKind(s: Statement): StatementKind {
  if (typeof s === "string") return "atomic"
  return s.kind as StatementKind
}

function makeDefaultStatement(kind: StatementKind): Statement {
  switch (kind) {
    case "atomic":      return ""
    case "conjunction": return { kind: "conjunction", statements: ["", ""] }
    case "disjunction": return { kind: "disjunction", statements: ["", ""] }
    case "negation":    return { kind: "negation", statement: "" }
    case "implication": return { kind: "implication", antecedent: "", consequent: "" }
    case "equivalence": return { kind: "equivalence", left: "", right: "" }
    case "universal":   return { kind: "universal", variable: { name: "", description: "" }, statement: "" }
    case "existential": return { kind: "existential", variable: { name: "", description: "" }, statement: "" }
    case "highlight":   return { kind: "highlight", statement: "" }
  }
}

// Inline SVG close icon (no @mui/icons-material dependency)
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Sublabel for nested fields
function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5, mt: 1 }}>
      {children}
    </Typography>
  )
}

// Shared compact styles applied to all inputs in the builder
const INPUT_SX = {
  '& .MuiInputBase-input': { fontSize: '0.6875rem', py: '3px', px: '8px' },
  '& .MuiOutlinedInput-root': { fontSize: '0.6875rem' },
} as const

const SELECT_SX = {
  fontSize: '0.6875rem',
  '& .MuiSelect-select': { fontSize: '0.6875rem', py: '3px' },
} as const

interface StatementBuilderProps {
  value: Statement
  onChange: (s: Statement) => void
  depth?: number
}

/**
 * A recursive, interactive statement builder using MUI components.
 */
export function StatementBuilder({ value, onChange, depth = 0 }: StatementBuilderProps): JSX.Element {
  const kind = getStatementKind(value)

  const handleKindChange = (e: SelectChangeEvent) => {
    onChange(makeDefaultStatement(e.target.value as StatementKind))
  }

  return (
    <Box
      sx={depth > 0 ? {
        ml: 1.5,
        pl: 1.5,
        borderLeft: '2px solid',
        borderColor: 'divider',
        mt: 0.75,
      } : {}}
    >
      {/* Kind selector */}
      <FormControl size="small" sx={{ minWidth: 148, mb: 0.5 }}>
        <Select value={kind} onChange={handleKindChange} sx={SELECT_SX}>
          {STATEMENT_KINDS.map(k => (
            <MenuItem key={k.value} value={k.value} sx={{ fontSize: '0.6875rem' }}>
              {k.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Atomic */}
      {kind === "atomic" && typeof value === "string" && (
        <TextField
          size="small" fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter statement (use $…$ for Typst math)"
          sx={INPUT_SX}
        />
      )}

      {/* Conjunction / Disjunction */}
      {typeof value !== "string" && (value.kind === "conjunction" || value.kind === "disjunction") && (
        <Box>
          {value.statements.map((s, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ flex: 1 }}>
                <StatementBuilder
                  value={s}
                  onChange={(newS) => {
                    const next = [...value.statements]
                    next[i] = newS
                    onChange({ kind: value.kind, statements: next } as Statement)
                  }}
                  depth={depth + 1}
                />
              </Box>
              {value.statements.length > 2 && (
                <IconButton
                  size="small"
                  onClick={() => {
                    const next = value.statements.filter((_, j) => j !== i)
                    onChange({ kind: value.kind, statements: next } as Statement)
                  }}
                  sx={{ mt: 0.5, color: 'error.main', flexShrink: 0 }}
                  title="Remove"
                >
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            onClick={() => onChange({ kind: value.kind, statements: [...value.statements, ""] } as Statement)}
            sx={{ mt: 0.75, fontSize: '0.75rem', borderStyle: 'dashed' }}
          >
            + Add {value.kind === "conjunction" ? "conjunct" : "disjunct"}
          </Button>
        </Box>
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
        <Box>
          <SubLabel>Antecedent</SubLabel>
          <StatementBuilder
            value={value.antecedent}
            onChange={(s) => onChange({ kind: "implication", antecedent: s, consequent: value.consequent })}
            depth={depth + 1}
          />
          <SubLabel>Consequent</SubLabel>
          <StatementBuilder
            value={value.consequent}
            onChange={(s) => onChange({ kind: "implication", antecedent: value.antecedent, consequent: s })}
            depth={depth + 1}
          />
        </Box>
      )}

      {/* Equivalence */}
      {typeof value !== "string" && value.kind === "equivalence" && (
        <Box>
          <SubLabel>Left</SubLabel>
          <StatementBuilder
            value={value.left}
            onChange={(s) => onChange({ kind: "equivalence", left: s, right: value.right })}
            depth={depth + 1}
          />
          <SubLabel>Right</SubLabel>
          <StatementBuilder
            value={value.right}
            onChange={(s) => onChange({ kind: "equivalence", left: value.left, right: s })}
            depth={depth + 1}
          />
        </Box>
      )}

      {/* Universal / Existential */}
      {typeof value !== "string" && (value.kind === "universal" || value.kind === "existential") && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ flex: 1 }}>
              <SubLabel>Variable name</SubLabel>
              <TextField
                size="small"
                fullWidth
                value={value.variable.name}
                onChange={(e) => onChange({
                  kind: value.kind,
                  variable: { ...value.variable, name: e.target.value },
                  statement: value.statement,
                } as Statement)}
                placeholder="e.g. $x$"
                sx={INPUT_SX}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SubLabel>Type / description</SubLabel>
              <TextField
                size="small" fullWidth
                value={value.variable.description}
                onChange={(e) => onChange({
                  kind: value.kind,
                  variable: { ...value.variable, description: e.target.value },
                  statement: value.statement,
                } as Statement)}
                placeholder="e.g. $NN$"
                sx={INPUT_SX}
              />
            </Box>
          </Box>
          <SubLabel>Statement</SubLabel>
          <StatementBuilder
            value={value.statement}
            onChange={(s) => onChange({ kind: value.kind, variable: value.variable, statement: s } as Statement)}
            depth={depth + 1}
          />
        </Box>
      )}

      {/* Highlight */}
      {typeof value !== "string" && value.kind === "highlight" && (
        <Box>
          <SubLabel>Highlighted statement</SubLabel>
          <StatementBuilder
            value={value.statement}
            onChange={(s) => onChange({ kind: "highlight", statement: s })}
            depth={depth + 1}
          />
        </Box>
      )}
    </Box>
  )
}
