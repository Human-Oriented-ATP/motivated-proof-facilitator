import React, { JSX, useState, useContext, useReducer, useRef, useEffect, useCallback } from 'react'
import { ProofDiscoveryState, proofDiscoveryStateReducer, isProofComplete, serializeProofDiscoveryState } from '../core/ProofDiscoveryState'
import { ProofStateWithLibraryResult as ProofStateComponent } from './ProofState'
import { ProofDiscoveryState as ProofDiscoveryStateVisualization } from './ProofDiscoveryState'
import { MathStatement } from './MathStatement'
import { ProofStateSelectionContext, ProofStateLocationContext } from '../core/ProofStateSelectionContext'
import { ProofStateIdContext, ProofDiscoveryStateContext } from '../core/ProofDiscoveryStateContext'
import { MovePanel } from './MovePanel'
import { ProofStateEditor } from './ProofStateEditor'
import { StatementBuilder } from './StatementBuilder'
import { Statement } from '../core/ProofStateZod'
import {
  Box, Paper, Button, IconButton, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material'

// ── Inline icon components ────────────────────────────────────────────────────

const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
)

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
)

const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
)

const IconCheck = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const IconChevron = ({ rotated }: { rotated: boolean }) => (
  <svg
    style={{ width: 14, height: 14, transition: 'transform 0.2s', transform: rotated ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
)

const IconFullscreen = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
)

const IconPopout = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
  </svg>
)

const IconDock = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 11a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 15.586V11z" />
  </svg>
)

const LoadingSpinner = () => (
  <svg style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// ── Shared style tokens ───────────────────────────────────────────────────────

/** Base style for the bottom-bar action buttons */
const actionBtnSx = {
  color: '#2e4a68',
  borderColor: '#a8becc',
  borderRadius: '8px',
  fontSize: '0.82rem',
  fontWeight: 500,
  textTransform: 'none' as const,
  background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
  boxShadow: '0 1px 2px rgba(30,60,100,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
  gap: '0.4rem',
  '&:hover': {
    borderColor: '#2c5f8a',
    background: 'linear-gradient(180deg, #eaf3ff 0%, #dbeefb 100%)',
    boxShadow: '0 2px 6px rgba(30,70,130,0.14)',
  },
  '&.Mui-disabled': { opacity: 0.38 },
}

/** Metallic header for Dialogs */
const dialogTitleSx = {
  p: 0,
  '& > div': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    px: 2.5,
    py: 1.5,
    background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
    borderBottom: '1px solid #c0cedb',
  },
}

/** Small icon-button style for graph panel controls */
const graphBtnSx = {
  width: 24,
  height: 24,
  background: 'linear-gradient(180deg, #e8eef5 0%, #d8e2ec 100%)',
  border: '1px solid #b8cad8',
  borderRadius: '5px',
  color: '#3a5070',
  '&:hover': { background: 'linear-gradient(180deg, #daeaf8 0%, #c8ddf0 100%)', borderColor: '#8aabcc' },
}

// ── Component ─────────────────────────────────────────────────────────────────

export type ProofDiscoveryEnvironmentProps = {
  initialProofDiscoveryState: ProofDiscoveryState
}

