import React, { JSX, useContext, useState, useEffect, useRef, useCallback } from "react"
import { z } from "zod"
import {
  Box, Typography, Button, IconButton, Chip, Paper,
  Accordion, AccordionSummary, AccordionDetails,
  Select, MenuItem, Dialog, DialogContent, Tooltip,
} from "@mui/material"
import { ProofStateSelection, ProofStateSelectionContext } from "../core/ProofStateSelectionContext"
import { ProofState } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryAction, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove, ProofDiscoveryMoveExample } from "../core/ProofDiscoveryMove"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { ProofStateWithLibraryResult as ProofStateComponent } from "./ProofState"
import { runMove } from "../fetchers/Move"
import MoveGenerator from "../../tests/MoveGenerator"
import { moves } from "../prompts/AllMoves"
import { checkMoveValidity, FilterResponse } from "../fetchers/Filter"

/** Get all the applicable moves for a given proof state and selections. */
export async function getApplicableMoves(
  proofDiscoveryState: ProofDiscoveryState,
  selections: ProofStateSelection[],
  signal?: AbortSignal
): Promise<{ move: ProofDiscoveryMove, filterResponse: FilterResponse }[]> {
  const results = await Promise.all(
    moves.map(async (move) => {
      try {
        const filterResponse = await checkMoveValidity(getCurrentProofState(proofDiscoveryState), selections, move, signal)
        return filterResponse.meetsCondition ? { move, filterResponse } : null
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        console.error(`Error checking move validity for move ${move.name}:`, error)
        return null
      }
    })
  )

  return results.filter((result): result is { move: ProofDiscoveryMove, filterResponse: FilterResponse } => result !== null)
}

/** Apply a move to the current proof state. */
export async function applyMove(
  proofDiscoveryState: ProofDiscoveryState,
  selections: ProofStateSelection[],
  move: ProofDiscoveryMove,
  dispatchProofDiscoveryAction: React.Dispatch<ProofDiscoveryAction>,
  dispatchSelections: React.Dispatch<any>
): Promise<string | undefined> {
  const { proofState: newProofState, reasoning } = await runMove(
    getCurrentProofState(proofDiscoveryState),
    move,
    selections
  )

  dispatchProofDiscoveryAction({
    action: "transition",
    newProofState,
    move: {
      kind: move.kind,
      description: move.name,
      reasoning,
    },
  })
  dispatchSelections({ type: 'CLEAR_ALL_SELECTIONS' })

  return reasoning
}

// ─── Design tokens ──────────────────────────────────────────────────────────

const G = {
  dark:   '#064e3b',  // Sleek dark emerald
  med:    '#059669',  // Medium emerald
  bright: '#10b981',  // Bright action emerald
  light:  '#a7f3d0',  // Soft emerald
  bg:     '#f6fbf9',  // Sleek green-tinted background
  border: '#d1fae5',  // Soft green border
  text:   '#022c22',  // Slate dark green text
}

// ─── Inline SVG icons ────────────────────────────────────────────────────────

