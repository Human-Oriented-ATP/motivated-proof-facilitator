import React, { useState, useReducer, useEffect, useRef, JSX } from "react"
import {
  Box, Typography, Button, IconButton, Select, MenuItem,
  Chip, Alert, Tooltip, TextField, Paper,
} from "@mui/material"
import {
  ProofState, ProofStateWithLibraryResult as ProofStateWithLibraryResultType,
  StatementSchema,
} from "../src/core/ProofStateZod"
import { ProofDiscoveryMove, MoveKind, ProofDiscoveryMoveExample } from "../src/core/ProofDiscoveryMove"
import { runMove } from "../src/fetchers/move"
import { proofDiscoveryStateReducer, nullProofDiscoveryState } from "../src/core/ProofDiscoveryState"
import { ProofStateWithLibraryResult as ProofStateComponent } from "../src/components/ProofState"
import ProofStateContextProvider from "./ProofStateContext"
import { ProofStateSelectionContext, proofStateSelectionReducer, toProofStateSelectionWithPolarity } from "../src/core/ProofStateSelectionContext"
import { ProofStateIdContext } from "../src/core/ProofDiscoveryStateContext"
import TypstContextProvider from "../src/components/TypstContext"
import { ProofStateEditor } from "../src/components/ProofStateEditor"
import { formalizeProblem } from "../src/fetchers/formalize"
import { formalizeStatement } from "../src/fetchers/formalize-statement"

// ─── Design tokens (matching MovePanel) ──────────────────────────────────────

const G = {
  dark: '#064e3b', med: '#059669', bright: '#10b981',
  light: '#a7f3d0', bg: '#f6fbf9', border: '#d1fae5', text: '#022c22',
}
const BLU = {
  dark: '#1e3a5f', med: '#2e4a68', light: '#f0f4f8',
  border: '#c0cedb', bright: '#4a8ab5',
}

// ─── Inline icons ─────────────────────────────────────────────────────────────