export function ProofDiscoveryEnvironment({
  initialProofDiscoveryState
}: ProofDiscoveryEnvironmentProps): JSX.Element {
  const [proofDiscoveryState, dispatchProofDiscoveryAction] = useReducer(
    proofDiscoveryStateReducer,
    initialProofDiscoveryState
  )
  const [isGraphPopped, setIsGraphPopped] = useState(false)
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false)
  const [isInformalizePopupOpen, setIsInformalizePopupOpen] = useState(false)
  const [informalizedText, setInformalizedText] = useState("")
  const [isInformalizeLoading, setIsInformalizeLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddLibraryOpen, setIsAddLibraryOpen] = useState(false)
  const [newLibraryLabel, setNewLibraryLabel] = useState('')
  const [newLibraryStatement, setNewLibraryStatement] = useState<Statement>("")
  const [isFinishScreenOpen, setIsFinishScreenOpen] = useState(false)
  const [jsonCopied, setJsonCopied] = useState(false)
  const { selections, dispatch: selectionsDispatch } = useContext(ProofStateSelectionContext)

  // ── Draggable graph state ─────────────────────────────────────────────────
  const [graphPos, setGraphPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 })
  const isDraggingGraph = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const graphContainerRef = useRef<HTMLDivElement | null>(null)

  const handleGraphDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingGraph.current = true
    const rect = graphContainerRef.current?.getBoundingClientRect()
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingGraph.current || !graphContainerRef.current) return
      const rect = graphContainerRef.current.getBoundingClientRect()
      const newRight = window.innerWidth - e.clientX - (rect.width - dragOffset.current.x)
      const newBottom = window.innerHeight - e.clientY - (rect.height - dragOffset.current.y)
      setGraphPos({
        x: Math.max(0, Math.min(newRight, window.innerWidth - rect.width)),
        y: Math.max(0, Math.min(newBottom, window.innerHeight - rect.height)),
      })
    }
    const onUp = () => { isDraggingGraph.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])

  // Auto-detect proof completion
  useEffect(() => {
    if (!proofDiscoveryState.isSolved && isProofComplete(proofDiscoveryState)) {
      dispatchProofDiscoveryAction({ action: 'finish' })
      setIsFinishScreenOpen(true)
    }
  }, [proofDiscoveryState])

  const currentProofState = proofDiscoveryState.graph.getNodeAttribute(
    proofDiscoveryState.currentNodeId,
    'proofState'
  )

  const handleCopyProofState = () => {
    navigator.clipboard.writeText(JSON.stringify(currentProofState, null, 2))
      .then(() => alert('Proof state copied to clipboard!'))
      .catch((err) => { console.error('Failed to copy:', err); alert('Failed to copy to clipboard') })
  }

  const handleClearCurrentSelections = () => {
    selectionsDispatch({
      type: 'CLEAR_PROOF_STATE_SELECTIONS',
      proofStateId: { proofNodeId: proofDiscoveryState.currentNodeId, proofContextId: 0 }
    })
  }

  const handleClearAllSelections = () => {
    selectionsDispatch({ type: 'CLEAR_ALL_SELECTIONS' })
  }

  const handleInformalize = async (): Promise<void> => {
    setIsInformalizeLoading(true)
    try {
      const currentPS = proofDiscoveryState.graph.getNodeAttribute(proofDiscoveryState.currentNodeId, 'proofState')
      const response = await fetch("https://atp-backend-rygt.onrender.com/informalize", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofState: currentPS }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setInformalizedText(data.naturalLanguage || data.text || JSON.stringify(data))
      setIsInformalizePopupOpen(true)
    } catch (err) {
      setInformalizedText(err instanceof Error ? `Failed to informalize: ${err.message}` : "An unknown error occurred")
      setIsInformalizePopupOpen(true)
    } finally {
      setIsInformalizeLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#e8eef5' }}>

      {/* ── Library Statements ── */}
      <Box sx={{
        background: 'linear-gradient(180deg, #fffef5 0%, #fef7e0 100%)',
        borderBottom: '1.5px solid #ddb830',
        px: 2.5,
        py: 0.875,
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Button
            onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
            sx={{
              color: '#7a4f00',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              minWidth: 0,
              px: 0.75,
              py: 0.5,
              gap: 0.75,
              '&:hover': { background: 'rgba(180,110,0,0.09)' },
            }}
          >
            <IconChevron rotated={isLibraryExpanded} />
            Library Statements ({proofDiscoveryState.library.length})
          </Button>
          <IconButton
            onClick={() => { setIsAddLibraryOpen(v => !v); setNewLibraryLabel(''); setNewLibraryStatement('') }}
            size="small"
            title="Add a statement to the library"
            sx={{
              width: 26,
              height: 26,
              borderRadius: '6px',
              border: '1.5px solid #c08800',
              color: '#7a4f00',
              fontSize: '16px',
              background: isAddLibraryOpen
                ? 'linear-gradient(180deg, #fef3b0, #fde68a)'
                : 'linear-gradient(180deg, #fffbea, #fef3c0)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              '&:hover': { background: 'linear-gradient(180deg, #fef3b0, #fde68a)', borderColor: '#a06800' },
            }}
          >
            +
          </IconButton>
        </Box>

        {isAddLibraryOpen && (
          <Paper elevation={0} sx={{
            border: '1.5px solid #fde68a',
            borderRadius: 2,
            p: 2,
            mt: 1,
            mb: 0.5,
            background: 'white',
            boxShadow: '0 2px 8px rgba(180,120,0,0.08)',
          }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#92400e', letterSpacing: '0.06em', flexShrink: 0 }}>LABEL</Typography>
              <input
                type="text"
                value={newLibraryLabel}
                onChange={(e) => setNewLibraryLabel(e.target.value)}
                placeholder="e.g. lemma_1"
                style={{ flex: 1, padding: '5px 10px', border: '1px solid #fde68a', borderRadius: '5px', fontSize: '13px', outline: 'none', background: '#fffef8' }}
              />
            </Box>
            <StatementBuilder value={newLibraryStatement} onChange={setNewLibraryStatement} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Button
                size="small"
                variant="contained"
                disabled={!newLibraryLabel.trim()}
                onClick={() => {
                  if (!newLibraryLabel.trim()) return
                  dispatchProofDiscoveryAction({ action: 'addToLibrary', statement: { label: newLibraryLabel.trim(), statement: newLibraryStatement } })
                  setIsAddLibraryOpen(false)
                  setNewLibraryLabel('')
                  setNewLibraryStatement('')
                  setIsLibraryExpanded(true)
                }}
                sx={{ background: 'linear-gradient(180deg, #b07800, #8a5c00)', '&:hover': { background: 'linear-gradient(180deg, #8a5c00, #6a4600)' }, fontSize: '12px', fontWeight: 700, textTransform: 'none', boxShadow: '0 1px 3px rgba(100,60,0,0.25)' }}
              >
                Add to Library
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setIsAddLibraryOpen(false)}
                sx={{ color: '#92400e', borderColor: '#fbc97a', fontSize: '12px', textTransform: 'none', '&:hover': { borderColor: '#d97706', background: '#fff8e8' } }}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        )}

        {isLibraryExpanded && proofDiscoveryState.library.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: '180px', overflowY: 'auto', mt: 1, pr: 0.5 }}>
            {proofDiscoveryState.library.map((statement, idx) => {
              const isActive = proofDiscoveryState.highlightedLibraryStatement === idx
              return (
                <Paper
                  key={idx}
                  elevation={0}
                  onClick={() => {
                    if (isActive) {
                      dispatchProofDiscoveryAction({ action: 'clearHighlightedStatement' })
                    } else {
                      dispatchProofDiscoveryAction({ action: 'setHighlightedStatement', index: idx })
                    }
                  }}
                  sx={{
                    px: 2,
                    py: 1.25,
                    border: isActive ? '2px solid #84cc16' : '1.5px solid #f5d060',
                    background: isActive
                      ? 'linear-gradient(135deg, #ecfccb, #d9f99d)'
                      : 'linear-gradient(135deg, #fffef0, #fefce8)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    boxShadow: isActive
                      ? '0 3px 12px rgba(132,204,22,0.28)'
                      : '0 1px 3px rgba(180,120,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8)',
                    '&:hover': { boxShadow: '0 3px 10px rgba(180,120,0,0.15)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box component="span" sx={{ color: '#a16207', fontSize: '14px', fontWeight: 'bold', flexShrink: 0, userSelect: 'none' }}>★</Box>
                    <Box sx={{ flex: 1 }}>
                      <ProofStateLocationContext.Provider value={{ kind: 'library_statement', label: statement.label }}>
                        <MathStatement address={[]} statement={statement.statement} polarity={null} />
                      </ProofStateLocationContext.Provider>
                    </Box>
                    <Chip
                      label={statement.label}
                      size="small"
                      variant="outlined"
                      sx={{
                        background: '#fefce8',
                        border: '1px solid #d4a017',
                        color: '#8a5c00',
                        fontSize: '11px',
                        height: 22,
                        userSelect: 'none',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Paper>
              )
            })}
          </Box>
        )}
      </Box>

      {/* ── Main Content ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Proof State Panel */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
          {proofDiscoveryState.isSolved && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
              <Chip
                icon={<span style={{ display: 'flex', color: '#10b981' }}><IconCheck size={16} /></span>}
                label="Solved!"
                sx={{
                  background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                  border: '2px solid #10b981',
                  color: '#065f46',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  height: 32,
                  px: 0.5,
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                }}
              />
            </Box>
          )}
          <Paper elevation={0} sx={{
            flex: 1,
            p: 3,
            borderRadius: '14px',
            background: 'linear-gradient(175deg, #ffffff 0%, #f5f8fb 100%)',
            border: '1px solid #b8ccda',
            boxShadow: '0 3px 14px rgba(30,60,100,0.09), 0 1px 3px rgba(30,60,100,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
            overflow: 'auto',
            minHeight: 0,
          }}>
            <ProofStateIdContext.Provider
              value={{ proofNodeId: proofDiscoveryState.currentNodeId, proofContextId: 0 }}
            >
              <ProofStateComponent
                proofState={currentProofState}
                libraryResult={
                  proofDiscoveryState.highlightedLibraryStatement !== undefined
                    ? proofDiscoveryState.library[proofDiscoveryState.highlightedLibraryStatement]
                    : undefined
                }
              />
            </ProofStateIdContext.Provider>
          </Paper>
        </Box>

        {/* Right Column: Move Panel + Graph */}
        <Box sx={{
          width: '340px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #b8ccda',
          background: 'linear-gradient(180deg, #f0f4f8 0%, #e8eef5 100%)',
          overflow: 'hidden',
        }}>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
              <MovePanel />
            </ProofDiscoveryStateContext.Provider>
          </Box>

          {/* Embedded Graph */}
          {!isGraphPopped ? (
            <Box sx={{ height: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid #b8ccda', overflow: 'hidden' }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 1.5,
                py: 0.625,
                background: 'linear-gradient(180deg, #e8eef5 0%, #dde5f0 100%)',
                borderBottom: '1px solid #b8ccda',
                flexShrink: 0,
              }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#3a5678', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Proof Graph
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Fullscreen view">
                    <IconButton size="small" onClick={() => setIsGraphFullscreen(true)} sx={graphBtnSx}>
                      <IconFullscreen />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Pop out to floating window">
                    <IconButton size="small" onClick={() => setIsGraphPopped(true)} sx={graphBtnSx}>
                      <IconPopout />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden', background: '#f2f6fa' }}>
                <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
                  <ProofDiscoveryStateVisualization proofDiscoveryState={proofDiscoveryState} />
                </ProofDiscoveryStateContext.Provider>
              </Box>
            </Box>
          ) : (
            <Box sx={{
              height: 220,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: '1px solid #b8ccda',
              background: 'linear-gradient(180deg, #e8eef5, #dde5f0)',
            }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconDock />}
                onClick={() => setIsGraphPopped(false)}
                sx={{ ...actionBtnSx, borderColor: '#6a96ba', color: '#2e5070' }}
              >
                Dock Graph
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Bottom Action Bar ── */}
      <Paper elevation={0} sx={{
        display: 'flex',
        flexShrink: 0,
        borderTop: '1px solid #b8ccda',
        borderRadius: 0,
        background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
        mr: '340px',
        boxShadow: '0 -2px 8px rgba(30,60,100,0.07)',
      }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', px: 3, py: 1.25, gap: 1.25, flexWrap: 'wrap' }}>
          <Tooltip title="Copy current proof state to clipboard">
            <Button variant="outlined" size="small" startIcon={<IconCopy />} onClick={handleCopyProofState} sx={actionBtnSx}>
              Copy Proof State
            </Button>
          </Tooltip>

          <Tooltip title="Clear selections in current proof state">
            <span>
              <Button variant="outlined" size="small" startIcon={<IconX />} onClick={handleClearCurrentSelections} disabled={selections.length === 0} sx={actionBtnSx}>
                Clear Current
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Clear all selections across all proof states">
            <span>
              <Button variant="outlined" size="small" startIcon={<IconTrash />} onClick={handleClearAllSelections} disabled={selections.length === 0} sx={actionBtnSx}>
                Clear All
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Edit the current proof state">
            <Button variant="outlined" size="small" startIcon={<IconEdit />} onClick={() => setIsEditModalOpen(true)} sx={actionBtnSx}>
              Edit
            </Button>
          </Tooltip>

          <Tooltip title="Convert current proof state to natural language">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={isInformalizeLoading ? <LoadingSpinner /> : <IconInfo />}
                onClick={handleInformalize}
                disabled={isInformalizeLoading}
                sx={{
                  ...actionBtnSx,
                  color: '#5c4a8a',
                  borderColor: '#9a84c8',
                  '&:hover': { borderColor: '#5c4a8a', background: 'linear-gradient(180deg, #f2eeff 0%, #e8ddf8 100%)' },
                }}
              >
                {isInformalizeLoading ? 'Informalizing…' : 'Informalize'}
              </Button>
            </span>
          </Tooltip>

          {selections.length > 0 && (
            <Chip
              label={`${selections.length} selection${selections.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #dbeafe, #c3d8f8)',
                border: '1px solid #7aaad8',
                color: '#1a3a6e',
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 26,
                boxShadow: '0 1px 3px rgba(30,70,160,0.12)',
              }}
            />
          )}
        </Box>
      </Paper>

      {/* ── Floating Proof Graph ── */}
      {isGraphPopped && (
        <Paper
          ref={graphContainerRef}
          elevation={8}
          sx={{
            position: 'fixed',
            width: '380px',
            height: '300px',
            right: graphPos.x,
            bottom: graphPos.y,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 500,
            resize: 'both',
            border: '1px solid #a8c0d4',
            boxShadow: '0 10px 40px rgba(30,60,110,0.20), 0 2px 8px rgba(30,60,110,0.12)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 1.5,
              py: 0.75,
              background: 'linear-gradient(180deg, #edf2f8 0%, #e2eaf4 100%)',
              borderBottom: '1px solid #b8ccda',
              cursor: 'grab',
              flexShrink: 0,
            }}
            onMouseDown={handleGraphDragStart}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#2e4a68', letterSpacing: '0.06em' }}>Proof Graph</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Fullscreen view">
                <IconButton size="small" onClick={() => setIsGraphFullscreen(true)} sx={graphBtnSx}>
                  <IconFullscreen />
                </IconButton>
              </Tooltip>
              <Tooltip title="Dock back">
                <IconButton size="small" onClick={() => setIsGraphPopped(false)} sx={graphBtnSx}>
                  <Typography sx={{ fontSize: '11px', lineHeight: 1, fontWeight: 700 }}>✕</Typography>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', background: '#f2f6fa' }}>
            <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
              <ProofDiscoveryStateVisualization proofDiscoveryState={proofDiscoveryState} />
            </ProofDiscoveryStateContext.Provider>
          </Box>
        </Paper>
      )}

      {/* ── Fullscreen Graph Dialog ── */}
      <Dialog
        open={isGraphFullscreen}
        onClose={() => setIsGraphFullscreen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '95vw',
            height: '95vh',
            maxWidth: '95vw',
            maxHeight: '95vh',
            borderRadius: '14px',
            border: '1px solid #b8ccda',
            background: '#f2f6fa',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={dialogTitleSx}>
          <Box>
            <Typography fontWeight={700} fontSize="1.1rem" color="#1e2a38">Proof Discovery Graph</Typography>
            <IconButton onClick={() => setIsGraphFullscreen(false)} size="small" sx={{ color: '#5a6a7a', '&:hover': { color: '#1e2a38' } }}>
              <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>✕</Typography>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, flex: 1, overflow: 'hidden' }}>
          <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
            <ProofDiscoveryStateVisualization proofDiscoveryState={proofDiscoveryState} />
          </ProofDiscoveryStateContext.Provider>
        </DialogContent>
      </Dialog>

      {/* ── Edit Proof State Dialog ── */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: '1px solid #b8ccda' } }}
      >
        <DialogTitle sx={dialogTitleSx}>
          <Box>
            <Typography fontWeight={700} fontSize="1.05rem" color="#1e2a38">Edit Proof State</Typography>
            <IconButton onClick={() => setIsEditModalOpen(false)} size="small" sx={{ color: '#5a6a7a', '&:hover': { color: '#1e2a38' } }}>
              <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>✕</Typography>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, maxHeight: '75vh', overflowY: 'auto' }}>
          <ProofStateEditor
            proofState={currentProofState}
            onUpdate={(newState) => {
              dispatchProofDiscoveryAction({
                action: 'repair',
                nodeId: proofDiscoveryState.currentNodeId,
                newProofState: newState,
              })
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Informalize Dialog ── */}
      <Dialog
        open={isInformalizePopupOpen}
        onClose={() => setIsInformalizePopupOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: '1px solid #b8ccda' } }}
      >
        <DialogTitle sx={dialogTitleSx}>
          <Box>
            <Typography fontWeight={700} fontSize="1.05rem" color="#1e2a38">Natural Language Translation</Typography>
            <IconButton onClick={() => setIsInformalizePopupOpen(false)} size="small" sx={{ color: '#5a6a7a', '&:hover': { color: '#1e2a38' } }}>
              <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>✕</Typography>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: 1.6, color: '#2d3748' }}>
            {informalizedText}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #c0cedb', px: 2.5, py: 1.25 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsInformalizePopupOpen(false)}
            sx={actionBtnSx}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Finish Screen Dialog ── */}
      <Dialog
        open={isFinishScreenOpen && proofDiscoveryState.isSolved}
        onClose={() => setIsFinishScreenOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '95vw',
            height: '90vh',
            maxWidth: '95vw',
            maxHeight: '90vh',
            borderRadius: '16px',
            border: '1.5px solid #86efac',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            borderBottom: '2px solid #10b981',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#065f46' }}>
              <Box sx={{ display: 'flex', color: '#10b981' }}><IconCheck size={30} /></Box>
              <Typography fontWeight={700} fontSize="1.75rem" color="#065f46">Proof Complete!</Typography>
            </Box>
            <IconButton onClick={() => setIsFinishScreenOpen(false)} sx={{ color: '#065f46', '&:hover': { background: 'rgba(6,95,70,0.1)' } }}>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>✕</Typography>
            </IconButton>
          </Box>
          <Box sx={{ px: 3, py: 1.25, background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
            <Typography sx={{ fontSize: '1rem', color: '#166534', fontStyle: 'italic' }}>
              {proofDiscoveryState.statement}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ flex: 1, p: 1.5, overflow: 'hidden', background: '#f2f6fa' }}>
          <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
            <ProofDiscoveryStateVisualization proofDiscoveryState={proofDiscoveryState} />
          </ProofDiscoveryStateContext.Provider>
        </DialogContent>
        <DialogActions sx={{
          borderTop: '1px solid #c0cedb',
          background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
          px: 3,
          py: 1.5,
          justifyContent: 'center',
          gap: 1.5,
        }}>
          <Button
            variant="outlined"
            startIcon={<IconCopy />}
            onClick={() => {
              const json = JSON.stringify(serializeProofDiscoveryState(proofDiscoveryState), null, 2)
              navigator.clipboard.writeText(json).then(() => {
                setJsonCopied(true)
                setTimeout(() => setJsonCopied(false), 2000)
              })
            }}
            sx={{
              color: '#1e40af',
              borderColor: '#60a5fa',
              background: 'linear-gradient(180deg, #dbeafe, #bfdbfe)',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { background: 'linear-gradient(180deg, #bfdbfe, #a3c8fc)', borderColor: '#3b82f6' },
            }}
          >
            {jsonCopied ? 'Copied!' : 'Copy Proof JSON'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setIsFinishScreenOpen(false)}
            sx={{
              color: '#065f46',
              borderColor: '#34d399',
              background: 'linear-gradient(180deg, #d1fae5, #a7f3d0)',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { background: 'linear-gradient(180deg, #a7f3d0, #6ee7b7)', borderColor: '#10b981' },
            }}
          >
            Continue Exploring
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
