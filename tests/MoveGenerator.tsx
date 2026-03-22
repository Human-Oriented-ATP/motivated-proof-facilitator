import React, { useState, useReducer, useEffect, JSX } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tooltip,
  SelectChangeEvent,
} from "@mui/material"
import { ProofState, ProofStateSchema, ProofStateWithLibraryResult as ProofStateWithLibraryResultType, StatementSchema } from "../src/core/ProofStateZod"
import { ProofDiscoveryMove, MoveKind, ProofDiscoveryMoveExample } from "../src/core/ProofDiscoveryMove"
import { runMove } from "../src/fetchers/move"

type UIExample = ProofDiscoveryMoveExample & { id: string }
import { proofDiscoveryStateReducer, nullProofDiscoveryState } from "../src/core/ProofDiscoveryState"
import { ProofStateWithLibraryResult as ProofStateWithLibraryResultComponent } from "../src/components/ProofState"
import ProofStateContextProvider from "./ProofStateContext"
import { ProofStateSelectionContext, proofStateSelectionReducer } from "../src/core/ProofStateSelectionContext"
import TypstContextProvider from "../src/components/TypstContext"
import { ProofStateEditor } from "../src/components/ProofStateEditor"
import { formalizeStatement } from "../src/fetchers/formalize"

type WorkflowState = "idle" | "formalizing" | "formalized" | "applying" | "applied"

// ── Inline SVG icons (no @mui/icons-material dependency) ────────────────────

function ChevronDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 7l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8m0 0L5 7m3 3l3-3M2 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

// ── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card elevation={0} sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      mb: 3,
      overflow: 'visible',
    }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2.5, letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MoveGenerator({ initialMoveJson }: { initialMoveJson?: string } = {}): JSX.Element {
  const [moveName, setMoveName] = useState("")
  const [moveKind, setMoveKind] = useState<MoveKind>("strengthening")
  const [trigger, setTrigger] = useState("")
  const [action, setAction] = useState("")

  const [examples, setExamples] = useState<UIExample[]>([])

  const [workflowState, setWorkflowState] = useState<WorkflowState>("idle")
  const [problemDescription, setProblemDescription] = useState("")
  const [libraryStatement, setLibraryStatement] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentInputState, setCurrentInputState] = useState<ProofStateWithLibraryResultType | null>(null)
  const [currentOutputState, setCurrentOutputState] = useState<ProofStateWithLibraryResultType | null>(null)
  const [exampleComment, setExampleComment] = useState("")
  const [reasoningTrace, setReasoningTrace] = useState<string | null>(null)

  const [, dispatch] = useReducer(proofDiscoveryStateReducer, nullProofDiscoveryState)
  const [selections, selectionsDispatch] = React.useReducer(proofStateSelectionReducer, [])

  const [copySuccess, setCopySuccess] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (initialMoveJson) handleLoadMove(initialMoveJson)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMoveJson])

  const handleLoadMove = (jsonString: string): void => {
    try {
      setLoadError(null)
      const parsed = JSON.parse(jsonString) as ProofDiscoveryMove

      if (!parsed.name || !parsed.kind || !parsed.trigger || !parsed.action) {
        throw new Error("Invalid move structure: missing required fields")
      }

      setMoveName(parsed.name)
      setMoveKind(parsed.kind)
      setTrigger(parsed.trigger)
      setAction(parsed.action)

      if (Array.isArray(parsed.examples)) {
        setExamples(parsed.examples.map((ex, idx) => ({
          id: `loaded-${Date.now()}-${idx}`,
          description: ex.description,
          inputState: ex.inputState,
          selections: ex.selections ?? [],
          outputState: ex.outputState,
          comment: ex.comment,
          kind: ex.kind,
        })))
      }

      handleReset()
    } catch (err) {
      setLoadError(err instanceof Error ? `Failed to load move: ${err.message}` : "Invalid JSON format")
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

  const handleFormalize = async (): Promise<void> => {
    if (!problemDescription.trim()) { setError("Please enter a problem description"); return }
    setIsLoading(true); setError(null); setWorkflowState("formalizing")

    try {
      const proofState = await formalizeStatement({ problem: problemDescription })
      let proofStateWithLibrary: ProofStateWithLibraryResultType = { proofState }

      if (libraryStatement.trim()) {
        const libraryResponse = await fetch("https://atp-backend-rygt.onrender.com/formalize-statement", {
          method: "POST", mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statement: libraryStatement }),
        })
        if (!libraryResponse.ok) throw new Error(`HTTP error from formalize-statement! status: ${libraryResponse.status}`)
        const libraryData: unknown = await libraryResponse.json()
        console.log("Formalized library statement:", libraryData)
        proofStateWithLibrary.libraryResult = { label: "", statement: StatementSchema.parse(libraryData) }
      }

      dispatch({ action: "initialize", statement: problemDescription, proofState: proofStateWithLibrary.proofState })
      setCurrentInputState(proofStateWithLibrary)
      setWorkflowState("formalized")
    } catch (err) {
      setError(err instanceof Error ? `Failed to formalize: ${err.message}` : "An unknown error occurred")
      setWorkflowState("idle")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyMove = async (skipWarning: boolean = false): Promise<void> => {
    if (!currentInputState) { setError("No proof state to apply move to"); return }
    if (!action.trim()) { setError("Please enter an action description first"); return }
    if (!skipWarning && selections.length === 0) {
      if (!window.confirm("No selections have been made. Would you still like to proceed?")) return
    }
    setIsLoading(true); setError(null); setWorkflowState("applying")

    try {
      const { proofState: newProofState, reasoning } = await runMove(
        currentInputState.proofState,
        { name: moveName, action, kind: moveKind, trigger, examples: [] },
        selections
      )
      setCurrentOutputState({ proofState: newProofState, libraryResult: currentInputState.libraryResult })
      setReasoningTrace(reasoning)
      setWorkflowState("applied")
    } catch (err) {
      setError(err instanceof Error ? `Failed to apply move: ${err.message}` : "An unknown error occurred")
      setReasoningTrace(null)
      setWorkflowState("formalized")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveExample = (kind: "example" | "non-example"): void => {
    if (!currentInputState) return
    setExamples([...examples, {
      id: Date.now().toString(),
      description: problemDescription,
      inputState: currentInputState,
      selections,
      outputState: currentOutputState,
      comment: exampleComment || undefined,
      kind,
    }])
    handleReset()
  }

  const handleReset = (): void => {
    setProblemDescription(""); setLibraryStatement(""); setCurrentInputState(null)
    setCurrentOutputState(null); setExampleComment(""); setWorkflowState("idle")
    setError(null); setReasoningTrace(null)
    selectionsDispatch({ type: 'CLEAR_ALL_SELECTIONS' })
    dispatch({ action: "initialize", statement: "", proofState: [] })
  }

  const handleCreateManually = (): void => {
    const emptyState: ProofStateWithLibraryResultType = { proofState: [{ variables: [], hypotheses: [], goals: [] }] }
    setCurrentInputState(emptyState)
    dispatch({ action: "initialize", statement: "Manual proof state", proofState: emptyState.proofState })
    setWorkflowState("formalized")
  }

  const handleUpdateInputProofState = (newProofState: ProofState): void => {
    if (!currentInputState) return
    const updated = { ...currentInputState, proofState: newProofState }
    setCurrentInputState(updated)
    dispatch({ action: "initialize", statement: problemDescription || "Manual proof state", proofState: newProofState })
  }

  const handleUpdateOutputProofState = (newProofState: ProofState): void => {
    if (!currentOutputState) return
    setCurrentOutputState({ ...currentOutputState, proofState: newProofState })
  }

  const generateMoveJSON = (): string => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const strippedExamples: ProofDiscoveryMoveExample[] = examples.map(({ id: _id, ...rest }) => rest)
    return JSON.stringify({ name: moveName, kind: moveKind, trigger, action, examples: strippedExamples } as ProofDiscoveryMove, null, 2)
  }

  const handleExport = (): void => {
    const blob = new Blob([generateMoveJSON()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${moveName || "move"}.json`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleCopyJSON = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(generateMoveJSON())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const isWorking = workflowState === "formalizing" || workflowState === "applying"

  return (
    <Box sx={{
      maxWidth: 920,
      mx: 'auto',
      px: 3,
      py: 5,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#f8fafc',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a5f', letterSpacing: '-0.02em', mb: 0.5 }}>
          Move Generator
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
          An interface for conveniently generating prompts for motivated proof moves
        </Typography>
      </Box>

      {/* Move Configuration */}
      <SectionCard title="Move Configuration">
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Move Name"
            value={moveName}
            onChange={(e) => setMoveName(e.target.value)}
            placeholder="Enter a descriptive name…"
            fullWidth
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: '#2e4a68', fontSize: '0.82rem', '&.Mui-focused': { color: '#2e4a68' } }}>Kind</InputLabel>
            <Select
              label="Kind"
              value={moveKind}
              onChange={(e: SelectChangeEvent) => setMoveKind(e.target.value as MoveKind)}
              sx={{
                fontSize: '0.82rem', fontWeight: 600, color: '#2e4a68',
                background: 'rgba(255,255,255,0.65)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(180,200,220,0.7)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8aabcc' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8aabcc', borderWidth: '1.5px' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
                    border: '1px solid #c0cedb',
                    borderRadius: '8px',
                    mt: '3px',
                    boxShadow: '0 4px 16px rgba(30,60,100,0.12)',
                  }
                }
              }}
            >
              <MenuItem value="strengthening" sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#2e4a68', '&:hover': { background: 'rgba(138,171,204,0.15)' }, '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: '#1e3a5f' }, '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' } }}>Strengthening</MenuItem>
              <MenuItem value="weakening"     sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#2e4a68', '&:hover': { background: 'rgba(138,171,204,0.15)' }, '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: '#1e3a5f' }, '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' } }}>Weakening</MenuItem>
              <MenuItem value="equivalence"   sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#2e4a68', '&:hover': { background: 'rgba(138,171,204,0.15)' }, '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: '#1e3a5f' }, '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' } }}>Equivalence</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <TextField
          label="Trigger"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder="Describe when this move should appear in suggestions…"
          fullWidth multiline rows={2} size="small"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Describe how this move transforms the proof state…"
          fullWidth multiline rows={2} size="small"
        />
      </SectionCard>

      {/* Examples List */}
      {examples.length > 0 && (
        <SectionCard title={`Examples (${examples.length})`}>
          <Stack spacing={1.5}>
            {examples.map((ex) => (
              <Box key={ex.id} sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                p: 1.75, borderRadius: 2,
                border: '1px solid', borderColor: 'divider',
                background: '#f8fafc',
              }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Chip
                      label={ex.kind === "example" ? "Example" : "Non-example"}
                      size="small"
                      sx={{
                        fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        bgcolor: ex.kind === "example" ? '#dcfce7' : '#fee2e2',
                        color: ex.kind === "example" ? '#166534' : '#991b1b',
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {ex.description}
                    </Typography>
                  </Stack>
                  {ex.selections.length === 0 && (
                    <Alert severity="warning" sx={{ py: 0, mt: 0.5, fontSize: '0.75rem' }}>
                      No selections recorded for this example
                    </Alert>
                  )}
                  {ex.comment && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      {ex.comment}
                    </Typography>
                  )}
                </Box>
                <Tooltip title="Remove example">
                  <IconButton size="small" onClick={() => setExamples(examples.filter(e => e.id !== ex.id))} sx={{ color: 'error.main' }}>
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      )}

      {/* Add Example workflow */}
      <SectionCard title="Add Example">
        {workflowState === "idle" && (
          <Stack spacing={2}>
            <TextField
              label="Example Description"
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Describe the proof state you want to use as an example…"
              fullWidth multiline rows={2} size="small"
            />
            <TextField
              label="Library Statement (optional)"
              value={libraryStatement}
              onChange={(e) => setLibraryStatement(e.target.value)}
              placeholder="Enter a library statement to include…"
              fullWidth multiline rows={2} size="small"
            />
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                onClick={handleFormalize}
                disabled={isLoading || !problemDescription.trim()}
                sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#2e4a68' }, fontWeight: 600 }}
              >
                Generate
              </Button>
              <Button
                variant="outlined"
                onClick={handleCreateManually}
                sx={{ fontWeight: 600, borderColor: 'rgba(180,200,220,0.8)', color: '#2e4a68' }}
              >
                Create Manually
              </Button>
            </Stack>
          </Stack>
        )}

        {isWorking && (
          <Stack direction="row" alignItems="center" spacing={2} sx={{
            p: 2.5, borderRadius: 2,
            border: '1px solid', borderColor: 'divider',
            background: '#f0f4f8',
          }}>
            <CircularProgress size={22} thickness={4} sx={{ color: '#2e4a68' }} />
            <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {workflowState === "formalizing" ? "Generating proof state…" : "Applying move…"}
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

        {(workflowState === "formalized" || workflowState === "applying" || workflowState === "applied") && currentInputState && (
          <Box>
            <Box sx={{
              p: 2.5, borderRadius: 2,
              border: '1px solid', borderColor: 'divider',
              background: 'white',
              mb: 2,
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>
                Input State
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                Make selections below, then apply the move or mark as a non-example.
              </Typography>
              <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
                <TypstContextProvider>
                  <ProofStateWithLibraryResultComponent
                    proofState={currentInputState.proofState}
                    libraryResult={currentInputState.libraryResult}
                  />
                </TypstContextProvider>
              </ProofStateSelectionContext.Provider>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary', fontWeight: 500 }}>
                {selections.length} selection{selections.length !== 1 ? 's' : ''} made
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <ProofStateEditor
                  proofState={currentInputState.proofState}
                  onUpdate={handleUpdateInputProofState}
                />
              </Box>
            </Box>

            {workflowState === "formalized" && (
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={() => handleApplyMove()}
                  disabled={isLoading || !action.trim()}
                  sx={{
                    fontWeight: 700, textTransform: 'none', borderRadius: '20px',
                    color: '#2d5a2a', background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
                    borderColor: '#7ab872', boxShadow: '0 2px 6px rgba(100,155,85,0.18)',
                    transition: 'all 0.2s ease',
                    '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 10px rgba(100,155,85,0.28)', transform: 'translateY(-1px)' },
                    '&:disabled': { opacity: 0.45, boxShadow: 'none', transform: 'none' },
                  }}
                >
                  Apply Move
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSaveExample("non-example")}
                  sx={{ fontWeight: 600, borderColor: 'rgba(180,200,220,0.8)', color: '#2e4a68' }}
                >
                  Mark as Non-example
                </Button>
                <Button
                  variant="text"
                  onClick={handleReset}
                  sx={{ color: 'text.secondary', fontWeight: 500 }}
                >
                  Discard
                </Button>
              </Stack>
            )}
          </Box>
        )}

        {workflowState === "applied" && currentOutputState && (
          <Box sx={{ mt: 2 }}>
            {reasoningTrace && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>
                  Reasoning Trace
                </Typography>
                <TextField
                  value={reasoningTrace}
                  multiline
                  rows={6}
                  fullWidth
                  size="small"
                  slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem', bgcolor: '#f8fafc' } } }}
                />
              </Box>
            )}

            <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', background: 'white', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>
                Output State
              </Typography>
              <ProofStateContextProvider>
                <ProofStateWithLibraryResultComponent
                  proofState={currentOutputState.proofState}
                  libraryResult={currentOutputState.libraryResult}
                />
              </ProofStateContextProvider>
              <Box sx={{ mt: 1.5 }}>
                <ProofStateEditor
                  proofState={currentOutputState.proofState}
                  onUpdate={handleUpdateOutputProofState}
                />
              </Box>
            </Box>

            <TextField
              label="Comment (optional)"
              value={exampleComment}
              onChange={(e) => setExampleComment(e.target.value)}
              placeholder="Add a note about this example…"
              fullWidth size="small"
              sx={{ mb: 2 }}
            />

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => handleSaveExample("example")}
                sx={{
                  fontWeight: 700, textTransform: 'none', borderRadius: '20px',
                  color: '#2d5a2a', background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
                  borderColor: '#7ab872', boxShadow: '0 2px 6px rgba(100,155,85,0.18)',
                  transition: 'all 0.2s ease',
                  '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 10px rgba(100,155,85,0.28)', transform: 'translateY(-1px)' },
                }}
              >
                Save as Example
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSaveExample("non-example")}
                sx={{ fontWeight: 600, borderColor: 'rgba(180,200,220,0.8)', color: '#2e4a68' }}
              >
                Save as Non-example
              </Button>
              <Button
                variant="text"
                onClick={handleReset}
                sx={{ color: 'text.secondary', fontWeight: 500 }}
              >
                Discard
              </Button>
            </Stack>
          </Box>
        )}
      </SectionCard>

      {/* Load Move */}
      <SectionCard title="Load Move">
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Load an existing move definition to edit it — upload a JSON file or paste the JSON directly.
        </Typography>

        <Button
          variant="outlined"
          component="label"
          sx={{ mb: 2, fontWeight: 600, borderColor: 'rgba(180,200,220,0.8)', color: '#2e4a68' }}
        >
          Upload JSON File
          <input type="file" accept=".json" hidden onChange={handleFileLoad} />
        </Button>

        <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, '&::before': { display: 'none' } }}>
          <AccordionSummary
            expandIcon={<ChevronDownIcon />}
            sx={{ px: 2, minHeight: 44, '& .MuiAccordionSummary-content': { my: 0 } }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#558567' }}>
              Or paste JSON here
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2, pt: 0 }}>
            <TextField
              multiline rows={6} fullWidth size="small"
              placeholder="Paste move JSON here…"
              onBlur={(e) => {
                const val = e.target.value.trim()
                if (val) { handleLoadMove(val); e.target.value = "" }
              }}
            />
          </AccordionDetails>
        </Accordion>

        {loadError && <Alert severity="error" sx={{ mt: 2 }}>{loadError}</Alert>}
      </SectionCard>

      {/* Export */}
      <SectionCard title="Export">
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={!moveName || examples.length === 0}
            sx={{
              fontWeight: 700, textTransform: 'none', borderRadius: '20px',
              color: '#2d5a2a', background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
              borderColor: '#7ab872', boxShadow: '0 2px 6px rgba(100,155,85,0.18)',
              transition: 'all 0.2s ease',
              '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 10px rgba(100,155,85,0.28)', transform: 'translateY(-1px)' },
              '&:disabled': { opacity: 0.45, boxShadow: 'none', transform: 'none' },
            }}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            startIcon={copySuccess ? undefined : <CopyIcon />}
            onClick={handleCopyJSON}
            sx={{
              fontWeight: 600,
              borderColor: copySuccess ? '#059669' : 'rgba(180,200,220,0.8)',
              color: copySuccess ? '#059669' : '#2e4a68',
              transition: 'all 0.2s',
            }}
          >
            {copySuccess ? "Copied!" : "Copy JSON"}
          </Button>
        </Stack>

        <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, '&::before': { display: 'none' } }}>
          <AccordionSummary
            expandIcon={<ChevronDownIcon />}
            sx={{ px: 2, minHeight: 44, '& .MuiAccordionSummary-content': { my: 0 } }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#3182ce' }}>
              Preview JSON
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2, pt: 0 }}>
            <Box
              component="pre"
              sx={{
                bgcolor: '#1a202c', color: '#e2e8f0',
                p: 2, borderRadius: 1.5,
                fontSize: '0.75rem', fontFamily: "'Monaco', 'Menlo', monospace",
                lineHeight: 1.6, overflow: 'auto', m: 0,
              }}
            >
              {generateMoveJSON()}
            </Box>
          </AccordionDetails>
        </Accordion>
      </SectionCard>
    </Box>
  )
}
