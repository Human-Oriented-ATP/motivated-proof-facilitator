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

const BLU_DARK   = '#1e3a5f'
const BLU_MED    = '#2e4a68'
const BLU_BRIGHT = '#4a8ab5'
const BLU_BORDER = 'rgba(180,200,220,0.7)'
const BLU_LIGHT  = '#f0f4f8'

// Sublabel for nested fields
function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      display: 'block', mb: 0.5, mt: 1,
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: BLU_DARK,
    }}>
      {children}
    </Typography>
  )
}

// Shared styles applied to all inputs in the builder
const INPUT_SX = {
  '& .MuiInputBase-input': {
    fontSize: '0.82rem', py: '7px', px: '10px', color: BLU_DARK,
  },
  '& .MuiOutlinedInput-root': { fontSize: '0.82rem', background: 'rgba(255,255,255,0.7)' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: BLU_BORDER },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLU_BRIGHT },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLU_BRIGHT, borderWidth: '1.5px' },
} as const

const SELECT_SX = {
  fontSize: '0.82rem', fontWeight: 600, color: BLU_DARK,
  background: 'rgba(255,255,255,0.7)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: BLU_BORDER },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLU_BRIGHT },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLU_BRIGHT, borderWidth: '1.5px' },
  '& .MuiSelect-select': { fontSize: '0.82rem', fontWeight: 600, py: '7px', px: '10px' },
} as const

const MENU_PAPER_SX = {
  background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
  border: '1px solid #c0cedb', borderRadius: '8px',
  mt: '3px', boxShadow: '0 4px 16px rgba(30,60,100,0.12)',
} as const

const MENU_ITEM_SX = {
  fontSize: '0.82rem', fontWeight: 600, color: BLU_DARK,
  '&:hover': { background: 'rgba(138,171,204,0.15)' },
  '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: BLU_DARK },
  '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' },
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
      <FormControl size="small" sx={{ minWidth: 160, mb: 0.75 }}>
        <Select value={kind} onChange={handleKindChange} sx={SELECT_SX}
          MenuProps={{ PaperProps: { sx: MENU_PAPER_SX } }}>
          {STATEMENT_KINDS.map(k => (
            <MenuItem key={k.value} value={k.value} sx={MENU_ITEM_SX}>
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
            sx={{
              mt: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
              borderStyle: 'dashed', borderColor: BLU_BORDER, color: BLU_MED, borderRadius: '8px',
              '&:hover': { background: BLU_LIGHT, borderColor: BLU_BRIGHT, borderStyle: 'solid' },
            }}
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
