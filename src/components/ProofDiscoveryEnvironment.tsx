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
import { Statement, StatementSchema } from '../core/ProofStateZod'
import {
  Box, Paper, Button, IconButton, Chip, Typography, TextField,
  Dialog, DialogContent, DialogActions, Tooltip,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { formalizeStatement } from '../fetchers/formalize-statement'
import { informalizeProofState } from '../fetchers/informalize'

// Local theme for the library "add" form — matches the amber/yellow panel colours
const libraryTheme = createTheme({
  palette: {
    primary: {
      main: '#ca8a04',
      light: '#fde047',
      dark: '#a16207',
      contrastText: '#ffffff',
    },
  },
})

// ── Inline icons ──────────────────────────────────────────────────────────────

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
)
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
)
const IconInfo = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
)
const IconCheck = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)
const IconChevron = ({ rotated }: { rotated: boolean }) => (
  <svg style={{ width: 13, height: 13, flexShrink: 0, transition: 'transform 0.2s', transform: rotated ? 'rotate(90deg)' : 'rotate(0deg)' }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
)
const IconFullscreen = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
)
const LoadingSpinner = () => (
  <svg style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// ── Design tokens ─────────────────────────────────────────────────────────────

/** Shared sx for bottom-pill action buttons */
const actionBtnSx = {
  color: '#2e4a68',
  borderColor: 'rgba(180,200,220,0.8)',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'none' as const,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,248,252,0.95) 100%)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 4px 12px rgba(30,60,110,0.1), 0 1px 3px rgba(30,60,110,0.05)',
  gap: '0.4rem',
  py: 0.75,
  px: 1.5,
  minHeight: 0,
  lineHeight: 1.4,
  '&:hover': {
    borderColor: '#8ba7c4',
    background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(235,242,250,1) 100%)',
    boxShadow: '0 6px 16px rgba(30,70,130,0.15)',
    transform: 'translateY(-1px)'
  },
  transition: 'all 0.2s ease',
  '&.Mui-disabled': { opacity: 0.4 },
}

/** Sx for the small icon buttons in the floating graph header */
const graphBtnSx = {
  width: 22,
  height: 22,
  background: 'rgba(255,255,255,0.5)',
  border: '1px solid rgba(180,200,220,0.6)',
  borderRadius: '4px',
  color: '#3a5070',
  '&:hover': { background: 'rgba(255,255,255,0.9)', borderColor: '#8aabcc' },
}

/** Sx for Dialog paper in MUI v7 (via slotProps) */
const modalPaperSx = { borderRadius: '14px', border: '1px solid #b8ccda' }