const ChevronIcon = ({ rotated = false }: { rotated?: boolean }) => (
  <svg style={{ width: 14, height: 14, transition: 'transform 0.2s', transform: rotated ? 'rotate(180deg)' : 'none', display: 'block' }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const DownloadIcon = () => (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8m0 0L5 7m3 3l3-3M2 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CopyIcon = () => (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const SpinnerStyle = `@keyframes mg-spin { to { transform: rotate(360deg); } }`

function Spinner({ size = 18 }: { size?: number }) {
  useEffect(() => {
    const id = "mg-spinner-style"
    if (!document.getElementById(id)) {
      const s = document.createElement("style"); s.id = id; s.textContent = SpinnerStyle
      document.head.appendChild(s)
    }
  }, [])
  return (
    <Box sx={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid ${G.border}`, borderTopColor: G.bright,
      borderRadius: '50%', animation: 'mg-spin 0.8s linear infinite',
    }} />
  )
}

// ─── Shared select styles ─────────────────────────────────────────────────────

const selectSx = {
  fontSize: '0.82rem', fontWeight: 600, color: BLU.dark,
  background: 'rgba(255,255,255,0.7)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(180,200,220,0.7)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLU.bright },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLU.bright, borderWidth: '1.5px' },
  '& .MuiSelect-select': { py: '6px', px: '10px' },
}

const menuPaperSx = {
  background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
  border: '1px solid #c0cedb', borderRadius: '8px',
  mt: '3px', boxShadow: '0 4px 16px rgba(30,60,100,0.12)',
}

const menuItemSx = {
  fontSize: '0.82rem', fontWeight: 600, color: BLU.dark,
  '&:hover': { background: 'rgba(138,171,204,0.15)' },
  '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: BLU.dark },
  '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' },
}

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: BLU.dark, mb: 0.5,
    }}>
      {children}
    </Typography>
  )
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLU.med, whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', background: BLU.border }} />
    </Box>
  )
}

// ─── Green action button ──────────────────────────────────────────────────────

const greenBtnSx = {
  fontWeight: 700, textTransform: 'none' as const, borderRadius: '20px',
  color: '#2d5a2a', background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
  borderColor: '#7ab872', boxShadow: '0 2px 6px rgba(100,155,85,0.15)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 12px rgba(100,155,85,0.25)', transform: 'translateY(-1.5px)' },
  '&:disabled': { opacity: 0.45, boxShadow: 'none', transform: 'none' },
}

// ─── TextArea field ───────────────────────────────────────────────────────────

function TextArea({ value, onChange, placeholder, rows = 2 }: {
  value: string; onChange: (v: string) => void; placeholder: string; rows?: number
}) {
  return (
    <Box
      component="textarea"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      sx={{
        width: '100%', fontSize: '0.82rem', color: BLU.dark,
        border: `1.5px solid rgba(180,200,220,0.7)`, borderRadius: '8px',
        p: '8px 10px', resize: 'vertical',
        fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
        background: 'rgba(255,255,255,0.7)', lineHeight: 1.5, display: 'block',
        '&::placeholder': { color: '#8aabcc' },
        '&:focus': { borderColor: BLU.bright, background: 'rgba(255,255,255,0.95)', boxShadow: `0 0 0 3px rgba(74,138,181,0.12)` },
      }}
    />
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type UIExample = ProofDiscoveryMoveExample & { id: string }
type WorkflowState = "idle" | "formalizing" | "formalized" | "applying" | "applied"

export interface MoveGeneratorProps {
  /** If provided, the generator is pre-filled for editing this move. */
  initialMove?: ProofDiscoveryMove
  /** Called when the user saves/exports the move. */
  onSave?: (move: ProofDiscoveryMove) => void
  /** Called whenever the unsaved-changes status changes. */
  onHasUnsavedChanges?: (dirty: boolean) => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MoveGenerator({ initialMove, onSave, onHasUnsavedChanges }: MoveGeneratorProps = {}): JSX.Element {
  const [moveName, setMoveName] = useState(initialMove?.name ?? "")
  const [moveKind, setMoveKind] = useState<MoveKind>(initialMove?.kind ?? "strengthening")
  const [classification, setClassification] = useState<"mathematical" | "logical">(initialMove?.classification ?? "mathematical")
  const [runWithGuardrails, setRunWithGuardrails] = useState(initialMove?.runWithGuardrails ?? true)
  const [trigger, setTrigger] = useState(initialMove?.trigger ?? "")
  const [action, setAction] = useState(initialMove?.action ?? "")
  const [isDirty, setIsDirty] = useState(false)
  const [examples, setExamples] = useState<UIExample[]>(
    (initialMove?.examples ?? []).map((ex, i) => ({ ...ex, id: `init-${i}` }))
  )

  // Example editing
  const [editingExampleId, setEditingExampleId] = useState<string | null>(null)
  const [examplesOpen, setExamplesOpen] = useState(true)

  // Workflow
  const [workflowState, setWorkflowState] = useState<WorkflowState>("idle")
  const [problemDescription, setProblemDescription] = useState("")
  const [libraryStatement, setLibraryStatement] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failureReasoning, setFailureReasoning] = useState<string | null>(null)
  const [currentInputState, setCurrentInputState] = useState<ProofStateWithLibraryResultType | null>(null)
  const [currentOutputState, setCurrentOutputState] = useState<ProofStateWithLibraryResultType | null>(null)
  const [exampleComment, setExampleComment] = useState("")
  const [exampleDescription, setExampleDescription] = useState("")
  const [exampleKind, setExampleKind] = useState<"example" | "non-example">("example")

  const [showInputEditor, setShowInputEditor] = useState(false)
  const [showOutputEditor, setShowOutputEditor] = useState(false)

  const [, dispatch] = useReducer(proofDiscoveryStateReducer, nullProofDiscoveryState)
  const [selections, selectionsDispatch] = React.useReducer(proofStateSelectionReducer, [])
  const [copySuccess, setCopySuccess] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [jsonPaste, setJsonPaste] = useState("")

  // Emit dirty state to parent
  useEffect(() => {
    onHasUnsavedChanges?.(isDirty)
  }, [isDirty, onHasUnsavedChanges])

  // Update form when initialMove changes
  const prevInitialMove = useRef(initialMove)
  useEffect(() => {
    if (initialMove && initialMove !== prevInitialMove.current) {
      prevInitialMove.current = initialMove
      setMoveName(initialMove.name)
      setMoveKind(initialMove.kind)
      setClassification(initialMove.classification ?? "mathematical")
      setRunWithGuardrails(initialMove.runWithGuardrails ?? true)
      setTrigger(initialMove.trigger)
      setAction(initialMove.action)
      setExamples((initialMove.examples ?? []).map((ex, i) => ({ ...ex, id: `reload-${i}-${Date.now()}` })))
      setIsDirty(false)
      handleReset()
    }
  }, [initialMove])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const buildMove = (): ProofDiscoveryMove => {
    const stripped: ProofDiscoveryMoveExample[] = examples.map(({ id: _id, ...rest }) => rest)
    return { name: moveName, kind: moveKind, classification, runWithGuardrails, trigger, action, examples: stripped }
  }

  const handleLoadMove = (jsonString: string): void => {
    try {
      setLoadError(null)
      const parsed = JSON.parse(jsonString) as ProofDiscoveryMove
      if (!parsed.name || !parsed.kind || !parsed.trigger || !parsed.action)
        throw new Error("Missing required fields (name, kind, trigger, action)")
      setMoveName(parsed.name)
      setMoveKind(parsed.kind)
      setClassification(parsed.classification ?? "mathematical")
      setRunWithGuardrails(parsed.runWithGuardrails ?? true)
      setTrigger(parsed.trigger)
      setAction(parsed.action)
      setExamples((parsed.examples ?? []).map((ex, i) => ({ ...ex, id: `loaded-${Date.now()}-${i}` })))
      setJsonPaste("")
      handleReset()
    } catch (err) {
      setLoadError(err instanceof Error ? `Failed to load: ${err.message}` : "Invalid JSON")
    }
  }

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => handleLoadMove(e.target?.result as string)
    reader.onerror = () => setLoadError("Failed to read file")
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleReset = (): void => {
    setProblemDescription(""); setLibraryStatement(""); setCurrentInputState(null)
    setCurrentOutputState(null); setExampleComment(""); setExampleDescription("")
    setWorkflowState("idle"); setError(null); setFailureReasoning(null); setEditingExampleId(null)
    setShowInputEditor(false); setShowOutputEditor(false)
    selectionsDispatch({ type: 'CLEAR_ALL_SELECTIONS' })
    dispatch({ action: "initialize", statement: "", proofState: [] })
  }

  const handleFormalize = async (): Promise<void> => {
    if (!problemDescription.trim()) { setError("Please enter a problem description"); return }
    setIsLoading(true); setError(null); setWorkflowState("formalizing")
    try {
      const proofState = await formalizeProblem(problemDescription)
      let pswl: ProofStateWithLibraryResultType = { proofState }
      if (libraryStatement.trim()) {
        const lib = await formalizeStatement({ statement: libraryStatement })
        pswl.libraryResult = { label: "", statement: StatementSchema.parse(lib) }
      }
      dispatch({ action: "initialize", statement: problemDescription, proofState: pswl.proofState })
      setCurrentInputState(pswl)
      setWorkflowState("formalized")
    } catch (err) {
      setError(err instanceof Error ? `Failed: ${err.message}` : "Unknown error")
      setWorkflowState("idle")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateManually = (): void => {
    const empty: ProofStateWithLibraryResultType = { proofState: [{ variables: [], hypotheses: [], goals: [] }] }
    setCurrentInputState(empty)
    dispatch({ action: "initialize", statement: "Manual", proofState: empty.proofState })
    setWorkflowState("formalized")
    setShowInputEditor(true)
  }

  const handleApplyMove = async (): Promise<void> => {
    if (!currentInputState) { setError("No input state"); return }
    if (!action.trim()) { setError("Please enter an action first"); return }
    if (selections.length === 0) { setError("Please make selections in the proof state"); return }
    setIsLoading(true); setError(null); setFailureReasoning(null); setWorkflowState("applying")
    try {
      const { proofState: newPS, reasoning } = await runMove({
        proofState: currentInputState.proofState,
        move: { name: moveName, action, kind: moveKind, classification, runWithGuardrails, trigger, examples: [] },
        selections: selections.map(toProofStateSelectionWithPolarity),
      })
      if (newPS) {
        setCurrentOutputState({ proofState: newPS, libraryResult: currentInputState.libraryResult })
        setWorkflowState("applied")
      } else {
        setFailureReasoning(reasoning)
        setExampleComment(reasoning)
        setCurrentOutputState(null)
        setWorkflowState("applied")
      }
    } catch (err) {
      setError(err instanceof Error ? `Failed: ${err.message}` : "Unknown error")
      setWorkflowState("formalized")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveExample = (kind: "example" | "non-example"): void => {
    if (!currentInputState) return
    const newEx: UIExample = {
      id: editingExampleId ?? Date.now().toString(),
      description: exampleDescription || problemDescription,
      inputState: currentInputState,
      selections,
      outputState: currentOutputState,
      comment: exampleComment || undefined,
      kind,
    }
    if (editingExampleId) {
      setExamples(prev => prev.map(e => e.id === editingExampleId ? newEx : e))
    } else {
      setExamples(prev => [...prev, newEx])
    }
    setIsDirty(true)
    handleReset()
  }

  const handleEditExample = (ex: UIExample): void => {
    setEditingExampleId(ex.id)
    setExampleDescription(ex.description)
    setExampleKind(ex.kind)
    setExampleComment(ex.comment ?? "")
    setCurrentInputState(ex.inputState)
    setCurrentOutputState(ex.outputState)
    dispatch({ action: "initialize", statement: ex.description, proofState: ex.inputState.proofState })
    selectionsDispatch({ type: 'SET_SELECTIONS', selections: ex.selections })
    setWorkflowState("applied")
  }

  const handleDuplicateExample = (ex: UIExample): void => {
    const dup: UIExample = { ...ex, id: Date.now().toString() }
    setExamples(prev => [...prev, dup])
    setIsDirty(true)
  }

  const handleDeleteExample = (id: string): void => {
    setExamples(prev => prev.filter(e => e.id !== id))
    setIsDirty(true)
    if (editingExampleId === id) handleReset()
  }

  const handleUpdateInputProofState = (newPS: ProofState): void => {
    if (!currentInputState) return
    const updated = { ...currentInputState, proofState: newPS }
    setCurrentInputState(updated)
    dispatch({ action: "initialize", statement: problemDescription || "Manual", proofState: newPS })
  }

  const handleUpdateOutputProofState = (newPS: ProofState): void => {
    if (!currentOutputState) return
    setCurrentOutputState({ ...currentOutputState, proofState: newPS })
  }

  const handleDownload = (): void => {
    const move = buildMove()
    const blob = new Blob([JSON.stringify(move, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${moveName || "move"}.json`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildMove(), null, 2))
      setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000)
    } catch { /* ignore */ }
  }

  const handleSave = (): void => { onSave?.(buildMove()); setIsDirty(false) }

  const handleRegenerateOutput = (): void => {
    setCurrentOutputState(null)
    setShowOutputEditor(false)
    void handleApplyMove()
  }

  const isWorking = workflowState === "formalizing" || workflowState === "applying"
  const hasActiveWorkflow = workflowState !== "idle"

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* ── Move definition ── */}
      <Paper elevation={0} sx={{
        border: `1px solid ${BLU.border}`, borderRadius: '12px', overflow: 'hidden',
      }}>
        <Box sx={{
          px: 2, py: 1.25,
          background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
          borderBottom: `1px solid ${BLU.border}`,
        }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLU.dark }}>
            Move Definition
          </Typography>
        </Box>

        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          {/* Name */}
          <Box>
            <FieldLabel>Name</FieldLabel>
            <Box
              component="input"
              type="text"
              value={moveName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMoveName(e.target.value); setIsDirty(true) }}
              placeholder="e.g. Split a conjunction in the goal"
              sx={{
                width: '100%', fontSize: '0.88rem', fontWeight: 600, color: BLU.dark,
                border: `1.5px solid rgba(180,200,220,0.7)`, borderRadius: '8px',
                p: '7px 10px', outline: 'none', background: 'rgba(255,255,255,0.7)',
                boxSizing: 'border-box', display: 'block',
                '&::placeholder': { color: '#8aabcc', fontWeight: 400 },
                '&:focus': { borderColor: BLU.bright, background: 'rgba(255,255,255,0.95)', boxShadow: `0 0 0 3px rgba(74,138,181,0.12)` },
              }}
            />
          </Box>

          {/* Kind + Classification row */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>Kind</FieldLabel>
              <Select size="small" fullWidth value={moveKind}
                onChange={e => { setMoveKind(e.target.value as MoveKind); setIsDirty(true) }}
                sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }}>
                <MenuItem value="strengthening" sx={menuItemSx}>Strengthening</MenuItem>
                <MenuItem value="weakening" sx={menuItemSx}>Weakening</MenuItem>
                <MenuItem value="equivalence" sx={menuItemSx}>Equivalence</MenuItem>
                <MenuItem value="other" sx={menuItemSx}>Other</MenuItem>
              </Select>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>Classification</FieldLabel>
              <Select size="small" fullWidth value={classification}
                onChange={e => { setClassification(e.target.value as "mathematical" | "logical"); setIsDirty(true) }}
                sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }}>
                <MenuItem value="mathematical" sx={menuItemSx}>Mathematical</MenuItem>
                <MenuItem value="logical" sx={menuItemSx}>Logical</MenuItem>
              </Select>
            </Box>
          </Box>

          {/* Guardrails toggle */}
          <Box
            component="label"
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
              width: 'fit-content', userSelect: 'none',
            }}
          >
            <Box
              component="input"
              type="checkbox"
              checked={runWithGuardrails}
              onChange={e => { setRunWithGuardrails(e.target.checked); setIsDirty(true) }}
              sx={{ width: 14, height: 14, accentColor: BLU.bright, cursor: 'pointer', flexShrink: 0 }}
            />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: BLU.dark }}>
              Run with guardrails
            </Typography>
            <Tooltip title="When enabled, the LLM may decline to apply the move if it judges it inapplicable. Disable to force an output regardless." placement="right">
              <Box component="span" sx={{ fontSize: '0.68rem', color: '#94a3b8', cursor: 'help', lineHeight: 1 }}>ⓘ</Box>
            </Tooltip>
          </Box>

          {/* Trigger */}
          <Box>
            <FieldLabel>Trigger</FieldLabel>
            <TextArea
              value={trigger}
              onChange={v => { setTrigger(v); setIsDirty(true) }}
              placeholder="Describe when this move is relevant (what selections must exist)…"
              rows={2}
            />
          </Box>

          {/* Action */}
          <Box>
            <FieldLabel>Action</FieldLabel>
            <TextArea
              value={action}
              onChange={v => { setAction(v); setIsDirty(true) }}
              placeholder="Describe how this move transforms the proof state…"
              rows={3}
            />
          </Box>
        </Box>
      </Paper>

      {/* ── Examples list ── */}
      <Paper elevation={0} sx={{ border: `1px solid ${BLU.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Button
          fullWidth
          onClick={() => setExamplesOpen(v => !v)}
          endIcon={<Box sx={{ display: 'flex', transition: 'transform 0.2s', transform: examplesOpen ? 'rotate(180deg)' : 'none' }}><ChevronIcon /></Box>}
          sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            px: 2, py: 1.25, textAlign: 'left', textTransform: 'none', borderRadius: 0,
            background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
            borderBottom: examplesOpen && examples.length > 0 ? `1px solid ${BLU.border}` : 'none',
            '&:hover': { background: 'linear-gradient(180deg, #edf2f7 0%, #e2eaf2 100%)' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLU.dark }}>
              Examples
            </Typography>
            <Chip label={examples.length} size="small" sx={{
              height: 18, fontSize: '0.65rem', fontWeight: 700,
              background: examples.length > 0 ? G.bg : '#f1f5f9',
              color: examples.length > 0 ? G.dark : '#64748b',
              border: `1px solid ${examples.length > 0 ? G.border : '#e2e8f0'}`,
              '& .MuiChip-label': { px: '6px' },
            }} />
          </Box>
        </Button>

        {examplesOpen && (
          <Box>
            {examples.length === 0 ? (
              <Box sx={{ px: 2, py: 2.5, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500, letterSpacing: '0.02em' }}>
                  ✨ No examples yet
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>
                  Add one to help demonstrate how this move works
                </Typography>
              </Box>
            ) : (
              examples.map((ex, i) => {
                const isEditing = editingExampleId === ex.id
                const isEx = ex.kind === "example"
                const accent = isEx ? G.bright : '#ef4444'
                const bg = isEx ? G.bg : '#fff5f5'
                const border = isEx ? G.border : '#fee2e2'
                return (
                  <Box key={ex.id} sx={{
                    borderBottom: i < examples.length - 1 ? `1px solid ${BLU.border}` : 'none',
                    background: isEditing ? (isEx ? '#f0fdf4' : '#fef2f2') : 'white',
                    transition: 'background 0.15s',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1 }}>
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: accent, color: 'white', fontSize: '0.62rem', fontWeight: 800,
                      }}>
                        {isEx ? '✓' : '✗'}
                      </Box>
                      <Typography sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ex.description || `Example ${i + 1}`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <Tooltip title={isEditing ? "Currently editing" : "Edit"}>
                          <IconButton size="small"
                            onClick={() => isEditing ? handleReset() : handleEditExample(ex)}
                            sx={{
                              width: 26, height: 26, borderRadius: '6px',
                              background: isEditing ? (isEx ? G.light : '#fecaca') : 'transparent',
                              border: `1px solid ${isEditing ? accent : 'transparent'}`,
                              color: isEditing ? accent : '#64748b',
                              '&:hover': { background: bg, border: `1px solid ${border}`, color: accent },
                            }}>
                            <svg style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton size="small"
                            onClick={() => handleDuplicateExample(ex)}
                            sx={{ width: 26, height: 26, borderRadius: '6px', color: '#64748b', '&:hover': { background: BLU.light, color: BLU.dark } }}>
                            <svg style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                            </svg>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small"
                            onClick={() => handleDeleteExample(ex.id)}
                            sx={{ width: 26, height: 26, borderRadius: '6px', color: '#94a3b8', '&:hover': { background: '#fff5f5', color: '#ef4444', border: '1px solid #fee2e2' } }}>
                            <svg style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>
        )}
      </Paper>

      {/* ── Add / edit example workflow ── */}
      <Paper elevation={0} sx={{ border: `1px solid ${BLU.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{
          px: 2, py: 1.25,
          background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
          borderBottom: `1px solid ${BLU.border}`,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLU.dark }}>
            {editingExampleId ? "Edit Example" : "Add Example"}
          </Typography>
          {editingExampleId && (
            <Chip label="editing" size="small" sx={{
              height: 16, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
              background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047',
              '& .MuiChip-label': { px: '6px' },
            }} />
          )}
        </Box>

        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          {workflowState === "idle" && (
            <>
              <Box>
                <FieldLabel>Description</FieldLabel>
                <Box
                  component="input"
                  type="text"
                  value={exampleDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExampleDescription(e.target.value)}
                  placeholder="Short label for this example…"
                  sx={{
                    width: '100%', fontSize: '0.82rem', color: BLU.dark,
                    border: `1.5px solid rgba(180,200,220,0.7)`, borderRadius: '8px',
                    p: '7px 10px', outline: 'none', background: 'rgba(255,255,255,0.7)',
                    boxSizing: 'border-box', display: 'block', fontFamily: 'inherit',
                    '&::placeholder': { color: '#8aabcc' },
                    '&:focus': { borderColor: BLU.bright, background: 'rgba(255,255,255,0.95)', boxShadow: `0 0 0 3px rgba(74,138,181,0.12)` },
                  }}
                />
              </Box>

              {/* Generate path */}
              <Box sx={{
                border: `1.5px solid ${BLU.border}`, borderRadius: '10px', p: 1.5,
                display: 'flex', flexDirection: 'column', gap: 1.25,
                background: 'rgba(240,244,248,0.45)',
              }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: BLU.med }}>
                  Generate from description
                </Typography>
                <Box>
                  <FieldLabel>Problem</FieldLabel>
                  <TextArea value={problemDescription} onChange={setProblemDescription}
                    placeholder="Describe the mathematical problem in natural language…" rows={2} />
                </Box>
                <Box>
                  <FieldLabel>Library hint (optional)</FieldLabel>
                  <TextArea value={libraryStatement} onChange={setLibraryStatement}
                    placeholder="A statement to include in the context…" rows={1} />
                </Box>
                <Button variant="outlined" size="small" onClick={handleFormalize}
                  disabled={isLoading || !problemDescription.trim()}
                  sx={{ ...greenBtnSx, fontSize: '0.78rem', px: 1.75, alignSelf: 'flex-start' }}>
                  Generate proof state
                </Button>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ flex: 1, height: '1px', background: BLU.border }} />
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>or</Typography>
                <Box sx={{ flex: 1, height: '1px', background: BLU.border }} />
              </Box>

              <Button variant="outlined" size="small" onClick={handleCreateManually}
                sx={{
                  fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '20px',
                  color: BLU.dark, borderColor: BLU.border, alignSelf: 'flex-start',
                  background: 'rgba(255,255,255,0.5)', transition: 'all 0.2s ease',
                  '&:hover': { background: BLU.light, borderColor: BLU.bright, boxShadow: '0 2px 8px rgba(30,60,100,0.08)', transform: 'translateY(-1px)' },
                }}>
                Build manually
              </Button>
            </>
          )}

          {workflowState === "formalizing" && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', background: BLU.light, border: `1px solid ${BLU.border}` }}>
              <Spinner size={16} />
              <Typography sx={{ fontSize: '0.8rem', color: BLU.dark, fontWeight: 500 }}>
                Generating proof state…
              </Typography>
            </Box>
          )}

          {hasActiveWorkflow && currentInputState && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <SectionDivider label="Input State" />

              <Box sx={{ background: 'white', borderRadius: '8px', border: `1px solid ${BLU.border}`, overflow: 'hidden' }}>
                <Box sx={{ px: 1.5, py: '6px', background: BLU.light, borderBottom: `1px solid ${BLU.border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.63rem', color: BLU.dark, fontWeight: 700, flex: 1 }}>
                    {showInputEditor ? 'Edit proof state' : 'Selections made. Choose how to create output:'}
                  </Typography>
                  <Tooltip title={showInputEditor ? "Hide editor" : "Edit proof state"}>
                    <Box
                      component="button"
                      onClick={() => setShowInputEditor(v => !v)}
                      sx={{
                        width: 26, height: 26, cursor: 'pointer', borderRadius: '6px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${showInputEditor ? BLU.bright : 'transparent'}`,
                        background: showInputEditor ? BLU.border : 'transparent',
                        color: showInputEditor ? BLU.dark : '#94a3b8',
                        '&:hover': { background: BLU.border, color: BLU.dark, borderColor: BLU.border },
                      }}
                    >
                      <svg style={{ width: 11, height: 11, display: 'block' }} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Box>
                  </Tooltip>
                </Box>
                {!showInputEditor && (
                  <Box sx={{ p: 1 }}>
                    <ProofStateIdContext.Provider value={{ proofNodeId: selections[0]?.proofStateId.proofNodeId ?? 0, proofContextId: selections[0]?.proofStateId.proofContextId ?? 0 }}>
                      <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
                        <TypstContextProvider>
                          <ProofStateComponent
                            proofState={currentInputState.proofState}
                            libraryResult={currentInputState.libraryResult}
                          />
                        </TypstContextProvider>
                      </ProofStateSelectionContext.Provider>
                    </ProofStateIdContext.Provider>
                  </Box>
                )}
                {showInputEditor && (
                  <Box sx={{ px: 1.5, pb: 1.5, pt: 1, borderTop: `1px solid ${BLU.border}` }}>
                    <ProofStateEditor
                      proofState={currentInputState.proofState}
                      onUpdate={handleUpdateInputProofState}
                    />
                    <Box sx={{ mt: 1, p: '8px 10px', borderRadius: '6px', background: '#f0fdf4', border: `1px solid ${G.border}`, fontSize: '0.65rem', color: G.dark, animation: 'fadeIn 0.3s ease-out' }}>
                      💡 Close the editor to see output creation options
                    </Box>
                  </Box>
                )}
              </Box>

              {workflowState === "formalized" && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.75, pt: 1, borderTop: `1px solid ${BLU.border}` }}>
                    <Button variant="outlined" size="small" onClick={() => void handleApplyMove()}
                      disabled={isLoading || !action.trim()}
                      sx={{ ...greenBtnSx, fontSize: '0.78rem', px: 1.75 }}>
                      {isLoading ? 'Applying…' : 'Apply move'}
                    </Button>
                    <Button variant="outlined" size="small"
                      onClick={() => {
                        setCurrentOutputState({ proofState: JSON.parse(JSON.stringify(currentInputState!.proofState)), libraryResult: currentInputState!.libraryResult })
                        setWorkflowState("applied")
                        setShowOutputEditor(true)
                      }}
                      sx={{
                        fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '20px',
                        color: '#1565C0', borderColor: '#2196F3', background: '#E3F2FD', border: '1.5px solid #2196F3',
                        '&:hover': { background: '#BBDEFB', borderColor: '#1565C0' },
                      }}>
                      Edit output manually
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => handleSaveExample("non-example")}
                      sx={{
                        fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '20px',
                        color: '#7f1d1d', borderColor: '#fca5a5', background: '#fff5f5',
                        '&:hover': { background: '#fee2e2', borderColor: '#f87171' },
                      }}>
                      Save as non-example
                    </Button>
                    <Button variant="text" size="small" onClick={handleReset}
                      sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748b', textTransform: 'none' }}>
                      Discard
                    </Button>
                  </Box>
                  {error && (
                    <Alert severity="error" sx={{ fontSize: '0.76rem', borderRadius: '8px', py: 0.75, px: 1.25, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', '& .MuiAlert-icon': { color: '#DC2626' }, transition: 'all 0.2s ease' }}>{error}</Alert>
                  )}
                </Box>
              )}

              {workflowState === "applying" && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', background: BLU.light, border: `1px solid ${BLU.border}` }}>
                  <Spinner size={16} />
                  <Typography sx={{ fontSize: '0.8rem', color: BLU.dark, fontWeight: 500 }}>
                    Applying move…
                  </Typography>
                </Box>
              )}

              {workflowState === "applied" && (
                <>
                  {currentOutputState && (
                    <>
                      <SectionDivider label="Output State" />
                      <Box sx={{ background: 'white', borderRadius: '8px', border: `1px solid ${BLU.border}`, overflow: 'hidden' }}>
                        <Box sx={{ px: 1.5, py: '6px', background: BLU.light, borderBottom: `1px solid ${BLU.border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.63rem', color: BLU.dark, fontWeight: 700, flex: 1 }}>
                            Output state
                          </Typography>
                          <Tooltip title={showOutputEditor ? "Hide editor" : "Edit proof state"}>
                            <Box
                              component="button"
                              onClick={() => setShowOutputEditor(v => !v)}
                              sx={{
                                width: 26, height: 26, cursor: 'pointer', borderRadius: '6px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `1px solid ${showOutputEditor ? BLU.bright : 'transparent'}`,
                                background: showOutputEditor ? BLU.border : 'transparent',
                                color: showOutputEditor ? BLU.dark : '#94a3b8',
                                '&:hover': { background: BLU.border, color: BLU.dark, borderColor: BLU.border },
                              }}
                            >
                              <svg style={{ width: 11, height: 11, display: 'block' }} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Box>
                          </Tooltip>
                        </Box>
                        {!showOutputEditor && (
                          <Box sx={{ p: 1 }}>
                            <ProofStateIdContext.Provider value={{ proofNodeId: 0, proofContextId: 0 }}>
                              <TypstContextProvider>
                                <ProofStateComponent
                                  proofState={currentOutputState.proofState}
                                  libraryResult={currentOutputState.libraryResult}
                                />
                              </TypstContextProvider>
                            </ProofStateIdContext.Provider>
                          </Box>
                        )}
                        {showOutputEditor && (
                          <Box sx={{ px: 1.5, pb: 1.5, pt: 1, borderTop: `1px solid ${BLU.border}` }}>
                            <ProofStateEditor
                              proofState={currentOutputState.proofState}
                              onUpdate={handleUpdateOutputProofState}
                            />
                          </Box>
                        )}
                      </Box>
                    </>
                  )}

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLU.dark }}>
                        Comment {failureReasoning ? "(failure reason)" : "(optional)"}
                      </Typography>
                      {failureReasoning && (
                        <Box sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#ef4444', background: '#fff5f5', border: '1px solid #fecaca', px: 0.75, py: 0.25, borderRadius: '4px' }}>
                          Not applicable
                        </Box>
                      )}
                    </Box>
                    <Box
                      component="input"
                      type="text"
                      value={exampleComment}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExampleComment(e.target.value)}
                      placeholder="Add a note about this example…"
                      sx={{
                        width: '100%', fontSize: '0.82rem', color: failureReasoning ? '#7f1d1d' : BLU.dark,
                        border: failureReasoning ? `1.5px solid #fca5a5` : `1.5px solid rgba(180,200,220,0.7)`, borderRadius: '8px',
                        p: '7px 10px', outline: 'none', background: failureReasoning ? '#fff5f5' : 'rgba(255,255,255,0.7)',
                        boxSizing: 'border-box', display: 'block', fontFamily: 'inherit',
                        '&::placeholder': { color: '#8aabcc' },
                        '&:focus': { borderColor: failureReasoning ? '#ef4444' : BLU.bright, background: 'rgba(255,255,255,0.95)', boxShadow: failureReasoning ? `0 0 0 3px rgba(239,68,68,0.12)` : `0 0 0 3px rgba(74,138,181,0.12)` },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" onClick={() => handleSaveExample("example")}
                      disabled={!currentOutputState}
                      sx={{ ...greenBtnSx, fontSize: '0.78rem', px: 1.75, '&:disabled': { opacity: 0.45, boxShadow: 'none', transform: 'none' } }}>
                      {editingExampleId ? "Update as example" : "Save as example"}
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => handleSaveExample("non-example")}
                      sx={{
                        fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '20px',
                        color: '#7f1d1d', borderColor: '#fca5a5', background: '#fff5f5',
                        '&:hover': { background: '#fee2e2', borderColor: '#f87171' },
                      }}>
                      {editingExampleId ? "Update as non-example" : "Save as non-example"}
                    </Button>
                    <Button variant="outlined" size="small"
                      onClick={handleRegenerateOutput}
                      disabled={isLoading || !action.trim()}
                      sx={{
                        fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '20px',
                        color: BLU.dark, borderColor: BLU.border, background: BLU.light,
                        '&:hover': { background: BLU.border, borderColor: BLU.bright },
                        '&:disabled': { opacity: 0.45 },
                      }}>
                      Regenerate output
                    </Button>
                    <Button variant="text" size="small" onClick={handleReset}
                      sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748b', textTransform: 'none' }}>
                      Discard
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* ── Load from JSON ── */}
      <Paper elevation={0} sx={{ border: `1px solid ${BLU.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{
          px: 2, py: 1.25,
          background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
          borderBottom: `1px solid ${BLU.border}`,
        }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLU.dark }}>
            Load from JSON
          </Typography>
        </Box>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" component="label"
              sx={{
                fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                color: BLU.dark, borderColor: BLU.border,
                '&:hover': { background: BLU.light, borderColor: BLU.bright },
              }}>
              Upload file
              <input type="file" accept=".json" hidden onChange={handleFileLoad} />
            </Button>
          </Box>
          <Box>
            <FieldLabel>Or paste JSON</FieldLabel>
            <TextArea
              value={jsonPaste}
              onChange={setJsonPaste}
              placeholder="Paste move JSON here…"
              rows={3}
            />
            <Button size="small" onClick={() => { if (jsonPaste.trim()) handleLoadMove(jsonPaste) }}
              disabled={!jsonPaste.trim()}
              sx={{
                mt: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                color: BLU.dark, borderColor: BLU.border, border: '1px solid', px: 1.5,
                '&:hover': { background: BLU.light },
                '&:disabled': { opacity: 0.4 },
              }}>
              Load
            </Button>
          </Box>
          {loadError && (
            <Alert severity="error" sx={{ fontSize: '0.75rem', borderRadius: '8px', py: 0.5 }}>{loadError}</Alert>
          )}
        </Box>
      </Paper>

      {/* ── Actions ── */}
      <Paper elevation={0} sx={{ border: `1px solid ${BLU.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{
          px: 2, py: 1.25,
          background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
          borderBottom: `1px solid ${BLU.border}`,
        }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLU.dark }}>
            Actions
          </Typography>
        </Box>
        <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {onSave && (
            <Button variant="outlined" size="small" disabled={!moveName.trim()}
              onClick={handleSave}
              sx={{ ...greenBtnSx, fontSize: '0.78rem', px: 1.75 }}>
              Save to move set
            </Button>
          )}
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
            disabled={!moveName.trim()}
            onClick={handleDownload}
            sx={{
              fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '20px',
              color: BLU.dark, borderColor: BLU.border,
              '&:hover': { background: BLU.light, borderColor: BLU.bright },
              '&:disabled': { opacity: 0.4 },
              '& .MuiButton-startIcon': { mr: '4px' },
            }}>
            Download JSON
          </Button>
          <Button variant="outlined" size="small" startIcon={<CopyIcon />}
            disabled={!moveName.trim()}
            onClick={() => void handleCopy()}
            sx={{
              fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '20px',
              color: copySuccess ? G.dark : BLU.dark,
              borderColor: copySuccess ? G.border : BLU.border,
              background: copySuccess ? G.bg : 'transparent',
              '&:hover': { background: copySuccess ? G.light : BLU.light, borderColor: copySuccess ? G.bright : BLU.bright },
              '&:disabled': { opacity: 0.4 },
              '& .MuiButton-startIcon': { mr: '4px' },
            }}>
            {copySuccess ? "Copied!" : "Copy JSON"}
          </Button>
        </Box>
      </Paper>

    </Box>
  )
}
