import React, { JSX, useContext, useState, useEffect } from "react"
import {
  Box, Typography, Button, IconButton, Chip,
  Dialog, DialogContent, Tooltip, Select, MenuItem,
} from "@mui/material"
import { ProofStateSelection, ProofStateSelectionContext, toProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext"
import { ProofDiscoveryMove, ProofDiscoveryMoveExample } from "../core/ProofDiscoveryMove"
import { ProofDiscoveryState, ProofDiscoveryAction, getCurrentProofState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { ProofStateWithLibraryResult as ProofStateComponent } from "./ProofState"
import { runMove } from "../fetchers/move"
import { checkMoveValidity } from "../fetchers/filter"
import { useMoveSet } from "./MoveSetContext"
import MoveGenerator from "../../tests/MoveGenerator"

// ─── Apply move helper ────────────────────────────────────────────────────────

export async function applyMove(
  proofDiscoveryState: ProofDiscoveryState,
  selections: ProofStateSelection[],
  move: ProofDiscoveryMove,
  dispatchProofDiscoveryAction: React.Dispatch<ProofDiscoveryAction>,
  dispatchSelections: React.Dispatch<any>
): Promise<string | undefined> {
  const { proofState: newProofState, reasoning } = await runMove({
    proofState: getCurrentProofState(proofDiscoveryState),
    move,
    selections: selections.map(toProofStateSelectionWithPolarity)
  })

  if (!newProofState) throw new Error(`Failed to apply move ${move.name}: ${reasoning}`)

  dispatchProofDiscoveryAction({
    action: "transition",
    newProofState,
    move: {
      kind: move.kind,
      description: move.name,
      reasoning
    }
  })
  dispatchSelections({ type: 'CLEAR_ALL_SELECTIONS' })

  return reasoning
}

// ─── Design tokens ────────────────────────────────────────────────────────────

// Green palette — regular moves
export const G = {
  dark:   '#064e3b',
  med:    '#059669',
  bright: '#10b981',
  light:  '#a7f3d0',
  bg:     '#f6fbf9',
  border: '#d1fae5',
  text:   '#022c22',
}

// Muted slate palette — logical moves
export const L = {
  dark:   '#374151',
  med:    '#6b7280',
  bright: '#9ca3af',
  bg:     '#f9fafb',
  border: '#e5e7eb',
}

// ─── Shared icons & components ────────────────────────────────────────────────

export const ChevronIcon = ({ rotated = false }: { rotated?: boolean }) => (
  <svg style={{ width: 14, height: 14, transition: 'transform 0.2s', transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', display: 'block' }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

export const PlayIcon = () => (
  <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
)

export function SpinnerBox({ size = 20, trackColor, spinColor }: { size?: number, trackColor?: string, spinColor?: string }) {
  useEffect(() => {
    const id = "move-panel-spin"
    if (!document.getElementById(id)) {
      const s = document.createElement("style")
      s.id = id
      s.textContent = `@keyframes move-panel-spin { to { transform: rotate(360deg); } }`
      document.head.appendChild(s)
    }
  }, [])
  return (
    <Box sx={{
      width: size, height: size, flexShrink: 0,
      border: `2.5px solid ${trackColor ?? G.border}`,
      borderTopColor: spinColor ?? G.bright,
      borderRadius: '50%',
      animation: 'move-panel-spin 0.8s linear infinite',
    }} />
  )
}

export function MoveKindBadge({ kind }: { kind: ProofDiscoveryMove["kind"] }): JSX.Element {
  const colors: Record<string, { bg: string, fg: string, border: string }> = {
    strengthening: { bg: G.bg,     fg: G.dark,    border: G.border  },
    weakening:     { bg: '#FFF9C4', fg: '#E65100', border: '#FFE082' },
    equivalence:   { bg: '#E3F2FD', fg: '#1565C0', border: '#BBDEFB' },
  }
  const c = colors[kind] ?? { bg: '#F5F5F5', fg: '#424242', border: '#E0E0E0' }
  return (
    <Chip
      label={kind}
      size="small"
      sx={{
        height: 18, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.03em',
        background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
        borderRadius: '9px', textTransform: 'capitalize',
        '& .MuiChip-label': { px: '7px' },
      }}
    />
  )
}

/** Inline preview of a single move example (compact). */
export function ExamplePreview({ example, idx }: { example: ProofDiscoveryMoveExample, idx: number }): JSX.Element {
  const isExample = example.kind === "example"
  const accentColor = isExample ? G.bright : "#E53935"
  const borderColor = isExample ? G.border : "#FFCDD2"
  const bgColor     = isExample ? G.bg     : "#FFF5F5"
  const labelBg     = isExample ? '#DCEDC8' : '#FFEBEE'
  const labelFg     = isExample ? G.dark    : '#B71C1C'

  return (
    <Box sx={{
      borderRadius: '10px', mb: 1,
      border: `1.5px solid ${borderColor}`,
      background: bgColor, overflow: 'hidden',
    }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: '7px',
        px: 1.25, py: 0.75,
        borderBottom: `1px solid ${borderColor}`,
        background: labelBg,
      }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: '50%',
          background: accentColor, color: 'white',
          fontSize: '0.65rem', fontWeight: 800, flexShrink: 0,
        }}>
          {isExample ? '✓' : '✗'}
        </Box>
        <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color: labelFg, flex: 1 }}>
          Example {idx + 1}
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: labelFg, opacity: 0.75, textTransform: 'capitalize' }}>
          {example.kind.replace('-', ' ')}
        </Typography>
      </Box>

      <Box sx={{ p: '8px 10px' }}>
        <Typography sx={{ fontSize: '0.73rem', color: '#374151', lineHeight: 1.45, mb: 0.75 }}>
          {example.description}
        </Typography>
        {example.comment && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.68rem', color: '#6b7280', fontStyle: 'italic', mb: 0.875, lineHeight: 1.4 }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>💬</span>
            <span>{example.comment}</span>
          </Box>
        )}

        {/* Before */}
        <Box sx={{ mb: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9E9E9E' }}>Before</Typography>
            <Box sx={{ flex: 1, height: '1px', background: '#E0E0E0' }} />
          </Box>
          <Box sx={{ background: 'white', borderRadius: '7px', p: '6px 8px', border: '1px solid #EEEEEE', overflow: 'auto', maxHeight: 200, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
            <ProofStateIdContext.Provider value={{ proofNodeId: example.selections[0]?.proofStateId.proofNodeId ?? 0, proofContextId: example.selections[0]?.proofStateId.proofContextId ?? 0 }}>
              <ProofStateSelectionContext.Provider value={{ selections: example.selections, dispatch: () => {} }}>
                <ProofStateComponent
                  proofState={example.inputState.proofState}
                  libraryResult={example.inputState.libraryResult ?? undefined}
                />
              </ProofStateSelectionContext.Provider>
            </ProofStateIdContext.Provider>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.75 }}>
          <svg style={{ width: 20, height: 20, color: accentColor, opacity: 0.7 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </Box>

        {/* After */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9E9E9E' }}>After</Typography>
            <Box sx={{ flex: 1, height: '1px', background: '#E0E0E0' }} />
          </Box>
          <Box sx={{ background: 'white', borderRadius: '7px', p: '6px 8px', border: '1px solid #EEEEEE', overflow: 'auto', maxHeight: 200, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
            {example.outputState ? (
              <ProofStateComponent
                proofState={example.outputState.proofState}
                libraryResult={example.outputState.libraryResult ?? undefined}
              />
            ) : (
              <Typography sx={{ fontSize: '0.7rem', color: '#9E9E9E', fontStyle: 'italic' }}>No output state</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

// ─── AllMovesList-private helpers ─────────────────────────────────────────────

const CloseXIcon = () => (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const EditPencilIcon = () => (
  <svg style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
)

const DownloadSmIcon = () => (
  <svg style={{ width: 12, height: 12 }} viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8m0 0L5 7m3 3l3-3M2 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function ClassificationBadge({ classification }: { classification: "mathematical" | "logical" }) {
  const isLogical = classification === "logical"
  return (
    <Chip
      label={classification}
      size="small"
      sx={{
        height: 16, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em',
        background: isLogical ? L.bg : G.bg,
        color: isLogical ? L.dark : G.dark,
        border: `1px solid ${isLogical ? L.border : G.border}`,
        borderRadius: '6px', textTransform: 'capitalize',
        '& .MuiChip-label': { px: '6px' },
      }}
    />
  )
}

// ─── AllMovesList ─────────────────────────────────────────────────────────────

type RunPhase = 'idle' | 'checking' | 'warning' | 'applying' | 'error'
type RunState = { phase: RunPhase; warningReasoning?: string; warningKind?: 'trigger' | 'apply'; errorText?: string }

export function AllMovesList(): JSX.Element {
  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)
  const moveSet = useMoveSet()

  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingMove, setEditingMove] = useState<ProofDiscoveryMove | undefined>(undefined)
  const [editorHasUnsavedChanges, setEditorHasUnsavedChanges] = useState(false)
  const [runState, setRunState] = useState<RunState>({ phase: 'idle' })
  const [newSetName, setNewSetName] = useState("")
  const [addingNewSet, setAddingNewSet] = useState(false)
  const [renamingSetId, setRenamingSetId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const { sets, activeSet, activeMoves, allMovesInSet } = moveSet
  const isDefaultSet = activeSet.id === 'default'

  const selectedMove = selectedName !== null ? allMovesInSet.find(m => m.name === selectedName) ?? null : null
  const resetRunState = () => setRunState({ phase: 'idle' })

  const openEditor = (move?: ProofDiscoveryMove) => {
    setEditingMove(move)
    setEditorHasUnsavedChanges(false)
    setEditorOpen(true)
  }

  const handleSaveMove = (move: ProofDiscoveryMove) => {
    if (editingMove) {
      moveSet.updateMove(activeSet.id, editingMove.name, move)
    } else {
      moveSet.addMove(move)
    }
    // Update editingMove so future saves use the new name (in case of rename)
    setEditingMove(move)
    setEditorHasUnsavedChanges(false)
  }

  const handleCloseEditor = () => {
    if (editorHasUnsavedChanges && !window.confirm("You have unsaved changes. Close without saving?")) return
    setEditorOpen(false)
    setEditingMove(undefined)
    setEditorHasUnsavedChanges(false)
  }

  const handleRunMove = async (move: ProofDiscoveryMove, skipCheck = false) => {
    if (!skipCheck && move.runWithGuardrails) {
      setRunState({ phase: 'checking' })
      try {
        const filterResponse = await checkMoveValidity({
          proofState: getCurrentProofState(proofDiscoveryState),
          selections: selections.map(toProofStateSelectionWithPolarity),
          name: move.name,
          triggerCriterion: move.trigger
        })
        if (!filterResponse.meetsCondition) {
          setRunState({ phase: 'warning', warningReasoning: filterResponse.reasoning, warningKind: 'trigger' })
          return
        }
      } catch (err) {
        setRunState({ phase: 'error', errorText: err instanceof Error ? err.message : 'Failed to check trigger' })
        return
      }
    }
    setRunState({ phase: 'applying' })
    try {
      await applyMove(proofDiscoveryState, selections, move, dispatchProofDiscoveryAction, dispatchSelections)
      resetRunState()
    } catch (err) {
      if (move.runWithGuardrails) {
        setRunState({ phase: 'warning', warningReasoning: err instanceof Error ? err.message : 'Failed to apply move', warningKind: 'apply' })
      } else {
        setRunState({ phase: 'error', errorText: err instanceof Error ? err.message : 'Failed to apply move' })
      }
    }
  }

  const isBusy = runState.phase === 'checking' || runState.phase === 'applying'

  const generalMoves = allMovesInSet.filter(m => m.classification !== "logical")
  const logicalMovesActive = allMovesInSet.filter(m => m.classification === "logical")

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Move Set Selector ── */}
      <Box sx={{
        px: 1.5, py: 0.75,
        background: 'linear-gradient(180deg, #f8fafb 0%, #f0f4f8 100%)',
        borderBottom: `1px solid #dde5ee`,
      }}>
        {/* Main row: icon + tabs + add + spacer + action icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375, flexWrap: 'wrap' }}>
          <Tooltip title="Move sets let you save different configurations of available moves" placement="right">
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b', cursor: 'default', mr: 0.5, flexShrink: 0 }}>
              <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M2 12a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" opacity="0.5" />
              </svg>
            </Box>
          </Tooltip>

          {sets.map(set => (
            <Button
              key={set.id}
              size="small"
              onClick={() => { moveSet.setActiveSetId(set.id); setSelectedName(null) }}
              sx={{
                px: 1, py: 0.25, fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', borderRadius: '7px',
                background: activeSet.id === set.id ? '#1d4ed8' : 'transparent',
                color: activeSet.id === set.id ? 'white' : '#374151',
                border: `1px solid ${activeSet.id === set.id ? '#1d4ed8' : 'transparent'}`,
                minHeight: 0, lineHeight: 1.4,
                '&:hover': {
                  background: activeSet.id === set.id ? '#1e40af' : '#e8eef4',
                  borderColor: activeSet.id === set.id ? '#1e40af' : '#c0cedb',
                },
              }}
            >
              {set.name}
            </Button>
          ))}

          {!addingNewSet && (
            <Tooltip title="Create new move set">
              <Box
                component="button"
                onClick={() => setAddingNewSet(true)}
                sx={{
                  width: 22, height: 22, borderRadius: '6px', border: '1px dashed #c0cedb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', background: 'transparent', color: '#94a3b8', flexShrink: 0,
                  '&:hover': { background: '#f0f4f8', color: '#1d4ed8', borderColor: '#8aabcc', borderStyle: 'solid' },
                }}
              >
                <svg style={{ width: 10, height: 10 }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </Box>
            </Tooltip>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Active set action icons */}
          {renamingSetId !== activeSet.id && (
            <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
              {!isDefaultSet && (
                <Tooltip title="Rename this set">
                  <Box component="button" onClick={() => { setRenamingSetId(activeSet.id); setRenameValue(activeSet.name) }}
                    sx={{ width: 24, height: 24, borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', color: '#94a3b8', '&:hover': { background: '#f0f4f8', color: '#1e3a5f' } }}>
                    <EditPencilIcon />
                  </Box>
                </Tooltip>
              )}
              <Tooltip title="Duplicate as new set">
                <Box component="button" onClick={() => moveSet.createSet(`${activeSet.name} (copy)`, activeSet.id)}
                  sx={{ width: 24, height: 24, borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', color: '#94a3b8', '&:hover': { background: '#f0f4f8', color: '#1e3a5f' } }}>
                  <svg style={{ width: 11, height: 11 }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </Box>
              </Tooltip>
              <Tooltip title="Export enabled moves as JSON">
                <Box component="button" onClick={() => moveSet.exportSetAsJson(activeSet.id)}
                  sx={{ width: 24, height: 24, borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', color: '#94a3b8', '&:hover': { background: '#f0f4f8', color: '#1e3a5f' } }}>
                  <DownloadSmIcon />
                </Box>
              </Tooltip>
              {sets.length > 1 && activeSet.id !== 'default' && (
                <Tooltip title="Delete this set">
                  <Box component="button" onClick={() => { if (window.confirm(`Delete move set "${activeSet.name}"?`)) moveSet.deleteSet(activeSet.id) }}
                    sx={{ width: 24, height: 24, borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', color: '#94a3b8', '&:hover': { background: '#fff5f5', color: '#ef4444' } }}>
                    <svg style={{ width: 11, height: 11 }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </Box>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>

        {/* Rename input — shown inline below when renaming */}
        {renamingSetId === activeSet.id && (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
            <Box
              component="input"
              type="text"
              value={renameValue}
              autoFocus
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && renameValue.trim()) { moveSet.renameSet(activeSet.id, renameValue.trim()); setRenamingSetId(null) }
                if (e.key === 'Escape') setRenamingSetId(null)
              }}
              sx={{ fontSize: '0.72rem', color: '#1e3a5f', border: '1px solid #8aabcc', borderRadius: '6px', p: '3px 7px', outline: 'none', background: 'white', flex: 1, maxWidth: 150, '&:focus': { boxShadow: '0 0 0 2px rgba(74,138,181,0.2)' } }}
            />
            <Button size="small" onClick={() => { if (renameValue.trim()) { moveSet.renameSet(activeSet.id, renameValue.trim()); setRenamingSetId(null) } }}
              sx={{ px: 1, fontSize: '0.68rem', fontWeight: 700, textTransform: 'none', minHeight: 0, color: '#1d4ed8', '&:hover': { background: '#eff4ff' } }}>
              Save
            </Button>
            <Button size="small" onClick={() => setRenamingSetId(null)}
              sx={{ px: 1, fontSize: '0.68rem', fontWeight: 600, textTransform: 'none', minHeight: 0, color: '#64748b' }}>
              Cancel
            </Button>
          </Box>
        )}

        {/* New set input — shown inline below when adding */}
        {addingNewSet && (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
            <Box
              component="input"
              type="text"
              value={newSetName}
              autoFocus
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSetName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && newSetName.trim()) { moveSet.createSet(newSetName.trim()); setNewSetName(""); setAddingNewSet(false) }
                if (e.key === 'Escape') { setAddingNewSet(false); setNewSetName("") }
              }}
              placeholder="New set name…"
              sx={{ fontSize: '0.72rem', color: '#1e3a5f', border: '1px solid rgba(180,200,220,0.7)', borderRadius: '6px', p: '3px 7px', outline: 'none', background: 'rgba(255,255,255,0.7)', flex: 1, maxWidth: 150, '&::placeholder': { color: '#94a3b8' }, '&:focus': { borderColor: '#8aabcc', background: 'white', boxShadow: '0 0 0 2px rgba(74,138,181,0.12)' } }}
            />
            <Button size="small"
              disabled={!newSetName.trim()}
              onClick={() => { moveSet.createSet(newSetName.trim()); setNewSetName(""); setAddingNewSet(false) }}
              sx={{ px: 1.25, fontSize: '0.68rem', fontWeight: 700, textTransform: 'none', minHeight: 0, color: '#1d4ed8', border: '1px solid rgba(180,200,220,0.7)', borderRadius: '6px', '&:hover': { background: '#eff4ff', borderColor: '#93aeed' }, '&:disabled': { opacity: 0.4 } }}>
              Create
            </Button>
            <Button size="small" onClick={() => { setAddingNewSet(false); setNewSetName("") }}
              sx={{ px: 1, fontSize: '0.68rem', fontWeight: 600, textTransform: 'none', minHeight: 0, color: '#64748b' }}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Local storage notice + Add button ── */}
      <Box sx={{ px: 2, pt: 1.25, pb: 0.75, borderBottom: `1px solid #e8eef4`, display: 'flex', flexDirection: 'column', gap: 0.875 }}>
        <Box sx={{
          display: 'flex', alignItems: 'flex-start', gap: '6px',
          p: '7px 10px', borderRadius: '8px',
          background: '#fefce8', border: '1px solid #fde047',
        }}>
          <svg style={{ width: 13, height: 13, color: '#ca8a04', marginTop: 1, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <Typography sx={{ fontSize: '0.68rem', color: '#78350f', lineHeight: 1.45 }}>
            Custom moves and move sets are <strong>saved in your browser</strong> and persist across sessions. They won't sync across different devices or browsers.
          </Typography>
        </Box>

        {isDefaultSet ? (
          <Box sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1, px: 1.25, py: 1,
            borderRadius: '10px', border: '1px solid #c0cedb',
            background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
          }}>
            <svg style={{ width: 13, height: 13, color: '#4a8ab5', marginTop: 1, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <Typography sx={{ fontSize: '0.68rem', color: '#2e4a68', lineHeight: 1.45 }}>
              The default move set cannot be edited. <strong>Create a new move set</strong> to add, edit, or remove moves.
            </Typography>
          </Box>
        ) : (
          <Button
            onClick={() => openEditor(undefined)}
            fullWidth
            variant="outlined"
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
              py: '8px', borderRadius: '10px',
              background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
              color: '#2d5a2a', borderColor: '#7ab872', textTransform: 'none',
              fontSize: '0.8rem', fontWeight: 700,
              boxShadow: '0 2px 6px rgba(100,155,85,0.14)',
              '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54' },
            }}
          >
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Move
          </Button>
        )}
      </Box>

      {/* ── Move rows ── */}
      {[
        { label: 'Mathematical moves', subtitle: '', list: generalMoves, color: G },
        { label: 'Logical moves', subtitle: '', list: logicalMovesActive, color: L },
      ].map(({ label, subtitle, list, color: C }) => list.length === 0 ? null : (
        <Box key={label}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px', px: 2, py: 0.75, borderBottom: `1px solid ${C.border}` }}>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.med ?? C.bright, flexShrink: 0 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', color: C.med ?? C.bright, opacity: 0.65, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 8, height: '1px', background: C.border }} />
          </Box>
          {list.map((move) => {
            const isSelected = selectedName === move.name
            const isEnabled = moveSet.isMoveEnabled(activeSet.id, move.name)
            const isCustom = moveSet.isMoveCustom(activeSet.id, move.name)
            return (
              <Box key={move.name} sx={{
                borderBottom: `1px solid ${C.border}`,
                opacity: isEnabled ? 1 : 0.45,
                transition: 'all 0.15s ease',
              }}>
                {/* Move header row */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    onClick={() => {
                      setSelectedName(isSelected ? null : move.name)
                      setExamplesOpen(false)
                      resetRunState()
                    }}
                    sx={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 0.75,
                      px: 1.5, py: 1, border: 'none', justifyContent: 'flex-start',
                      textTransform: 'none', borderRadius: 0,
                      background: isSelected ? (C === G ? G.bg : L.bg) : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': { background: C === G ? G.bg : L.bg, paddingLeft: 1.75 },
                    }}
                  >
                    <Box sx={{ flex: 1, textAlign: 'left' }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? (C === G ? G.dark : L.dark) : '#374151' }}>
                        {move.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isCustom && (
                        <Chip label="custom" size="small" sx={{
                          height: 15, fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.04em',
                          background: '#f0f4ff', color: '#3730a3', border: '1px solid #c7d2fe',
                          '& .MuiChip-label': { px: '5px' },
                        }} />
                      )}
                      <MoveKindBadge kind={move.kind} />
                    </Box>
                    <Box sx={{ display: 'flex', color: '#9E9E9E', transition: 'transform 0.2s', transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronIcon />
                    </Box>
                  </Button>

                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', gap: 0.375, pr: 1, flexShrink: 0 }}>
                    <Tooltip title={isEnabled ? "Inactivate move" : "Activate move"}>
                      <Box
                        component="button"
                        onClick={() => moveSet.toggleMoveEnabled(activeSet.id, move.name)}
                        sx={{
                          width: 26, height: 26, borderRadius: '6px', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', flexShrink: 0,
                          background: isEnabled ? 'transparent' : '#f1f5f9',
                          color: isEnabled ? '#94a3b8' : '#22c55e',
                          transition: 'all 0.2s ease',
                          '&:hover': { background: isEnabled ? '#fef2f2' : '#f0fdf4', color: isEnabled ? '#ef4444' : '#16a34a', transform: 'scale(1.08)' },
                        }}
                      >
                        {/* Power button icon */}
                        <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v6" />
                          <path d="M6.343 5.343a8 8 0 1 0 11.314 0" />
                        </svg>
                      </Box>
                    </Tooltip>
                    {!isDefaultSet && (
                      <Tooltip title="Edit move">
                        <Box
                          component="button"
                          onClick={() => openEditor(move)}
                          sx={{
                            width: 26, height: 26, borderRadius: '6px', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                            background: 'transparent', color: '#94a3b8',
                            transition: 'all 0.2s ease',
                            '&:hover': { background: C === G ? G.bg : L.bg, color: C === G ? G.dark : L.dark, transform: 'scale(1.08)' },
                          }}
                        >
                          <EditPencilIcon />
                        </Box>
                      </Tooltip>
                    )}
                    <Tooltip title="Export as JSON">
                      <Box
                        component="button"
                        onClick={() => moveSet.exportMoveAsJson(move)}
                        sx={{
                          width: 26, height: 26, borderRadius: '6px', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', flexShrink: 0,
                          background: 'transparent', color: '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': { background: '#f0f4f8', color: '#1e3a5f', transform: 'scale(1.08)' },
                        }}
                      >
                        <DownloadSmIcon />
                      </Box>
                    </Tooltip>
                    {isCustom && !isDefaultSet && (
                      <Tooltip title="Remove from set">
                        <Box
                          component="button"
                          onClick={() => { moveSet.removeMove(activeSet.id, move.name); if (selectedName === move.name) setSelectedName(null) }}
                          sx={{
                            width: 26, height: 26, borderRadius: '6px', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                            background: 'transparent', color: '#94a3b8',
                            transition: 'all 0.2s ease',
                            '&:hover': { background: '#fff5f5', color: '#ef4444', transform: 'scale(1.08)' },
                          }}
                        >
                          <CloseXIcon />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Expanded detail */}
                {isSelected && selectedMove && (
                  <Box sx={{ px: 2, pb: 1.5, pt: 0.5, background: '#FAFAFA', borderTop: `1px solid ${C.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                      <ClassificationBadge classification={selectedMove.classification ?? "mathematical"} />
                      <MoveKindBadge kind={selectedMove.kind} />
                    </Box>
                    <Typography sx={{ mb: 0.75, fontSize: '0.78rem', wordBreak: 'break-word', lineHeight: 1.5 }}>
                      <strong>Trigger:</strong> {selectedMove.trigger || <em style={{ color: '#9E9E9E' }}>none</em>}
                    </Typography>
                    <Typography sx={{ mb: 0.5, fontSize: '0.78rem', wordBreak: 'break-word', lineHeight: 1.5 }}>
                      <strong>Action:</strong> {selectedMove.action}
                    </Typography>

                    {/* Run button */}
                    <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button size="small" disabled={isBusy} variant="outlined"
                        onClick={() => void handleRunMove(selectedMove)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5,
                          fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                          color: '#2d5a2a', background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
                          borderColor: '#7ab872', borderRadius: '20px',
                          boxShadow: '0 2px 6px rgba(100,155,85,0.15)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 12px rgba(100,155,85,0.25)', transform: 'translateY(-1.5px)' },
                          '&:disabled': { opacity: 0.45, boxShadow: 'none', transform: 'none' },
                        }}>
                        {isBusy ? <SpinnerBox size={12} /> : <PlayIcon />}
                        {runState.phase === 'checking' ? 'Checking…' : runState.phase === 'applying' ? 'Applying…' : 'Run'}
                      </Button>
                      <Typography sx={{ fontSize: '0.7rem', color: '#90A4AE', fontStyle: 'italic' }}>
                        {selections.length === 0 ? 'No selection' : `${selections.length} selection${selections.length !== 1 ? 's' : ''}`}
                      </Typography>
                    </Box>

                    {/* Warning */}
                    {runState.phase === 'warning' && (
                      <Box sx={{ mt: 1.25, p: '10px 12px', borderRadius: '8px', background: '#FFFBEB', border: '1.5px solid #FDE68A', animation: 'slideInUp 0.2s ease-out' }}>
                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color: '#92400E', mb: 0.5 }}>
                          {runState.warningKind === 'apply' ? 'Move was not applied' : 'Trigger criterion not satisfied'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.73rem', color: '#78350F', lineHeight: 1.5, mb: 1 }}>{runState.warningReasoning}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          {runState.warningKind === 'apply' ? (
                            <Button size="small" onClick={() => void handleRunMove({ ...selectedMove!, runWithGuardrails: false }, true)}
                              sx={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'none', color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', transition: 'all 0.2s ease', '&:hover': { background: '#FDE68A', boxShadow: '0 2px 6px rgba(146,64,14,0.15)' } }}>
                              Run without guardrails
                            </Button>
                          ) : (
                            <Button size="small" onClick={() => void handleRunMove(selectedMove, true)}
                              sx={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'none', color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', transition: 'all 0.2s ease', '&:hover': { background: '#FDE68A', boxShadow: '0 2px 6px rgba(146,64,14,0.15)' } }}>
                              Apply anyway
                            </Button>
                          )}
                          <Button size="small" onClick={resetRunState}
                            sx={{ fontSize: '0.73rem', fontWeight: 600, textTransform: 'none', color: '#6B7280', background: 'white', border: '1px solid #E5E7EB', borderRadius: '6px', transition: 'all 0.2s ease', '&:hover': { background: '#F3F4F6', borderColor: '#D1D5DB' } }}>
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}

                    {/* Error */}
                    {runState.phase === 'error' && (
                      <Box sx={{ mt: 1.25, p: '8px 12px', borderRadius: '8px', background: '#FFF5F5', border: '1.5px solid #FFCDD2', display: 'flex', alignItems: 'flex-start', gap: 0.75, animation: 'slideInUp 0.2s ease-out' }}>
                        <Typography sx={{ fontSize: '0.73rem', color: '#C62828', lineHeight: 1.5, flex: 1 }}>{runState.errorText}</Typography>
                        <Button size="small" onClick={resetRunState} sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#C62828', minWidth: 0, p: '0 4px', transition: 'all 0.2s ease', '&:hover': { background: '#FEE2E2' } }}>✕</Button>
                      </Box>
                    )}

                    {/* Examples toggle */}
                    {selectedMove.examples.length > 0 && (
                      <>
                        <Button size="small" onClick={() => setExamplesOpen(v => !v)}
                          endIcon={<Box sx={{ display: 'flex', transition: 'transform 0.2s', transform: examplesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronIcon /></Box>}
                          sx={{ mt: 1, color: G.med, background: G.bg, border: `1px solid ${G.border}`, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', '&:hover': { background: '#DCEDC8' } }}>
                          Examples ({selectedMove.examples.length})
                        </Button>
                        {examplesOpen && (
                          <Box sx={{ mt: 1.25 }}>
                            {selectedMove.examples.map((ex, i) => <ExamplePreview key={i} example={ex} idx={i} />)}
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      ))}

      {/* ── Move Editor Dialog ── */}
      <Dialog
        open={editorOpen}
        onClose={handleCloseEditor}
        maxWidth="lg" fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', border: `1px solid #c0cedb`, height: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } } }}
      >
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 2.5, py: 1.5, borderBottom: '1px solid #c0cedb',
          background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)', flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A5F', letterSpacing: '-0.01em' }}>
              {editingMove ? `Edit Move — ${editingMove.name}` : 'New Move'}
            </Typography>
            {editorHasUnsavedChanges && (
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '4px', px: '6px', py: '2px' }}>
                unsaved changes
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <IconButton size="small" onClick={handleCloseEditor}
              sx={{ background: 'white', border: '1px solid #c0cedb', color: '#3A5B80', borderRadius: '8px', '&:hover': { background: '#E2E8F0' } }}>
              <CloseXIcon />
            </IconButton>
          </Box>
        </Box>
        <DialogContent sx={{ overflowY: 'auto', p: 2.5, background: '#f8fafc', flex: 1 }}>
          <MoveGenerator
            initialMove={editingMove}
            onSave={handleSaveMove}
            onHasUnsavedChanges={setEditorHasUnsavedChanges}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