/** Metallic Dialog title bar */
const DialogHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <Box sx={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    px: 2.5, py: 1.5,
    background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
    borderBottom: '1px solid #c0cedb',
    flexShrink: 0,
  }}>
    <Typography fontWeight={700} fontSize="1.05rem" color="#1e2a38">{title}</Typography>
    <IconButton onClick={onClose} size="small" sx={{ color: '#6a7a8a', '&:hover': { color: '#1e2a38' } }}>
      <IconX />
    </IconButton>
  </Box>
)

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
  const [isGraphExpanded, setIsGraphExpanded] = useState(true)
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false)
  const [isInformalizePopupOpen, setIsInformalizePopupOpen] = useState(false)
  const [informalizedText, setInformalizedText] = useState("")
  const [isInformalizeLoading, setIsInformalizeLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddLibraryOpen, setIsAddLibraryOpen] = useState(false)
  const [newLibraryLabel, setNewLibraryLabel] = useState('')
  const [newLibraryStatement, setNewLibraryStatement] = useState<Statement>("")
  const [newLibraryFormalizeMode, setNewLibraryFormalizeMode] = useState<"build" | "formalize">("build")
  const [newLibraryText, setNewLibraryText] = useState("")
  const [newLibraryLoading, setNewLibraryLoading] = useState(false)
  const [newLibraryError, setNewLibraryError] = useState<string | null>(null)
  const [isFinishScreenOpen, setIsFinishScreenOpen] = useState(false)
  const [jsonCopied, setJsonCopied] = useState(false)
  const { selections, dispatch: selectionsDispatch } = useContext(ProofStateSelectionContext)

  useEffect(() => {
    if (!proofDiscoveryState.isSolved && isProofComplete(proofDiscoveryState)) {
      dispatchProofDiscoveryAction({ action: 'finish' })
      setIsFinishScreenOpen(true)
    }
  }, [proofDiscoveryState])

  const currentProofState = proofDiscoveryState.graph.getNodeAttribute(proofDiscoveryState.currentNodeId, 'proofState')

  const handleCopyProofState = () => {
    navigator.clipboard.writeText(JSON.stringify(currentProofState, null, 2))
      .then(() => alert('Proof state copied to clipboard!'))
      .catch(() => alert('Failed to copy to clipboard'))
  }
  const handleClearCurrentSelections = () => selectionsDispatch({
    type: 'CLEAR_PROOF_STATE_SELECTIONS',
    proofStateId: { proofNodeId: proofDiscoveryState.currentNodeId, proofContextId: 0 }
  })
  const handleClearAllSelections = () => selectionsDispatch({ type: 'CLEAR_ALL_SELECTIONS' })

  const handleInformalize = async (): Promise<void> => {
    setIsInformalizeLoading(true)
    try {
      const currentPS = proofDiscoveryState.graph.getNodeAttribute(proofDiscoveryState.currentNodeId, 'proofState')
      const description = await informalizeProofState(currentPS)
      setInformalizedText(description)
    } catch (err) {
      setInformalizedText(err instanceof Error ? `Failed to informalize: ${err.message}` : "An unknown error occurred")
    } finally {
      setIsInformalizeLoading(false)
      setIsInformalizePopupOpen(true)
    }
  }

  const formalizeLibraryStatement = async (): Promise<void> => {
    if (!newLibraryText.trim()) return
    setNewLibraryLoading(true)
    setNewLibraryError(null)
    try {
      const stmt = await formalizeStatement({ statement: newLibraryText.trim() })
      
      dispatchProofDiscoveryAction({ action: 'addToLibrary', statement: { label: newLibraryLabel.trim(), statement: stmt } })
      setIsAddLibraryOpen(false); setNewLibraryLabel(''); setNewLibraryStatement(''); setNewLibraryText(''); setIsLibraryExpanded(true)
    } catch (err) {
      setNewLibraryError(err instanceof Error ? err.message : "Failed to formalize")
    } finally {
      setNewLibraryLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, p: 1, height: '100%', background: '#f4f7f9', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ════════════════════ LEFT COLUMN (Fused) ════════════════════ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, borderRadius: '12px', background: '#ffffff', border: '1px solid #d4dde6', boxShadow: '0 2px 12px rgba(30,60,100,0.04)', position: 'relative', overflow: 'hidden' }}>

        {/* ════════════════════ LIBRARY BAR ════════════════════ */}
        <Box sx={{
          flexShrink: 0,
          background: '#fefce8',
          borderBottom: '1px solid #fde047',
          position: 'relative',
          zIndex: 30,
        }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, height: '44px', gap: 1, boxSizing: 'border-box' }}>
            {/* Library label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#a16207' }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a16207' }}>
                Library
              </Typography>
            </Box>

            {/* Count badge */}
            <Chip
              label={proofDiscoveryState.library.length}
              size="small"
              sx={{ height: 18, minWidth: 24, fontSize: '11px', fontWeight: 700, background: '#fef9c3', color: '#a16207', border: '1px solid #fde047', borderRadius: '9px', '& .MuiChip-label': { px: '6px' } }}
            />

            {/* Divider */}
            <Box sx={{ width: '1px', height: 14, background: '#fde047', mx: 0.25 }} />

            {/* Show/hide toggle */}
            <Button
              onClick={() => setIsLibraryExpanded(v => !v)}
              size="small"
              endIcon={<IconChevron rotated={isLibraryExpanded} />}
              sx={{
                color: '#a16207', fontSize: '0.73rem', fontWeight: 600, textTransform: 'none',
                px: 0.75, py: 0.25, minHeight: 0, gap: 0.5,
                '&:hover': { background: '#fef9c3' },
              }}
            >
              {isLibraryExpanded ? 'Hide' : 'Show statements'}
            </Button>

            <Box sx={{ flex: 1 }} />

            {/* Add button */}
            <Tooltip title="Add a statement to the library">
              <IconButton
                onClick={() => { setIsAddLibraryOpen(v => !v); setNewLibraryLabel(''); setNewLibraryStatement('') }}
                size="small"
                sx={{
                  width: 24, height: 24, borderRadius: '6px',
                  border: isAddLibraryOpen ? '1px solid #fde047' : '1px solid transparent',
                  color: '#a16207', fontSize: '15px', fontWeight: 700,
                  background: isAddLibraryOpen ? '#fefce8' : 'transparent',
                  '&:hover': { background: '#fefce8', borderColor: '#fde047' }
                }}
              >
                +
              </IconButton>
            </Tooltip>
          </Box>

        {/* Add form */}
        {isAddLibraryOpen && (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Paper elevation={0} sx={{ border: '1px solid #fde047', borderRadius: '10px', p: 2, background: 'white', boxShadow: 'inset 0 1px 3px rgba(161,98,7,0.05)' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#a16207', letterSpacing: '0.08em', flexShrink: 0, textTransform: 'uppercase' }}>Label</Typography>
                <input
                  type="text"
                  value={newLibraryLabel}
                  onChange={e => setNewLibraryLabel(e.target.value)}
                  placeholder="e.g. lemma_1"
                  style={{ flex: 1, padding: '4px 9px', border: '1px solid #fde047', borderRadius: '5px', fontSize: '13px', outline: 'none', background: '#fefce8', fontFamily: 'inherit', color: '#1e293b' }}
                />
              </Box>

              <ThemeProvider theme={libraryTheme}>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1.5, borderBottom: '1px solid #fef9c3' }}>
                  <Button size="small" variant="text" onClick={() => setNewLibraryFormalizeMode('build')} sx={{ fontSize: '11px', minWidth: 0, px: 1, py: 0.5, color: newLibraryFormalizeMode === 'build' ? 'primary.dark' : 'primary.main', fontWeight: newLibraryFormalizeMode === 'build' ? 700 : 500, borderBottom: newLibraryFormalizeMode === 'build' ? '2px solid' : 'none', borderColor: 'primary.main', borderRadius: 0, textTransform: 'none' }}>Build manually</Button>
                  <Button size="small" variant="text" onClick={() => setNewLibraryFormalizeMode('formalize')} sx={{ fontSize: '11px', minWidth: 0, px: 1, py: 0.5, color: newLibraryFormalizeMode === 'formalize' ? 'primary.dark' : 'primary.main', fontWeight: newLibraryFormalizeMode === 'formalize' ? 700 : 500, borderBottom: newLibraryFormalizeMode === 'formalize' ? '2px solid' : 'none', borderColor: 'primary.main', borderRadius: 0, textTransform: 'none' }}>Autoformalize</Button>
                </Box>

                {newLibraryFormalizeMode === 'build' ? (
                  <StatementBuilder value={newLibraryStatement} onChange={setNewLibraryStatement} />
                ) : (
                  <Box>
                    <TextField
                      size="small" fullWidth multiline minRows={2}
                      value={newLibraryText}
                      onChange={e => setNewLibraryText(e.target.value)}
                      placeholder="Enter mathematical statement in natural language..."
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.6875rem', py: '3px', px: '8px' },
                        '& .MuiOutlinedInput-root': { fontSize: '0.6875rem' },
                      }}
                    />
                    {newLibraryError && (
                      <Typography sx={{ color: 'error.main', fontSize: '10px', mt: 0.5 }}>{newLibraryError}</Typography>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                  {newLibraryFormalizeMode === 'build' ? (
                    <Button
                      size="small" variant="contained" color="primary"
                      disabled={!newLibraryLabel.trim()}
                      onClick={() => {
                        if (!newLibraryLabel.trim()) return
                        dispatchProofDiscoveryAction({ action: 'addToLibrary', statement: { label: newLibraryLabel.trim(), statement: newLibraryStatement } })
                        setIsAddLibraryOpen(false); setNewLibraryLabel(''); setNewLibraryStatement(''); setIsLibraryExpanded(true)
                      }}
                      sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' }, fontSize: '12px', fontWeight: 600, textTransform: 'none' }}
                    >
                      Add to Library
                    </Button>
                  ) : (
                    <Button
                      size="small" variant="contained" color="primary"
                      disabled={!newLibraryLabel.trim() || !newLibraryText.trim() || newLibraryLoading}
                      onClick={formalizeLibraryStatement}
                      sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' }, fontSize: '12px', fontWeight: 600, textTransform: 'none' }}
                    >
                      {newLibraryLoading ? 'Formalizing...' : 'Formalize and add to library'}
                    </Button>
                  )}
                  <Button size="small" variant="outlined" color="primary"
                    onClick={() => setIsAddLibraryOpen(false)}
                    sx={{ fontSize: '12px', textTransform: 'none' }}>
                    Cancel
                  </Button>
                </Box>
              </ThemeProvider>
            </Paper>
          </Box>
        )}

        {/* Library items */}
        {isLibraryExpanded && proofDiscoveryState.library.length > 0 && (
          <Box sx={{ 
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40,
            background: 'white', borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
            px: 2, py: 1.25, display: 'flex', flexDirection: 'column', gap: 0.625, maxHeight: 280, overflowY: 'auto' 
          }}>
            {proofDiscoveryState.library.map((statement, idx) => {
              const active = proofDiscoveryState.highlightedLibraryStatement === idx
              return (
                <Paper key={idx} elevation={0}
                  onClick={() => {
                    dispatchProofDiscoveryAction(active ? { action: 'clearHighlightedStatement' } : { action: 'setHighlightedStatement', index: idx })
                    setIsLibraryExpanded(false)
                  }}
                  sx={{
                    px: 1.5, py: 1,
                    border: '1px solid',
                    borderColor: active ? '#fde047' : 'transparent',
                    background: active ? '#fefce8' : 'white',
                    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                    '&:hover': { borderColor: '#fde047', background: '#fefce8' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box component="span" sx={{ color: '#a16207', fontSize: '14px', flexShrink: 0, userSelect: 'none' }}>★</Box>
                    <Box sx={{ flex: 1 }}>
                      <ProofStateLocationContext.Provider value={{ kind: 'library_statement', label: statement.label }}>
                        <MathStatement address={[]} statement={statement.statement} polarity={null} />
                      </ProofStateLocationContext.Provider>
                    </Box>
                    <Box sx={{ 
                        backgroundColor: active ? '#fef9c3' : '#fefce8', 
                        border: '1px solid #eab308', 
                        color: '#a16207', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        whiteSpace: 'nowrap', 
                        userSelect: 'none' 
                    }}>
                      {statement.label}
                    </Box>
                  </Box>
                </Paper>
              )
            })}
          </Box>
        )}
        </Box>

      {/* ════════════════════ PROOF STATE AREA ════════════════════ */}
      <Box sx={{ 
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', 
        overflow: 'hidden', background: 'transparent'
      }}>

        {/* Scrollable proof state content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3, pb: '76px' }}>
          {proofDiscoveryState.isSolved && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
              <Chip
                icon={<Box sx={{ display: 'flex', color: '#10b981', ml: 0.5 }}><IconCheck size={15} /></Box>}
                label="Solved!"
                sx={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '2px solid #10b981', color: '#065f46', fontWeight: 700, fontSize: '0.88rem', height: 30, boxShadow: '0 2px 8px rgba(16,185,129,0.22)' }}
              />
            </Box>
          )}
          <Box sx={{ overflow: 'visible' }}>
            <ProofStateIdContext.Provider value={{ proofNodeId: proofDiscoveryState.currentNodeId, proofContextId: 0 }}>
                <ProofStateComponent
                  proofState={currentProofState}
                  libraryResult={proofDiscoveryState.highlightedLibraryStatement !== undefined
                    ? proofDiscoveryState.library[proofDiscoveryState.highlightedLibraryStatement]
                    : undefined}
                />
              </ProofStateIdContext.Provider>
            </Box>
          </Box>

          {/* ── Floating action buttons (separated) ── */}
          <Box
            sx={{
              position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20, display: 'flex', alignItems: 'center', gap: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            <Tooltip title="Copy current proof state to clipboard">
              <Button variant="outlined" size="small" startIcon={<IconCopy />} onClick={handleCopyProofState} sx={actionBtnSx}>
                Copy
              </Button>
            </Tooltip>

            <Tooltip title="Clear selections in current proof state">
              <span>
                <Button variant="outlined" size="small" startIcon={<IconX />} onClick={handleClearCurrentSelections} disabled={selections.length === 0} sx={actionBtnSx}>
                  Clear
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
                  variant="outlined" size="small"
                  startIcon={isInformalizeLoading ? <LoadingSpinner /> : <IconInfo />}
                  onClick={handleInformalize}
                  disabled={isInformalizeLoading}
                  sx={{ ...actionBtnSx, color: '#5c4a8a', borderColor: '#9a84c8', '&:hover': { borderColor: '#5c4a8a', background: 'rgba(242,238,255,0.98)' } }}
                >
                  {isInformalizeLoading ? 'Informalizing…' : 'Informalize'}
                </Button>
              </span>
            </Tooltip>

            {selections.length > 0 && (
              <Chip
                label={`${selections.length} sel.`}
                size="small"
                sx={{ background: 'linear-gradient(135deg,#dbeafe,#c3d8f8)', border: '1px solid #7aaad8', color: '#1a3a6e', fontWeight: 700, fontSize: '0.75rem', height: 32, borderRadius: '16px', boxShadow: '0 4px 12px rgba(30,60,110,0.1)' }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* ════════════════════ RIGHT COLUMN (Move Panel + Graph) ════════════════════ */}
      <Box sx={{
        width: '400px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        gap: 1,
        overflow: 'hidden',
      }}>
        {/* Move Panel Container */}
        <Box sx={{
          flex: 1, display: 'flex', flexDirection: 'column',
          borderRadius: '12px', background: '#ffffff',
          border: '1px solid #d4dde6', boxShadow: '0 2px 12px rgba(30,60,100,0.04)',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
              <MovePanel />
            </ProofDiscoveryStateContext.Provider>
          </Box>
        </Box>

        {/* Graph Box (Docked inside right column) */}
        <Box sx={{
          height: isGraphExpanded ? '300px' : '44px',
          flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRadius: '12px', background: '#ffffff',
          border: '1px solid #d4dde6', boxShadow: '0 2px 12px rgba(30,60,100,0.04)',
          boxSizing: 'border-box',
          overflow: 'hidden', transition: 'height 0.3s ease',
        }}>
           {/* ════════════════════ GRAPH HEADER ════════════════════ */}
           <Box
             sx={{
               display: 'flex', justifyContent: 'space-between', alignItems: 'center',
               px: 2, height: '44px', boxSizing: 'border-box',
               background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
               borderBottom: isGraphExpanded ? '1px solid #c0cedb' : 'none',
               userSelect: 'none', flexShrink: 0, cursor: 'pointer',
               transition: 'all 0.2s ease',
               '&:hover': { background: '#edf2f7' }
             }}
             onClick={() => setIsGraphExpanded(v => !v)}
           >
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#2e4a68', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                 Proof Graph
               </Typography>
             </Box>
             <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
               <Tooltip title="Fullscreen">
                 <IconButton size="small" onClick={() => setIsGraphFullscreen(true)} sx={graphBtnSx}>
                   <IconFullscreen />
                 </IconButton>
               </Tooltip>
               <Tooltip title={isGraphExpanded ? 'Collapse' : 'Expand'}>
                 <IconButton size="small" onClick={() => setIsGraphExpanded(v => !v)} sx={graphBtnSx}>
                   <IconChevron rotated={isGraphExpanded} />
                 </IconButton>
               </Tooltip>
             </Box>
           </Box>
          
           {/* ════════════════════ GRAPH BODY ════════════════════ */}
           {isGraphExpanded && (
             <Box sx={{ flex: 1, overflow: 'hidden', background: '#f8fafc' }}>
               <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
                 <ProofDiscoveryStateVisualization proofDiscoveryState={proofDiscoveryState} />
               </ProofDiscoveryStateContext.Provider>
             </Box>
           )}
        </Box>
      </Box>

      {/* ════════════════════ DIALOGS ════════════════════ */}

      {/* Fullscreen graph */}
      <Dialog open={isGraphFullscreen} onClose={() => setIsGraphFullscreen(false)} maxWidth={false}
        slotProps={{ paper: { sx: { width: '95vw', height: '95vh', maxWidth: '95vw', maxHeight: '95vh', borderRadius: '14px', border: '1px solid #b8ccda', background: '#f2f6fa', display: 'flex', flexDirection: 'column', overflow: 'hidden' } } }}>
        <DialogHeader title="Proof Discovery Graph" onClose={() => setIsGraphFullscreen(false)} />
        <DialogContent sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
          <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
            <ProofDiscoveryStateVisualization proofDiscoveryState={proofDiscoveryState} />
          </ProofDiscoveryStateContext.Provider>
        </DialogContent>
      </Dialog>

      {/* Edit proof state */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: modalPaperSx } }}>
        <DialogHeader title="Edit Proof State" onClose={() => setIsEditModalOpen(false)} />
        <DialogContent sx={{ p: 2.5, maxHeight: '72vh', overflowY: 'auto' }}>
          <ProofStateEditor
            proofState={currentProofState}
            onUpdate={(newState) => dispatchProofDiscoveryAction({ action: 'repair', nodeId: proofDiscoveryState.currentNodeId, newProofState: newState })}
          />
        </DialogContent>
      </Dialog>

      {/* Informalize */}
      <Dialog open={isInformalizePopupOpen} onClose={() => setIsInformalizePopupOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: modalPaperSx } }}>
        <DialogHeader title="Natural Language Translation" onClose={() => setIsInformalizePopupOpen(false)} />
        <DialogContent sx={{ p: 2.5 }}>
          <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: 1.65, color: '#2d3748' }}>
            {informalizedText}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #c0cedb', px: 2.5, py: 1.25 }}>
          <Button variant="outlined" size="small" onClick={() => setIsInformalizePopupOpen(false)} sx={actionBtnSx}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Proof complete */}
      <Dialog open={isFinishScreenOpen && proofDiscoveryState.isSolved} onClose={() => setIsFinishScreenOpen(false)} maxWidth={false}
        slotProps={{ paper: { sx: { width: '95vw', height: '90vh', maxWidth: '95vw', maxHeight: '90vh', borderRadius: '16px', border: '1.5px solid #86efac', display: 'flex', flexDirection: 'column', overflow: 'hidden' } } }}>
        <Box sx={{ p: 0, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, background: 'linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)', borderBottom: '2px solid #10b981' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ color: '#10b981' }}><IconCheck size={28} /></Box>
              <Typography fontWeight={700} fontSize="1.65rem" color="#065f46">Proof Complete!</Typography>
            </Box>
            <IconButton onClick={() => setIsFinishScreenOpen(false)} sx={{ color: '#065f46', '&:hover': { background: 'rgba(6,95,70,0.1)' } }}>
              <IconX />
            </IconButton>
          </Box>
          <Box sx={{ px: 3, py: 1.25, background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
            <Typography sx={{ fontSize: '0.95rem', color: '#166534', fontStyle: 'italic' }}>
              {proofDiscoveryState.statement}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden', background: '#f2f6fa' }}>
          <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
            <ProofDiscoveryStateVisualization proofDiscoveryState={proofDiscoveryState} />
          </ProofDiscoveryStateContext.Provider>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, px: 3, py: 1.5, borderTop: '1px solid #c0cedb', background: 'linear-gradient(180deg,#ffffff,#f4f7fb)', flexShrink: 0 }}>
          <Button variant="outlined"
            startIcon={<IconCopy />}
            onClick={() => { const j = JSON.stringify(serializeProofDiscoveryState(proofDiscoveryState), null, 2); navigator.clipboard.writeText(j).then(() => { setJsonCopied(true); setTimeout(() => setJsonCopied(false), 2000) }) }}
            sx={{ color: '#1e40af', borderColor: '#60a5fa', background: 'linear-gradient(180deg,#dbeafe,#bfdbfe)', fontWeight: 700, textTransform: 'none', '&:hover': { background: 'linear-gradient(180deg,#bfdbfe,#a3c8fc)', borderColor: '#3b82f6' } }}
          >
            {jsonCopied ? 'Copied!' : 'Copy Proof JSON'}
          </Button>
          <Button variant="outlined"
            onClick={() => setIsFinishScreenOpen(false)}
            sx={{ color: '#065f46', borderColor: '#34d399', background: 'linear-gradient(180deg,#d1fae5,#a7f3d0)', fontWeight: 700, textTransform: 'none', '&:hover': { background: 'linear-gradient(180deg,#a7f3d0,#6ee7b7)', borderColor: '#10b981' } }}
          >
            Continue Exploring
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}