const ChevronIcon = ({ rotated = false }: { rotated?: boolean }) => (
  <svg style={{ width: 14, height: 14, transition: 'transform 0.2s', transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', display: 'block' }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const PlayIcon = () => (
  <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
)

const InfoIcon = () => (
  <svg style={{ width: 15, height: 15 }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
)

const ListIcon = () => (
  <svg style={{ width: 15, height: 15 }} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
)

const RefreshIcon = () => (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const SpinnerBox = ({ size = 20 }: { size?: number }) => {
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
      border: `2.5px solid ${G.border}`,
      borderTopColor: G.bright,
      borderRadius: '50%',
      animation: 'move-panel-spin 0.8s linear infinite',
    }} />
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type MovePanelStatus = "idle" | "loading" | "loaded" | "error"
type ApplicableMove = { move: ProofDiscoveryMove, filterResponse: FilterResponse }

function MoveKindBadge({ kind }: { kind: ProofDiscoveryMove["kind"] }): JSX.Element {
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
function ExamplePreview({ example, idx }: { example: ProofDiscoveryMoveExample, idx: number }): JSX.Element {
  const isExample = example.kind === "example"
  const accentColor = isExample ? G.bright : "#E53935"
  const borderColor = isExample ? G.border : "#FFCDD2"
  const bgColor     = isExample ? G.bg     : "#FFF5F5"
  const labelBg     = isExample ? '#DCEDC8' : '#FFEBEE'
  const labelFg     = isExample ? G.dark    : '#B71C1C'

  return (
    <Paper elevation={0} sx={{
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
            <ProofStateIdContext.Provider value={{ proofNodeId: 0, proofContextId: -1 }}>
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
    </Paper>
  )
}

// ─── Move Panel Component ─────────────────────────────────────────────────────

function MovePanelContent(): JSX.Element {
  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)

  const [status, setStatus] = useState<MovePanelStatus>("idle")
  const [applicableMoves, setApplicableMoves] = useState<ApplicableMove[]>([])
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set())
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null)
  const [infoIndex, setInfoIndex] = useState<number | null>(null)
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set())
  const [showAllMovesModal, setShowAllMovesModal] = useState(false)
  const [lastMoveReasoning, setLastMoveReasoning] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastFetchedSelectionsRef = useRef<string>("")
  const lastGraphOrderRef = useRef<number>(proofDiscoveryState.graph.order)

  const selectionsKey = JSON.stringify(selections)

  // Reset panel when graph node count changes (a move was applied externally, undo, etc.)
  useEffect(() => {
    const currentOrder = proofDiscoveryState.graph.order
    if (currentOrder !== lastGraphOrderRef.current) {
      lastGraphOrderRef.current = currentOrder
      setStatus("idle")
      setApplicableMoves([])
      setExpandedReasoning(new Set())
      setExpandedExamples(new Set())
      setInfoIndex(null)
      lastFetchedSelectionsRef.current = ""
    }
  }, [proofDiscoveryState.graph.order])

  // Debounce auto-fetch on selection change
  useEffect(() => {
    if (selectionsKey !== lastFetchedSelectionsRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (selections.length > 0) {
        debounceRef.current = setTimeout(() => { void fetchMoves() }, 0)
      } else {
        // Selections cleared — abort any in-flight request and reset to idle
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        lastFetchedSelectionsRef.current = selectionsKey
        setStatus("idle")
        setApplicableMoves([])
        setExpandedReasoning(new Set())
        setExpandedExamples(new Set())
        setInfoIndex(null)
      }
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionsKey])

  const fetchMoves = useCallback(async () => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setStatus("loading")
    setErrorMessage("")
    setExpandedReasoning(new Set())
    setExpandedExamples(new Set())
    setInfoIndex(null)
    try {
      const result = await getApplicableMoves(proofDiscoveryState, selections, controller.signal)
      setApplicableMoves(result)
      setStatus("loaded")
      lastFetchedSelectionsRef.current = selectionsKey
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setErrorMessage(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proofDiscoveryState, selections, selectionsKey])

  const handleApply = async (am: ApplicableMove, idx: number) => {
    setApplyingIndex(idx)
    try {
      const reasoning = await applyMove(
        proofDiscoveryState,
        selections,
        am.move,
        dispatchProofDiscoveryAction,
        dispatchSelections
      )
      setLastMoveReasoning(reasoning ?? null)
      setStatus("idle")
      setApplicableMoves([])
      lastFetchedSelectionsRef.current = ""
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to apply move")
      setStatus("error")
    } finally {
      setApplyingIndex(null)
    }
  }

  const toggleReasoning = (idx: number) => {
    setExpandedReasoning(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }
  const toggleExamples = (idx: number) => {
    setExpandedExamples(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }

// ── Render suggestions ──────────────────────────────────────────────────────

  const renderMoveSuggestions = () => {
    if ((status === "idle" || status === "error") && selections.length === 0 && lastMoveReasoning) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', p: 1.5, flex: 1, minHeight: 0, gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, pb: 0.5, borderBottom: `1px solid ${G.border}` }}>
            <Box sx={{ color: G.bright, display: 'flex' }}>
              <svg style={{ width: 18, height: 18 }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reasoning Trace</Typography>
          </Box>
          <Box sx={{
              flex: 1, overflowY: 'auto', p: 1.5,
              background: '#F9FBF2', borderRadius: '8px',
              border: `1px solid ${G.border}`, fontSize: '0.78rem',
              color: '#334155', whiteSpace: 'pre-wrap',
              lineHeight: 1.6, fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace",
          }}>
            {lastMoveReasoning}
          </Box>
        </Box>
      )
    }

    if (selections.length === 0 && status !== "loaded") {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: '2.5rem 1.5rem', textAlign: 'center', flex: 1 }}>
          <svg style={{ width: 32, height: 32, color: '#B0BEC5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#546E7A', fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace" }}>No selection</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#90A4AE', maxWidth: 260, lineHeight: 1.5 }}>
            Click on hypotheses, goals, or sub-expressions to generate suggestions
          </Typography>
        </Box>
      )
    }

    if (status === "idle") {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: '2rem 1.5rem', textAlign: 'center', flex: 1 }}>
          <svg style={{ width: 28, height: 28, color: G.bright }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: G.dark }}>Generating suggestions…</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#78909C', maxWidth: 260, lineHeight: 1.5 }}>
            Suggestions will appear automatically when you make a selection
          </Typography>
        </Box>
      )
    }

    if (status === "loading") {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: '2rem 1.5rem', flex: 1 }}>
          <SpinnerBox size={24} />
          <Typography sx={{ color: G.dark, fontSize: '0.85rem', fontWeight: 500 }}>Checking applicable moves…</Typography>
        </Box>
      )
    }

    if (status === "error") {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: '2rem 1.5rem', flex: 1 }}>
          <svg style={{ width: 28, height: 28, color: '#E53935' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <Typography sx={{ fontSize: '0.85rem', color: '#C62828', fontWeight: 600 }}>Error</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#C62828', textAlign: 'center' }}>{errorMessage}</Typography>
          <Button size="small" variant="outlined" onClick={() => void fetchMoves()}
            sx={{ color: '#C62828', borderColor: '#FFCDD2', fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '8px', '&:hover': { background: '#FFF5F5', borderColor: '#E53935' } }}>
            Retry
          </Button>
        </Box>
      )
    }

    // Loaded
    return (
      <>
        {/* Last move reasoning — collapsed Accordion */}
        {lastMoveReasoning && (
          <Accordion disableGutters elevation={0} sx={{
            mx: 1, mt: 1, borderRadius: '8px !important',
            background: '#F9FBF2',
            border: `1px solid ${G.border}`,
            '&:before': { display: 'none' },
          }}>
            <AccordionSummary
              expandIcon={<Box sx={{ color: G.med, display: 'flex' }}><ChevronIcon /></Box>}
              sx={{ minHeight: 36, px: 1.5, py: 0, '& .MuiAccordionSummary-content': { my: 0.625 } }}
            >
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: G.med }}>
                Reasoning from last move
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1.5, pb: 1.25, pt: 0 }}>
              <Box component="pre" sx={{
                fontSize: '0.75rem', color: G.dark, whiteSpace: 'pre-wrap',
                m: 0, p: 1.25, background: 'white', borderRadius: '6px',
                border: `1px solid ${G.border}`, lineHeight: 1.55,
                fontFamily: 'inherit',
              }}>
                {lastMoveReasoning}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Move list */}
        {applicableMoves.length === 0 ? (
          <Typography sx={{ p: '2.5rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#78909C', fontStyle: 'italic' }}>
            No applicable moves for the current selection.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, gap: 0.75 }}>
            {applicableMoves.map((am, idx) => (
              <Paper key={idx} elevation={0} sx={{
                display: 'flex', flexDirection: 'column',
                background: 'white', border: `1px solid ${G.border}`,
                borderRadius: '10px', overflow: 'hidden',
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: `0 2px 8px rgba(67,160,71,0.12)` },
              }}>
                {/* Move row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: '6px 6px 6px 8px' }}>
                  <Button
                    onClick={() => void handleApply(am, idx)}
                    disabled={applyingIndex !== null}
                    sx={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 1,
                      p: '7px 10px', fontSize: '0.83rem', fontWeight: 600,
                      color: applyingIndex !== null && applyingIndex !== idx ? '#B0BEC5' : G.dark,
                      background: G.bg, border: `1.5px solid ${G.border}`,
                      borderRadius: '8px', cursor: 'pointer', textTransform: 'none',
                      justifyContent: 'flex-start',
                      '&:hover': { background: '#DCEDC8', borderColor: G.light },
                      '&:disabled': { background: '#F5F5F5', borderColor: '#E0E0E0' },
                    }}
                  >
                    {applyingIndex === idx
                      ? <SpinnerBox size={14} />
                      : <Box sx={{ color: G.bright, display: 'flex', flexShrink: 0 }}><PlayIcon /></Box>
                    }
                    <Box sx={{ flex: 1, textAlign: 'left' }}>{am.move.name}</Box>
                    <MoveKindBadge kind={am.move.kind} />
                  </Button>

                  <Tooltip title="View move details">
                    <IconButton
                      size="small"
                      onClick={() => setInfoIndex(infoIndex === idx ? null : idx)}
                      sx={{
                        width: 30, height: 30, borderRadius: '8px',
                        background: infoIndex === idx ? G.bg : 'white',
                        border: `1.5px solid ${infoIndex === idx ? G.light : G.border}`,
                        color: G.med, flexShrink: 0,
                        '&:hover': { background: G.bg, borderColor: G.light },
                      }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Info panel */}
                {infoIndex === idx && (
                  <Box sx={{ px: 1.5, pb: 1.25, pt: 0.5, background: '#FAFAFA', borderTop: `1px solid ${G.border}` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: G.dark, mb: 0.75, pb: 0.5, borderBottom: '1px solid #EEEEEE' }}>{am.move.name}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', mb: 0.5 }}><strong>Kind:</strong> <MoveKindBadge kind={am.move.kind} /></Typography>
                    <Typography sx={{ fontSize: '0.78rem', mb: 0.5, lineHeight: 1.5, wordBreak: 'break-word' }}><strong>Trigger:</strong> {am.move.trigger}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', mb: 0.5, lineHeight: 1.5, wordBreak: 'break-word' }}><strong>Action:</strong> {am.move.action}</Typography>

                    {am.move.examples.length > 0 && (
                      <>
                        <Button
                          size="small"
                          onClick={() => toggleExamples(idx)}
                          endIcon={<Box sx={{ display: 'flex', transition: 'transform 0.2s', transform: expandedExamples.has(idx) ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronIcon /></Box>}
                          sx={{
                            mt: 0.75, color: G.med, background: G.bg, border: `1px solid ${G.border}`,
                            borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
                            '&:hover': { background: '#DCEDC8' },
                          }}
                        >
                          Examples ({am.move.examples.length})
                        </Button>
                        {expandedExamples.has(idx) && (
                          <Box sx={{ mt: 0.75 }}>
                            {am.move.examples.map((ex, exIdx) => (
                              <ExamplePreview key={exIdx} example={ex} idx={exIdx} />
                            ))}
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                )}

                {/* Collapsible reasoning */}
                <Box sx={{ borderTop: `1px solid ${G.border}` }}>
                  <Button
                    size="small"
                    onClick={() => toggleReasoning(idx)}
                    endIcon={<Box sx={{ display: 'flex', transition: 'transform 0.2s', transform: expandedReasoning.has(idx) ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronIcon /></Box>}
                    sx={{
                      width: '100%', justifyContent: 'flex-start', color: '#78909C',
                      fontSize: '0.73rem', fontWeight: 500, textTransform: 'none',
                      px: 1.5, py: 0.5, borderRadius: 0,
                      '&:hover': { background: G.bg, color: G.med },
                    }}
                  >
                    Reasoning
                  </Button>
                  {expandedReasoning.has(idx) && (
                    <Box sx={{ px: 1.5, pb: 1.25, pt: 0 }}>
                      <Typography sx={{
                        fontSize: '0.75rem', color: '#546E7A', lineHeight: 1.55,
                        p: 1.25, whiteSpace: 'pre-wrap', background: '#F9FBF2',
                        borderRadius: '6px', borderLeft: `3px solid ${G.bright}`,
                      }}>
                        {am.filterResponse.reasoning}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </>
    )
  }

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#ffffff', borderRadius: '12px' }}
    >
      {/* Header (aligned with Library header) */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        px: 2, height: '44px', boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
        borderBottom: '1px solid #c0cedb',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, color: '#2e4a68' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e4a68' }}>
            {status === "loaded"
              ? `${applicableMoves.length} Move Suggested`
              : "Move Suggestions"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.625 }}>
          <Tooltip title="View all available moves">
            <IconButton size="small" onClick={() => setShowAllMovesModal(true)}
              sx={{ width: 24, height: 24, borderRadius: '6px', border: '1px solid rgba(180,200,220,0.6)', color: '#3a5070', background: 'rgba(255,255,255,0.5)', '&:hover': { background: 'rgba(255,255,255,0.9)', borderColor: '#8aabcc' } }}>
              <ListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh suggestions">
            <IconButton size="small" onClick={() => void fetchMoves()}
              sx={{ width: 24, height: 24, borderRadius: '6px', border: '1px solid rgba(180,200,220,0.6)', color: '#3a5070', background: 'rgba(255,255,255,0.5)', '&:hover': { background: 'rgba(255,255,255,0.9)', borderColor: '#8aabcc' } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Scrollable suggestions */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {renderMoveSuggestions()}
      </Box>

      {/* Custom move section */}
      <Box sx={{ flexShrink: 0 }}>
        <CustomMoveSection />
      </Box>

      {/* All moves modal */}
      <Dialog
        open={showAllMovesModal}
        onClose={() => setShowAllMovesModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', border: `1px solid #c0cedb`, overflow: 'hidden' } } }}
      >
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 2.5, py: 1.5, borderBottom: `1px solid #c0cedb`,
          background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)', flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1E3A5F', letterSpacing: '-0.01em' }}>
            Library of Moves
          </Typography>
          <IconButton size="small" onClick={() => setShowAllMovesModal(false)}
            sx={{ background: 'white', border: `1px solid #c0cedb`, color: '#3A5B80', borderRadius: '8px', '&:hover': { background: '#E2E8F0' } }}>
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          <AllMovesList />
        </DialogContent>
      </Dialog>
    </Box>
  )
}

// ─── Custom Move Section ──────────────────────────────────────────────────────

function CustomMoveSection(): JSX.Element {
  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)
  const [description, setDescription] = useState("")
  const [kind, setKind] = useState<import("../core/ProofDiscoveryMove").MoveKind>("strengthening")
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")

  const handleApply = async () => {
    if (!description.trim()) return
    const customMove: ProofDiscoveryMove = {
      name: description.trim(),
      kind,
      trigger: "",
      action: description.trim(),
      examples: [],
    }
    setApplying(true)
    setError("")
    try {
      await applyMove(proofDiscoveryState, selections, customMove, dispatchProofDiscoveryAction, dispatchSelections)
      setDescription("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply move")
    } finally {
      setApplying(false)
    }
  }

  return (
    <Box sx={{
      background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)',
      borderTop: '1px solid #c0cedb',
      p: '10px 14px 12px',
    }}>
      {/* Section header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.875 }}>
        <Typography sx={{
          fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#2e4a68',
        }}>
          Custom Move
        </Typography>
        {selections.length === 0 && (
          <Chip label="No selection" size="small"
            sx={{
              height: 17, fontSize: '0.61rem', fontWeight: 600,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace",
              background: 'rgba(255,255,255,0.7)', color: '#64748B',
              border: '1px solid rgba(180,200,220,0.6)', borderRadius: '5px',
              '& .MuiChip-label': { px: '6px' },
            }}
          />
        )}
      </Box>

      {/* Textarea */}
      <Box
        component="textarea"
        value={description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        placeholder="Describe a move to apply..."
        rows={2}
        sx={{
          width: '100%', fontSize: '0.78rem', color: '#1e3a5f',
          border: '1.5px solid rgba(180,200,220,0.7)', borderRadius: '7px',
          p: '7px 9px', resize: 'vertical',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace",
          boxSizing: 'border-box', outline: 'none',
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(2px)',
          lineHeight: 1.45,
          boxShadow: 'inset 0 1px 3px rgba(30,60,100,0.06)',
          display: 'block',
          '&::placeholder': { color: '#8aabcc' },
          '&:focus': { borderColor: '#8aabcc', background: 'rgba(255,255,255,0.9)', boxShadow: '0 0 0 3px rgba(138,171,204,0.15), inset 0 1px 3px rgba(30,60,100,0.06)' },
        }}
      />

      {/* Controls row */}
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mt: 0.75 }}>
        <Select
          size="small"
          value={kind}
          onChange={e => setKind(e.target.value as import("../core/ProofDiscoveryMove").MoveKind)}
          sx={{
            flex: 1, fontSize: '0.72rem', fontWeight: 600, color: '#2e4a68',
            background: 'rgba(255,255,255,0.65)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(180,200,220,0.7)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8aabcc' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8aabcc', borderWidth: '1.5px' },
            '& .MuiSelect-select': { py: '5px', px: '8px' },
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
          <MenuItem value="strengthening" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#2e4a68', '&:hover': { background: 'rgba(138,171,204,0.15)' }, '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: '#1e3a5f' }, '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' } }}>strengthening</MenuItem>
          <MenuItem value="weakening"     sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#2e4a68', '&:hover': { background: 'rgba(138,171,204,0.15)' }, '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: '#1e3a5f' }, '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' } }}>weakening</MenuItem>
          <MenuItem value="equivalence"   sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#2e4a68', '&:hover': { background: 'rgba(138,171,204,0.15)' }, '&.Mui-selected': { background: 'rgba(138,171,204,0.2)', color: '#1e3a5f' }, '&.Mui-selected:hover': { background: 'rgba(138,171,204,0.28)' } }}>equivalence</MenuItem>
        </Select>
        <Button
          onClick={() => void handleApply()}
          disabled={applying || !description.trim()}
          size="small"
          variant="outlined"
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1.5, fontSize: '0.75rem', fontWeight: 700,
            color: '#2d5a2a', background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
            borderColor: '#7ab872', borderRadius: '20px', textTransform: 'none', flexShrink: 0,
            boxShadow: '0 2px 6px rgba(100,155,85,0.18)',
            transition: 'all 0.2s ease',
            '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 10px rgba(100,155,85,0.28)', transform: 'translateY(-1px)' },
            '&:disabled': { opacity: 0.45, boxShadow: 'none', transform: 'none' },
          }}
        >
          {applying && <SpinnerBox size={12} />}
          Apply
        </Button>
      </Box>

      {error && (
        <Typography sx={{ mt: 0.625, fontSize: '0.7rem', color: '#C62828', p: '4px 8px', background: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: '6px' }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}

// ─── All Moves List ────────────────────────────────────────────────────────

type RunPhase = 'idle' | 'checking' | 'warning' | 'applying' | 'error'
type RunState = { phase: RunPhase; warningReasoning?: string; errorText?: string }

function AllMovesList(): JSX.Element {
  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [runState, setRunState] = useState<RunState>({ phase: 'idle' })

  const selected = selectedIdx !== null ? moves[selectedIdx] : null

  const resetRunState = () => setRunState({ phase: 'idle' })

  const handleRunMove = async (move: ProofDiscoveryMove, skipCheck = false) => {
    if (!skipCheck) {
      setRunState({ phase: 'checking' })
      try {
        const filterResponse = await checkMoveValidity(
          getCurrentProofState(proofDiscoveryState),
          selections,
          move
        )
        if (!filterResponse.meetsCondition) {
          setRunState({ phase: 'warning', warningReasoning: filterResponse.reasoning })
          return
        }
      } catch (err) {
        setRunState({ phase: 'error', errorText: err instanceof Error ? err.message : 'Failed to check trigger criterion' })
        return
      }
    }

    setRunState({ phase: 'applying' })
    try {
      await applyMove(proofDiscoveryState, selections, move, dispatchProofDiscoveryAction, dispatchSelections)
      resetRunState()
    } catch (err) {
      setRunState({ phase: 'error', errorText: err instanceof Error ? err.message : 'Failed to apply move' })
    }
  }

  const isBusy = runState.phase === 'checking' || runState.phase === 'applying'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: '12px 16px 8px' }}>
        <Button
          onClick={() => setShowGenerator(true)}
          fullWidth
          variant="outlined"
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
            p: '10px', borderRadius: '12px',
            background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
            color: '#2d5a2a', borderColor: '#7ab872', textTransform: 'none',
            fontSize: '0.85rem', fontWeight: 700,
            boxShadow: '0 2px 8px rgba(100,155,85,0.18)',
            transition: 'all 0.2s ease',
            '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 14px rgba(100,155,85,0.28)', transform: 'translateY(-1px)' },
          }}
        >
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Move Definition
        </Button>
      </Box>

      <Box sx={{ borderTop: `1px solid ${G.border}` }}>
        {moves.map((move, idx) => (
          <Box key={idx} sx={{ borderBottom: `1px solid ${G.border}` }}>
            <Button
              onClick={() => { setSelectedIdx(selectedIdx === idx ? null : idx); setExamplesOpen(false); resetRunState() }}
              fullWidth
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1.75, py: 1.25, border: 'none',
                background: selectedIdx === idx ? G.bg : 'transparent',
                justifyContent: 'flex-start', textTransform: 'none',
                borderRadius: 0,
                '&:hover': { background: G.bg },
              }}
            >
              <Box sx={{ flex: 1, textAlign: 'left' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: selectedIdx === idx ? 700 : 600, color: selectedIdx === idx ? G.dark : '#374151' }}>
                  {move.name}
                </Typography>
              </Box>
              <MoveKindBadge kind={move.kind} />
              <Box sx={{ display: 'flex', color: '#9E9E9E', transition: 'transform 0.2s', transform: selectedIdx === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <ChevronIcon />
              </Box>
            </Button>
            {selectedIdx === idx && selected && (
              <Box sx={{ px: 2, pb: 1.5, background: '#FAFAFA', fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>
                <Typography sx={{ mb: 0.75, fontSize: '0.78rem', wordBreak: 'break-word' }}>
                  <strong>Trigger:</strong> {selected.trigger || <em style={{ color: '#9E9E9E' }}>none</em>}
                </Typography>
                <Typography sx={{ mb: 0.5, fontSize: '0.78rem', wordBreak: 'break-word' }}>
                  <strong>Action:</strong> {selected.action}
                </Typography>

                {/* ── Run button ── */}
                <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    disabled={isBusy}
                    variant="outlined"
                    onClick={() => void handleRunMove(selected)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.75,
                      px: 1.5, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                      color: '#2d5a2a', background: 'linear-gradient(180deg, #e8f5e3 0%, #c5dfc0 100%)',
                      borderColor: '#7ab872', borderRadius: '20px',
                      boxShadow: '0 2px 6px rgba(100,155,85,0.18)',
                      transition: 'all 0.2s ease',
                      '&:hover': { background: 'linear-gradient(180deg, #c5dfc0, #a3cfa0)', borderColor: '#5a9e54', boxShadow: '0 4px 10px rgba(100,155,85,0.28)', transform: 'translateY(-1px)' },
                      '&:disabled': { opacity: 0.45, boxShadow: 'none', transform: 'none' },
                    }}
                  >
                    {isBusy ? <SpinnerBox size={12} /> : <PlayIcon />}
                    {runState.phase === 'checking' ? 'Checking…' : runState.phase === 'applying' ? 'Applying…' : 'Run'}
                  </Button>
                  {selections.length === 0 && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#90A4AE', fontStyle: 'italic' }}>
                      No selection active
                    </Typography>
                  )}
                </Box>

                {/* ── Warning strip ── */}
                {runState.phase === 'warning' && (
                  <Box sx={{
                    mt: 1.25, p: '10px 12px', borderRadius: '8px',
                    background: '#FFFBEB', border: '1.5px solid #FDE68A',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                      <svg style={{ width: 15, height: 15, color: '#D97706', flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>
                        Trigger criterion not satisfied
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.73rem', color: '#78350F', lineHeight: 1.5, mb: 1 }}>
                      {runState.warningReasoning}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Button
                        size="small"
                        onClick={() => void handleRunMove(selected, true)}
                        sx={{
                          fontSize: '0.73rem', fontWeight: 700, textTransform: 'none',
                          color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A',
                          borderRadius: '6px',
                          '&:hover': { background: '#FDE68A' },
                        }}
                      >
                        Apply anyway
                      </Button>
                      <Button
                        size="small"
                        onClick={resetRunState}
                        sx={{
                          fontSize: '0.73rem', fontWeight: 600, textTransform: 'none',
                          color: '#6B7280', background: 'white', border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          '&:hover': { background: '#F3F4F6' },
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* ── Error strip ── */}
                {runState.phase === 'error' && (
                  <Box sx={{
                    mt: 1.25, p: '8px 12px', borderRadius: '8px',
                    background: '#FFF5F5', border: '1.5px solid #FFCDD2',
                    display: 'flex', alignItems: 'flex-start', gap: 0.75,
                  }}>
                    <svg style={{ width: 14, height: 14, color: '#E53935', marginTop: 2, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <Typography sx={{ fontSize: '0.73rem', color: '#C62828', lineHeight: 1.5, flex: 1 }}>
                      {runState.errorText}
                    </Typography>
                    <Button size="small" onClick={resetRunState} sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#C62828', minWidth: 0, p: '0 4px' }}>
                      ✕
                    </Button>
                  </Box>
                )}

                {selected.examples.length > 0 && (
                  <>
                    <Button
                      size="small"
                      onClick={() => setExamplesOpen(v => !v)}
                      endIcon={<Box sx={{ display: 'flex', transition: 'transform 0.2s', transform: examplesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronIcon /></Box>}
                      sx={{
                        mt: 1, color: G.med, background: G.bg, border: `1px solid ${G.border}`,
                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                        '&:hover': { background: '#DCEDC8' },
                      }}
                    >
                      Examples ({selected.examples.length})
                    </Button>
                    {examplesOpen && (
                      <Box sx={{ mt: 1.25 }}>
                        {selected.examples.map((ex, exIdx) => (
                          <ExamplePreview key={exIdx} example={ex} idx={exIdx} />
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Move generator dialog */}
      <Dialog
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', border: `1px solid ${G.border}`, height: '85vh', overflow: 'hidden' } } }}
      >
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 2.5, py: 1.5, borderBottom: `1px solid ${G.border}`,
          background: 'linear-gradient(180deg, #f8fafb 0%, #edf2f7 100%)', flexShrink: 0,
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A5F', letterSpacing: '-0.01em' }}>
            Move Generator
          </Typography>
          <IconButton size="small" onClick={() => setShowGenerator(false)}
            sx={{ background: 'white', border: `1px solid ${G.border}`, color: '#3A5B80', borderRadius: '8px', '&:hover': { background: '#E2E8F0' } }}>
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </IconButton>
        </Box>
        <DialogContent sx={{ overflowY: 'auto', p: 3, background: '#F8FAFC' }}>
          <MoveGenerator />
        </DialogContent>
      </Dialog>
    </Box>
  )
}

// ─── Public Move Panel ────────────────────────────────────────────────────────

export function MovePanel(): JSX.Element {
  return <MovePanelContent />
}
