import { JSX, useState, useContext, useReducer, useEffect } from 'react'
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
  Dialog, DialogContent, DialogActions, Tooltip,
} from '@mui/material'

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
  borderColor: '#a8becc',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 500,
  textTransform: 'none' as const,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.95) 100%)',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 1px 2px rgba(30,60,100,0.06)',
  gap: '0.35rem',
  py: 0.6,
  px: 1.25,
  minHeight: 0,
  lineHeight: 1.4,
  '&:hover': {
    borderColor: '#2c5f8a',
    background: 'linear-gradient(180deg, rgba(234,243,255,0.98) 0%, rgba(219,238,251,0.98) 100%)',
    boxShadow: '0 2px 6px rgba(30,70,130,0.12)',
  },
  '&.Mui-disabled': { opacity: 0.38 },
}

/** Sx for the small icon buttons in the floating graph header */

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
  const [isGraphExpanded, setIsGraphExpanded] = useState(false)
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
      const response = await fetch("https://atp-backend-rygt.onrender.com/informalize", {
        method: "POST", mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofState: currentPS }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setInformalizedText(data.naturalLanguage || data.text || JSON.stringify(data))
    } catch (err) {
      setInformalizedText(err instanceof Error ? `Failed to informalize: ${err.message}` : "An unknown error occurred")
    } finally {
      setIsInformalizeLoading(false)
      setIsInformalizePopupOpen(true)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', background: '#ffffff' }}>

      {/* ════════════════════ LEFT COLUMN (library + proof state) ════════════════════ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* ════════════════════ LIBRARY BAR ════════════════════ */}
      <Box sx={{
        flexShrink: 0,
        borderBottom: '1px solid #d4a520',
        background: 'linear-gradient(180deg, #fffdf0 0%, #fef6d4 100%)',
        boxShadow: '0 2px 6px rgba(180,120,0,0.08)',
      }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, height: 44, py: 0, gap: 1 }}>
          {/* Star icon + label */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#92400e' }}>
            <Box component="span" sx={{ fontSize: '13px', lineHeight: 1, color: '#d97706' }}>★</Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400e' }}>
              Library
            </Typography>
          </Box>

          {/* Count badge */}
          <Chip
            label={proofDiscoveryState.library.length}
            size="small"
            sx={{ height: 18, minWidth: 24, fontSize: '11px', fontWeight: 700, background: '#fde68a', color: '#7a4500', border: '1px solid #f5c03a', borderRadius: '9px', '& .MuiChip-label': { px: '6px' } }}
          />

          {/* Divider */}
          <Box sx={{ width: '1px', height: 14, background: '#f0c060', mx: 0.25 }} />

          {/* Show/hide toggle */}
          <Button
            onClick={() => setIsLibraryExpanded(v => !v)}
            size="small"
            endIcon={<IconChevron rotated={isLibraryExpanded} />}
            sx={{
              color: '#7a4f00', fontSize: '0.73rem', fontWeight: 500, textTransform: 'none',
              px: 0.75, py: 0.25, minHeight: 0, gap: 0.5,
              '&:hover': { background: 'rgba(180,110,0,0.08)' },
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
                border: '1.5px solid #c08800', color: '#7a4f00', fontSize: '15px', fontWeight: 700,
                background: isAddLibraryOpen
                  ? 'linear-gradient(180deg, #fde68a, #fcd34d)'
                  : 'linear-gradient(180deg, #fef9e0, #fef0b0)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                '&:hover': { background: 'linear-gradient(180deg, #fde68a, #fcd34d)', borderColor: '#a06800' },
              }}
            >
              +
            </IconButton>
          </Tooltip>
        </Box>

        {/* Add form */}
        {isAddLibraryOpen && (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Paper elevation={0} sx={{ border: '1px solid #fde68a', borderRadius: '10px', p: 2, background: 'white', boxShadow: '0 2px 8px rgba(180,120,0,0.07)' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#92400e', letterSpacing: '0.08em', flexShrink: 0, textTransform: 'uppercase' }}>Label</Typography>
                <input
                  type="text"
                  value={newLibraryLabel}
                  onChange={e => setNewLibraryLabel(e.target.value)}
                  placeholder="e.g. lemma_1"
                  style={{ flex: 1, padding: '4px 9px', border: '1px solid #fde68a', borderRadius: '5px', fontSize: '13px', outline: 'none', background: '#fffef8', fontFamily: 'inherit' }}
                />
              </Box>
              <StatementBuilder value={newLibraryStatement} onChange={setNewLibraryStatement} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Button
                  size="small" variant="contained"
                  disabled={!newLibraryLabel.trim()}
                  onClick={() => {
                    if (!newLibraryLabel.trim()) return
                    dispatchProofDiscoveryAction({ action: 'addToLibrary', statement: { label: newLibraryLabel.trim(), statement: newLibraryStatement } })
                    setIsAddLibraryOpen(false); setNewLibraryLabel(''); setNewLibraryStatement(''); setIsLibraryExpanded(true)
                  }}
                  sx={{ background: 'linear-gradient(180deg,#b07800,#8a5c00)', '&:hover': { background: 'linear-gradient(180deg,#8a5c00,#6a4400)' }, fontSize: '12px', fontWeight: 700, textTransform: 'none' }}
                >
                  Add to Library
                </Button>
                <Button size="small" variant="outlined" onClick={() => setIsAddLibraryOpen(false)}
                  sx={{ color: '#92400e', borderColor: '#fbc97a', fontSize: '12px', textTransform: 'none', '&:hover': { borderColor: '#d97706', background: '#fff8e0' } }}>
                  Cancel
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Library items */}
        {isLibraryExpanded && proofDiscoveryState.library.length > 0 && (
          <Box sx={{ px: 2, pb: 1.25, display: 'flex', flexDirection: 'column', gap: 0.625, maxHeight: 180, overflowY: 'auto' }}>
            {proofDiscoveryState.library.map((statement, idx) => {
              const active = proofDiscoveryState.highlightedLibraryStatement === idx
              return (
                <Paper key={idx} elevation={0}
                  onClick={() => dispatchProofDiscoveryAction(active ? { action: 'clearHighlightedStatement' } : { action: 'setHighlightedStatement', index: idx })}
                  sx={{
                    px: 1.75, py: 1,
                    border: active ? '1.5px solid #86cc20' : '1px solid #e8c84a',
                    background: active ? 'linear-gradient(135deg,#ecfccb,#dcf5a0)' : 'linear-gradient(135deg,#fffef2,#fefce8)',
                    borderRadius: '9px', cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: active ? '0 3px 10px rgba(132,204,22,0.22)' : '0 1px 2px rgba(180,120,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                    '&:hover': { boxShadow: '0 3px 10px rgba(180,120,0,0.14)', borderColor: active ? '#70bc10' : '#d4a020' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box component="span" sx={{ color: '#c08000', fontSize: '12px', flexShrink: 0, userSelect: 'none' }}>★</Box>
                    <Box sx={{ flex: 1 }}>
                      <ProofStateLocationContext.Provider value={{ kind: 'library_statement', label: statement.label }}>
                        <MathStatement address={[]} statement={statement.statement} polarity={null} />
                      </ProofStateLocationContext.Provider>
                    </Box>
                    <Chip label={statement.label} size="small" variant="outlined"
                      sx={{ height: 20, fontSize: '10px', fontWeight: 700, background: '#fefce8', border: '1px solid #d4a020', color: '#7a4800', userSelect: 'none', '& .MuiChip-label': { px: '6px' } }}
                    />
                  </Box>
                </Paper>
              )
            })}
          </Box>
        )}
      </Box>

        {/* Proof State — scrollable, with floating pill at bottom */}
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Scrollable proof state content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: '76px', background: '#ffffff' }}>
            {proofDiscoveryState.isSolved && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Chip
                  icon={<Box sx={{ display: 'flex', color: '#10b981', ml: 0.5 }}><IconCheck size={15} /></Box>}
                  label="Solved!"
                  sx={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '2px solid #10b981', color: '#065f46', fontWeight: 700, fontSize: '0.88rem', height: 30, boxShadow: '0 2px 8px rgba(16,185,129,0.22)' }}
                />
              </Box>
            )}
            <Paper elevation={0} sx={{
              p: 3, borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #d4dde6',
              boxShadow: '0 2px 12px rgba(30,60,100,0.07), inset 0 1px 0 rgba(255,255,255,0.95)',
              overflow: 'visible',
            }}>
              <ProofStateIdContext.Provider value={{ proofNodeId: proofDiscoveryState.currentNodeId, proofContextId: 0 }}>
                <ProofStateComponent
                  proofState={currentProofState}
                  libraryResult={proofDiscoveryState.highlightedLibraryStatement !== undefined
                    ? proofDiscoveryState.library[proofDiscoveryState.highlightedLibraryStatement]
                    : undefined}
                />
              </ProofStateIdContext.Provider>
            </Paper>
          </Box>

          {/* ── Floating action pill ── */}
          <Paper elevation={0}
            sx={{
              position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20,
              display: 'flex', alignItems: 'center', gap: 0.75,
              px: 1.75, py: 0.875,
              borderRadius: '40px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(240,246,252,0.97) 100%)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(180,200,220,0.75)',
              boxShadow: '0 4px 20px rgba(30,60,110,0.14), 0 1px 4px rgba(30,60,110,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            <Tooltip title="Copy current proof state to clipboard">
              <Button variant="outlined" size="small" startIcon={<IconCopy />} onClick={handleCopyProofState} sx={actionBtnSx}>
                Copy
              </Button>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ width: '1px', height: 20, background: 'rgba(160,185,210,0.5)', mx: 0.25 }} />

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

            <Box sx={{ width: '1px', height: 20, background: 'rgba(160,185,210,0.5)', mx: 0.25 }} />

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
              <>
                <Box sx={{ width: '1px', height: 20, background: 'rgba(160,185,210,0.5)', mx: 0.25 }} />
                <Chip
                  label={`${selections.length} sel.`}
                  size="small"
                  sx={{ background: 'linear-gradient(135deg,#dbeafe,#c3d8f8)', border: '1px solid #7aaad8', color: '#1a3a6e', fontWeight: 700, fontSize: '0.75rem', height: 24, boxShadow: '0 1px 3px rgba(30,70,160,0.10)' }}
                />
              </>
            )}
          </Paper>
        </Box>

      </Box>{/* end left column */}

      {/* ── Right column: Move Panel + Proof Graph ── */}
      <Box sx={{
        width: '400px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid #e2e8f0',
        overflow: 'hidden',
        background: '#f8fafc',
      }}>
        {/* Move panel fills remaining height */}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}>
            <MovePanel />
          </ProofDiscoveryStateContext.Provider>
        </Box>

        {/* ── Proof Graph panel (collapsible, dark theme) ── */}
        <Box sx={{ flexShrink: 0, borderTop: '2px solid #0f172a' }}>
          {/* Header — click to expand/collapse */}
          <Box
            onClick={() => setIsGraphExpanded(v => !v)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, height: 40,
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              cursor: 'pointer', userSelect: 'none',
              '&:hover': { background: 'linear-gradient(180deg, #263548 0%, #1a2535 100%)' },
            }}
          >
            {/* macOS traffic dots */}
            <Box sx={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
                <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}60` }} />
              ))}
            </Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.14em', textTransform: 'uppercase', flex: 1 }}>
              Proof Graph
            </Typography>
            <Chip
              label={`${proofDiscoveryState.graph.order}`}
              size="small"
              sx={{ height: 16, fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.08)', color: '#64748b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '5px', '& .MuiChip-label': { px: '5px' } }}
            />
            <Tooltip title="Fullscreen" arrow>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsGraphFullscreen(true) }}
                sx={{ width: 22, height: 22, color: '#475569', ml: 0.25, '&:hover': { color: '#94a3b8', background: 'rgba(255,255,255,0.08)' } }}>
                <IconFullscreen />
              </IconButton>
            </Tooltip>
            <Box sx={{ color: '#475569', display: 'flex', ml: 0.25, transition: 'transform 0.2s', transform: isGraphExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
              <IconChevron rotated={false} />
            </Box>
          </Box>
          {/* Graph body */}
          {isGraphExpanded && (
            <Box sx={{ height: 240, background: '#0f172a', overflow: 'hidden' }}>
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
        slotProps={{ paper: { sx: { width: '95vw', height: '95vh', maxWidth: '95vw', maxHeight: '95vh', borderRadius: '14px', border: '1px solid #b8ccda', background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' } } }}>
        <DialogHeader title="Proof Discovery Graph" onClose={() => setIsGraphFullscreen(false)} />
        <DialogContent sx={{ p: 1.5, flex: 1, overflow: 'hidden', background: '#0f172a' }}>
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
