import React, { JSX, useContext, useState, useEffect, useRef, useCallback } from "react"
import { z } from "zod"
import {
  Box, Typography, Button, IconButton, Chip, Paper,
  Accordion, AccordionSummary, AccordionDetails,
  Select, MenuItem, Dialog, DialogContent, Tooltip,
} from "@mui/material"
import { ProofStateSelection, ProofStateSelectionContext, ProofStateLocationContext, toProofStateSelectionWithPolarity, selectionPolarity } from "../core/ProofStateSelectionContext"
import { ContextVariable, ProofState, Statement } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryAction, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove, ProofDiscoverySuggestionMove } from "../core/ProofDiscoveryMove"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { MathStatement } from "./MathStatement"
import { moves, suggestionMoves } from "../prompts/moves"
import { useMoveSet } from "./MoveSetContext"
import { checkMoveValidity, FilterResponse } from "../fetchers/filter"
import { suggestStatements, SuggestResult, SuggestResults } from "../fetchers/suggest"
import {
  applyMove, G, L,
  ChevronIcon, PlayIcon, SpinnerBox,
  MoveKindBadge, ExamplePreview,
  AllMovesList,
} from "./MovesList"

/** Get all the applicable moves for a given proof state and selections. */
export async function getApplicableMoves(
  proofDiscoveryState: ProofDiscoveryState,
  selections: ProofStateSelection[],
  signal?: AbortSignal,
  movesToCheck: ProofDiscoveryMove[] = moves
): Promise<{ move: ProofDiscoveryMove, filterResponse: FilterResponse }[]> {
  return []
  // const results = await Promise.all(
  //   movesToCheck.map(async (move) => {
  //     try {
  //       const filterResponse = await checkMoveValidity({ 
  //         proofState: getCurrentProofState(proofDiscoveryState), 
  //         selections: selections.map(toProofStateSelectionWithPolarity), 
  //         name: move.name, 
  //         triggerCriterion: move.trigger 
  //       }, signal)
  //       return filterResponse.meetsCondition ? { move, filterResponse } : null
  //     } catch (error) {
  //       if (error instanceof DOMException && error.name === 'AbortError') throw error
  //       console.error(`Error checking move validity for move ${move.name}:`, error)
  //       return null
  //     }
  //   })
  // )

  // return results.filter((result): result is { move: ProofDiscoveryMove, filterResponse: FilterResponse } => result !== null)
}

/** Apply a move to the current proof state. */

export function getVariablesInProofState(proofState: ProofState): ContextVariable[] {
  const variables = proofState.flatMap(context => context.variables)
  const seen = new Set<string>()
  return variables.filter(v => {
    const key = `${v.name}:${v.kind}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function statementToString(statement: Statement): string {
  if (typeof statement === 'string') return statement
  return JSON.stringify(statement)
}

/** Get all applicable suggestion moves for a given proof state and selections. */
export async function getApplicableSuggestionMoves(
  proofDiscoveryState: ProofDiscoveryState,
  selections: ProofStateSelection[],
  signal?: AbortSignal
): Promise<{ move: ProofDiscoverySuggestionMove, filterResponse: FilterResponse }[]> {
  const results = await Promise.all(
    suggestionMoves.map(async (move) => {
      try {
        const filterResponse = await checkMoveValidity({
          proofState: getCurrentProofState(proofDiscoveryState),
          selections: selections.map(toProofStateSelectionWithPolarity),
          name: move.name,
          triggerCriterion: move.trigger
        }, signal)
        return filterResponse.meetsCondition ? { move, filterResponse } : null
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        console.error(`Error checking suggestion move validity for ${move.name}:`, error)
        return null
      }
    })
  )
  return results.filter((r): r is { move: ProofDiscoverySuggestionMove, filterResponse: FilterResponse } => r !== null)
}

/** Fetch suggestions for a suggestion move. */
export async function fetchSuggestions(
  proofDiscoveryState: ProofDiscoveryState,
  move: ProofDiscoverySuggestionMove,
  mainSelections: ProofStateSelection[],
  additionalSelections: ProofStateSelection[]
): Promise<SuggestResults> {
  return suggestStatements({
    variables: getVariablesInProofState(getCurrentProofState(proofDiscoveryState)),
    mainSelections: mainSelections.map(selection => {
        return {
            selection: typeof selection.selection === 'string' || 'kind' in selection.selection ? selection.selection : selection.selection.text,
            polarity: selectionPolarity(selection)
        }
    }),
    additionalSelections: additionalSelections.map(selection => {
        return {
            selection: typeof selection.selection === 'string' || 'kind' in selection.selection ? selection.selection : selection.selection.text,
            polarity: selectionPolarity(selection)
        }
    }),
    instructions: move.suggestionPrompt
  })
}

/** Apply a selected suggestion result from a suggestion move. */
export async function applySuggestionResult(
  proofDiscoveryState: ProofDiscoveryState,
  move: ProofDiscoverySuggestionMove,
  mainSelections: ProofStateSelection[],
  result: SuggestResult,
  dispatchProofDiscoveryAction: React.Dispatch<ProofDiscoveryAction>,
  dispatchSelections: React.Dispatch<any>
): Promise<string | undefined> {
  const parts = [move.applySuggestionMove.action]
  if (result.suggestion !== null) {
    parts.push(`The specific suggestion chosen by the user is: ${statementToString(result.suggestion)}`)
  }
  if (result.generalResult !== null) {
    parts.push(`The following general result is provided for context — "${result.generalResult.label}": ${statementToString(result.generalResult.statement)}`)
  }

  const augmentedMove: ProofDiscoveryMove = {
    ...move.applySuggestionMove,
    action: parts.join('\n\n')
  }

  const reasoning = await applyMove(
    proofDiscoveryState,
    mainSelections,
    augmentedMove,
    dispatchProofDiscoveryAction,
    dispatchSelections
  )

  if (result.generalResult) {
    dispatchProofDiscoveryAction({ action: "addToLibrary", statement: result.generalResult })
  }

  return reasoning
}
  

// ─── Design tokens ──────────────────────────────────────────────────────────

// Purple palette — suggestion moves
const P = {
  dark:   '#4c1d95',
  med:    '#7c3aed',
  bright: '#8b5cf6',
  light:  '#ddd6fe',
  bg:     '#faf5ff',
  border: '#ede9fe',
}

// ─── Inline SVG icons ────────────────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

type MovePanelStatus = "idle" | "loading" | "loaded" | "error"
type ApplicableMove = { move: ProofDiscoveryMove, filterResponse: FilterResponse }
type ApplicableSuggestionMove = { move: ProofDiscoverySuggestionMove, filterResponse: FilterResponse }

type SuggestionWorkflow = {
  move: ProofDiscoverySuggestionMove
  mainSelections: ProofStateSelection[]
} & (
  | { phase: "ready" }
  | { phase: "loading" }
  | { phase: "loaded"; results: SuggestResults }
  | { phase: "applying"; results: SuggestResults; applyingIdx: number }
  | { phase: "error"; error: string }
)

/** Render a Statement non-interactively (no selection toggling). */
function StaticStatement({ statement }: { statement: Statement }): JSX.Element {
  return (
    <ProofStateIdContext.Provider value={{ proofNodeId: -99, proofContextId: -1 }}>
      <ProofStateSelectionContext.Provider value={{ selections: [], dispatch: () => {} }}>
        <ProofStateLocationContext.Provider value={{ kind: "hypothesis", label: "suggestion" }}>
          <MathStatement address={[]} statement={statement} polarity={null} />
        </ProofStateLocationContext.Provider>
      </ProofStateSelectionContext.Provider>
    </ProofStateIdContext.Provider>
  )
}

// ─── Move Panel Component ─────────────────────────────────────────────────────

function MovePanelContent({ onLoadingChange }: { onLoadingChange?: (isLoading: boolean) => void }): JSX.Element {
  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)

  const [status, setStatus] = useState<MovePanelStatus>("idle")
  const [customInputActive, setCustomInputActive] = useState(false)
  const [applicableMoves, setApplicableMoves] = useState<ApplicableMove[]>([])
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set())
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null)
  const [infoIndex, setInfoIndex] = useState<number | null>(null)
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set())
  const [showAllMovesModal, setShowAllMovesModal] = useState(false)
  const [lastMoveReasoning, setLastMoveReasoning] = useState<string | null>(null)
  const [suggestionWorkflow, setSuggestionWorkflow] = useState<SuggestionWorkflow | null>(null)
  const [expandedGeneralResults, setExpandedGeneralResults] = useState<Set<number>>(new Set())

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
      setSuggestionWorkflow(null)
      setExpandedReasoning(new Set())
      setExpandedExamples(new Set())
      setInfoIndex(null)
      lastFetchedSelectionsRef.current = ""
    }
  }, [proofDiscoveryState.graph.order])

  // Notify parent when loading state changes
  useEffect(() => {
    onLoadingChange?.(status === "loading")
  }, [status, onLoadingChange])

  // Abort in-flight suggestion fetch when user starts typing in the custom move box
  useEffect(() => {
    if (!customInputActive) return
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setStatus("idle")
    setApplicableMoves([])
    lastFetchedSelectionsRef.current = ""
  }, [customInputActive])

  // Debounce auto-fetch on selection change (skip while in suggestion workflow or custom input active)
  useEffect(() => {
    if (suggestionWorkflow !== null) return
    if (customInputActive) return
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
  }, [selectionsKey, suggestionWorkflow, customInputActive])

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
      const regularMoves = await getApplicableMoves(proofDiscoveryState, selections, controller.signal)
      setApplicableMoves(regularMoves)
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
  const renderMoveCard = (am: ApplicableMove, idx: number) => {
    const isLogical = am.move.classification === "logical"
    const C = isLogical ? L : G
    const hoverBg = isLogical ? '#F3F4F6' : '#DCEDC8'
    return (
      <Paper key={idx} elevation={0} sx={{
        display: 'flex', flexDirection: 'column',
        background: 'white', border: `1px solid ${C.border}`,
        borderRadius: '10px', overflow: 'hidden',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: isLogical ? '0 2px 6px rgba(107,114,128,0.10)' : '0 2px 8px rgba(67,160,71,0.12)' },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: '6px 6px 6px 8px' }}>
          <Button
            onClick={() => void handleApply(am, idx)}
            disabled={applyingIndex !== null}
            sx={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 1,
              p: '7px 10px', fontSize: '0.83rem', fontWeight: 600,
              color: applyingIndex !== null && applyingIndex !== idx ? '#B0BEC5' : C.dark,
              background: C.bg, border: `1.5px solid ${C.border}`,
              borderRadius: '8px', cursor: 'pointer', textTransform: 'none',
              justifyContent: 'flex-start',
              '&:hover': { background: hoverBg, borderColor: C.bright },
              '&:disabled': { background: '#F5F5F5', borderColor: '#E0E0E0' },
            }}
          >
            {applyingIndex === idx ? <SpinnerBox size={14} /> : <Box sx={{ color: C.bright, display: 'flex', flexShrink: 0 }}><PlayIcon /></Box>}
            <Box sx={{ flex: 1, textAlign: 'left' }}>{am.move.name}</Box>
            <MoveKindBadge kind={am.move.kind} />
          </Button>
          <Tooltip title="View move details">
            <IconButton size="small" onClick={() => setInfoIndex(infoIndex === idx ? null : idx)}
              sx={{
                width: 30, height: 30, borderRadius: '8px',
                background: infoIndex === idx ? C.bg : 'white',
                border: `1.5px solid ${infoIndex === idx ? C.bright : C.border}`,
                color: C.med, flexShrink: 0,
                '&:hover': { background: C.bg, borderColor: C.bright },
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {infoIndex === idx && (
          <Box sx={{ px: 1.5, pb: 1.25, pt: 0.5, background: '#FAFAFA', borderTop: `1px solid ${C.border}` }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: C.dark, mb: 0.75, pb: 0.5, borderBottom: '1px solid #EEEEEE' }}>{am.move.name}</Typography>
            <Typography sx={{ fontSize: '0.78rem', mb: 0.5 }}><strong>Kind:</strong> <MoveKindBadge kind={am.move.kind} /></Typography>
            <Typography sx={{ fontSize: '0.78rem', mb: 0.5, lineHeight: 1.5, wordBreak: 'break-word' }}><strong>Trigger:</strong> {am.move.trigger}</Typography>
            <Typography sx={{ fontSize: '0.78rem', mb: 0.5, lineHeight: 1.5, wordBreak: 'break-word' }}><strong>Action:</strong> {am.move.action}</Typography>
            {am.move.examples.length > 0 && (
              <>
                <Button size="small" onClick={() => toggleExamples(idx)}
                  endIcon={<Box sx={{ display: 'flex', transition: 'transform 0.2s', transform: expandedExamples.has(idx) ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronIcon /></Box>}
                  sx={{ mt: 0.75, color: C.med, background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', '&:hover': { background: hoverBg } }}
                >
                  Examples ({am.move.examples.length})
                </Button>
                {expandedExamples.has(idx) && (
                  <Box sx={{ mt: 0.75 }}>
                    {am.move.examples.map((ex, exIdx) => <ExamplePreview key={exIdx} example={ex} idx={exIdx} />)}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        <Box sx={{ borderTop: `1px solid ${C.border}` }}>
          <Button size="small" onClick={() => toggleReasoning(idx)}
            endIcon={<Box sx={{ display: 'flex', transition: 'transform 0.2s', transform: expandedReasoning.has(idx) ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronIcon /></Box>}
            sx={{ width: '100%', justifyContent: 'flex-start', color: '#78909C', fontSize: '0.73rem', fontWeight: 500, textTransform: 'none', px: 1.5, py: 0.5, borderRadius: 0, '&:hover': { background: C.bg, color: C.med } }}
          >
            Reasoning
          </Button>
          {expandedReasoning.has(idx) && (
            <Box sx={{ px: 1.5, pb: 1.25, pt: 0 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#546E7A', lineHeight: 1.55, p: 1.25, whiteSpace: 'pre-wrap', background: isLogical ? '#F9FAFB' : '#F9FBF2', borderRadius: '6px', borderLeft: `3px solid ${C.bright}` }}>
                {am.filterResponse.reasoning}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    )
  }

  // ── Suggestion workflow ────────────────────────────────────────────────────

  const getAdditionalSelections = (mainSelections: ProofStateSelection[]): ProofStateSelection[] => {
    const mainKeys = new Set(mainSelections.map(s => JSON.stringify(s)))
    return selections.filter(s => !mainKeys.has(JSON.stringify(s)))
  }

  const enterSuggestionMode = (move: ProofDiscoverySuggestionMove) => {
    const mainSelections = [...selections]
    setSuggestionWorkflow({ move, mainSelections, phase: "ready" })
  }

  const refreshSuggestions = async () => {
    if (!suggestionWorkflow) return
    const { move, mainSelections } = suggestionWorkflow
    const additional = getAdditionalSelections(mainSelections)
    setSuggestionWorkflow({ move, mainSelections, phase: "loading" })
    setExpandedGeneralResults(new Set())
    try {
      const results = await fetchSuggestions(proofDiscoveryState, move, mainSelections, additional)
      setSuggestionWorkflow({ move, mainSelections, phase: "loaded", results })
    } catch (err) {
      setSuggestionWorkflow({ move, mainSelections, phase: "error", error: err instanceof Error ? err.message : "Failed to fetch suggestions" })
    }
  }

  const handleApplySuggestion = async (result: SuggestResult, idx: number) => {
    if (!suggestionWorkflow || suggestionWorkflow.phase !== "loaded") return
    const { move, mainSelections, results } = suggestionWorkflow
    setSuggestionWorkflow({ move, mainSelections, phase: "applying", results, applyingIdx: idx })
    try {
      const reasoning = await applySuggestionResult(
        proofDiscoveryState, move, mainSelections, result,
        dispatchProofDiscoveryAction, dispatchSelections
      )
      setLastMoveReasoning(reasoning ?? null)
      setSuggestionWorkflow(null)
      setStatus("idle")
      setApplicableMoves([])
      lastFetchedSelectionsRef.current = ""
    } catch (err) {
      setSuggestionWorkflow(prev => prev ? { move: prev.move, mainSelections: prev.mainSelections, phase: "error", error: err instanceof Error ? err.message : "Failed to apply suggestion" } : null)
    }
  }

  // ── Suggestion workflow renderer ───────────────────────────────────────────

  const renderSuggestionWorkflow = () => {
    if (!suggestionWorkflow) return null
    const { move, mainSelections, phase } = suggestionWorkflow
    const additionalSelections = getAdditionalSelections(mainSelections)

    const selectionStatement = (s: ProofStateSelection): Statement =>
      typeof s.selection !== 'string' && 'text' in s.selection
        ? `$${s.selection.text}$`
        : s.selection as Statement

    const renderSelectionCard = (s: ProofStateSelection, i: number) => {
      const locLabel = s.location.kind === 'goal' ? 'Goal' : (s.location.label ?? s.location.kind)
      return (
        <Box key={i} sx={{ background: P.light, border: `1px solid ${P.border}`, borderRadius: '6px', px: 0.875, py: 0.375 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: P.med, mb: 0.25 }}>{locLabel}</Typography>
          <Box sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}><StaticStatement statement={selectionStatement(s)} /></Box>
        </Box>
      )
    }

    const exitWorkflow = () => { setSuggestionWorkflow(null); dispatchSelections({ type: 'SET_SELECTIONS', selections: mainSelections }) }
    const backToSelecting = () => setSuggestionWorkflow({ move, mainSelections, phase: "ready" })
    const onBack = phase === "ready" ? exitWorkflow : backToSelecting

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.875, borderBottom: `1px solid ${P.border}`, background: P.bg, flexShrink: 0 }}>
          <IconButton size="small" onClick={onBack}
            sx={{ width: 28, height: 28, borderRadius: '7px', border: `1px solid ${P.border}`, color: P.med, background: 'white', flexShrink: 0, '&:hover': { background: P.light } }}>
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </IconButton>
          <Typography sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, color: P.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {move.name}
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {phase === "ready" && (
            <Box sx={{ display: 'flex', flexDirection: 'column', p: '1.25rem 1.5rem', gap: 1.25 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.med }}>
                  Main selections
                </Typography>
                {mainSelections.map((s, i) => renderSelectionCard(s, i))}
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: P.med, lineHeight: 1.5 }}>
                Make additional selections in the proof state to provide extra context if necessary, then generate suggestions.
              </Typography>
              {additionalSelections.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.med }}>
                    Additional context
                  </Typography>
                  {additionalSelections.map((s, i) => renderSelectionCard(s, i))}
                </Box>
              )}
              <Button onClick={() => void refreshSuggestions()}
                sx={{
                  alignSelf: 'flex-start', px: 2, py: 0.875, fontSize: '0.82rem', fontWeight: 700,
                  color: 'white', background: P.med, borderRadius: '20px',
                  textTransform: 'none', border: `1.5px solid ${P.bright}`,
                  '&:hover': { background: P.dark },
                }}
              >
                Generate suggestions
              </Button>
            </Box>
          )}

          {phase === "loading" && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: '2rem 1.5rem' }}>
              <SpinnerBox size={24} trackColor={P.border} spinColor={P.bright} />
              <Typography sx={{ color: P.dark, fontSize: '0.85rem', fontWeight: 500 }}>Fetching suggestions…</Typography>
            </Box>
          )}

          {phase === "error" && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: '2rem 1.5rem' }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#C62828', fontWeight: 600 }}>Error</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#C62828', textAlign: 'center' }}>{suggestionWorkflow.error}</Typography>
              <Button size="small" variant="outlined" onClick={() => void refreshSuggestions()}
                sx={{ color: '#C62828', borderColor: '#FFCDD2', fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '8px', '&:hover': { background: '#FFF5F5' } }}>
                Retry
              </Button>
            </Box>
          )}

          {(phase === "loaded" || phase === "applying") && (
            <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, gap: 0.75 }}>
              {suggestionWorkflow.results.suggestions.length === 0 ? (
                <Typography sx={{ p: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#78909C', fontStyle: 'italic' }}>
                  No suggestions found.
                </Typography>
              ) : suggestionWorkflow.results.suggestions.map((result, idx) => {
                const isApplying = phase === "applying" && suggestionWorkflow.applyingIdx === idx
                const isDisabled = phase === "applying"
                const hasBoth = result.suggestion !== null && result.generalResult !== null
                const isGeneralExpanded = expandedGeneralResults.has(idx)
                const toggleGeneral = () => setExpandedGeneralResults(prev => {
                  const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n
                })
                return (
                  <Paper key={idx} elevation={0} sx={{
                    display: 'flex', flexDirection: 'column',
                    background: 'white', border: `1px solid ${P.border}`, borderRadius: '10px', overflow: 'hidden',
                    transition: 'box-shadow 0.15s',
                    '&:hover': { boxShadow: `0 2px 8px rgba(139,92,246,0.12)` },
                  }}>
                    <Box sx={{ p: '10px 12px', display: 'flex', flexDirection: 'column', gap: 0.875 }}>
                      {result.suggestion !== null && (
                        <Box>
                          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: P.med, mb: 0.5 }}>Suggestion</Typography>
                          <Box sx={{ fontSize: '0.83rem', lineHeight: 1.5 }}>
                            <StaticStatement statement={result.suggestion} />
                          </Box>
                        </Box>
                      )}
                      {result.generalResult !== null && (
                        hasBoth && !isGeneralExpanded ? (
                          <Button size="small" onClick={toggleGeneral}
                            endIcon={<Box sx={{ display: 'flex' }}><ChevronIcon /></Box>}
                            sx={{
                              alignSelf: 'flex-start', fontSize: '0.7rem', fontWeight: 600, textTransform: 'none',
                              color: P.med, background: P.bg, border: `1px solid ${P.border}`,
                              borderRadius: '6px', px: 1, py: 0.375,
                              '&:hover': { background: P.light, borderColor: P.bright },
                            }}
                          >
                            <svg style={{ width: 11, height: 11, marginRight: 4, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            General result
                          </Button>
                        ) : (
                          <Box sx={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: '7px', p: '7px 10px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.375 }}>
                              <svg style={{ width: 12, height: 12, color: P.med, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: P.med, flex: 1 }}>
                                General result — saved to library
                              </Typography>
                              {hasBoth && (
                                <IconButton size="small" onClick={toggleGeneral}
                                  sx={{ width: 18, height: 18, p: 0, color: P.med, '&:hover': { color: P.dark } }}>
                                  <ChevronIcon rotated />
                                </IconButton>
                              )}
                            </Box>
                            <Typography sx={{ fontSize: '0.7rem', color: P.dark, fontWeight: 600, mb: 0.375 }}>
                              {result.generalResult.label}
                            </Typography>
                            <Box sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                              <StaticStatement statement={result.generalResult.statement} />
                            </Box>
                          </Box>
                        )
                      )}
                    </Box>
                    <Box sx={{ borderTop: `1px solid ${P.border}`, p: '6px 8px', display: 'flex', justifyContent: 'flex-end' }}>
                      <Button size="small" disabled={isDisabled} onClick={() => void handleApplySuggestion(result, idx)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 0.75,
                          px: 1.5, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                          color: P.dark, background: `linear-gradient(180deg, ${P.bg} 0%, ${P.light} 100%)`,
                          border: `1.5px solid ${P.light}`, borderRadius: '20px',
                          '&:hover': { background: P.light, borderColor: P.bright },
                          '&:disabled': { opacity: 0.5 },
                        }}
                      >
                        {isApplying ? <SpinnerBox size={12} trackColor={P.border} spinColor={P.bright} /> : <PlayIcon />}
                        Apply
                      </Button>
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    )
  }

// ── Render suggestions ──────────────────────────────────────────────────────

  const renderSuggestionMovesList = () => (
    <Box sx={{ px: 1, pt: 1, pb: 0.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', px: 0.5, py: 0.625, mb: 0.5 }}>
        <svg style={{ width: 13, height: 13, color: P.med, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.med }}>
          Suggestion moves
        </Typography>
        <Box sx={{ flex: 1, height: '1px', background: P.border }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.625 }}>
        {suggestionMoves.map((move, idx) => (
          <Paper key={idx} elevation={0} sx={{
            display: 'flex', flexDirection: 'column',
            background: 'white', border: `1px solid ${P.border}`,
            borderRadius: '10px', overflow: 'hidden',
            transition: 'box-shadow 0.15s',
            '&:hover': { boxShadow: '0 2px 8px rgba(139,92,246,0.12)' },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: '6px 6px 6px 8px' }}>
              <Button onClick={() => void enterSuggestionMode(move)}
                sx={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 1,
                  p: '7px 10px', fontSize: '0.83rem', fontWeight: 600,
                  color: P.dark, background: P.bg,
                  border: `1.5px solid ${P.border}`, borderRadius: '8px',
                  textTransform: 'none', justifyContent: 'flex-start',
                  '&:hover': { background: P.light, borderColor: P.bright },
                }}
              >
                <Box sx={{ color: P.bright, display: 'flex', flexShrink: 0 }}>
                  <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'left' }}>{move.name}</Box>
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )

  const renderMoveSuggestions = () => {
    // After a move is applied with no selection: show reasoning trace
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

    const proofMovesSection = () => {
      if (selections.length === 0) {
        return (
          <Box sx={{ px: 2, py: 1.5, mt: 0.5 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#90A4AE', lineHeight: 1.5 }}>
              Select a term to see applicable proof moves.
            </Typography>
          </Box>
        )
      }
      if (status === "loading") {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.5 }}>
            <SpinnerBox size={16} />
            <Typography sx={{ color: G.dark, fontSize: '0.8rem', fontWeight: 500 }}>Checking applicable moves…</Typography>
          </Box>
        )
      }
      if (status === "error") {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75, px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#C62828', fontWeight: 600 }}>Error checking moves</Typography>
            <Button size="small" variant="outlined" onClick={() => void fetchMoves()}
              sx={{ color: '#C62828', borderColor: '#FFCDD2', fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', borderRadius: '8px', '&:hover': { background: '#FFF5F5', borderColor: '#E53935' } }}>
              Retry
            </Button>
          </Box>
        )
      }
      if (status === "loaded") {
        if (applicableMoves.length === 0) {
          return (
            <Typography sx={{ px: 2, py: 1.5, fontSize: '0.8rem', color: '#78909C', fontStyle: 'italic' }}>
              No applicable proof moves for this selection.
            </Typography>
          )
        }
        const generalIndexed = applicableMoves.map((am, idx) => ({ am, idx })).filter(({ am }) => am.move.classification !== "logical")
        const logicalIndexed = applicableMoves.map((am, idx) => ({ am, idx })).filter(({ am }) => am.move.classification === "logical")
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, pt: 0.5, gap: 0.75 }}>
            {lastMoveReasoning && (
              <Accordion disableGutters elevation={0} sx={{
                borderRadius: '8px !important', background: '#F9FBF2',
                border: `1px solid ${G.border}`, '&:before': { display: 'none' },
              }}>
                <AccordionSummary
                  expandIcon={<Box sx={{ color: G.med, display: 'flex' }}><ChevronIcon /></Box>}
                  sx={{ minHeight: 36, px: 1.5, py: 0, '& .MuiAccordionSummary-content': { my: 0.625 } }}
                >
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: G.med }}>Reasoning from last move</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1.5, pb: 1.25, pt: 0 }}>
                  <Box component="pre" sx={{ fontSize: '0.75rem', color: G.dark, whiteSpace: 'pre-wrap', m: 0, p: 1.25, background: 'white', borderRadius: '6px', border: `1px solid ${G.border}`, lineHeight: 1.55, fontFamily: 'inherit' }}>
                    {lastMoveReasoning}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
            {generalIndexed.length > 0 && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', px: 0.5, pt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: G.med }}>Proof moves</Typography>
                  <Box sx={{ flex: 1, height: '1px', background: G.border }} />
                </Box>
                {generalIndexed.map(({ am, idx }) => renderMoveCard(am, idx))}
              </>
            )}
            {logicalIndexed.length > 0 && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', px: 0.5, pt: generalIndexed.length > 0 ? 0.5 : 0 }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: L.med }}>Logical moves</Typography>
                  <Box sx={{ flex: 1, height: '1px', background: L.border }} />
                </Box>
                {logicalIndexed.map(({ am, idx }) => renderMoveCard(am, idx))}
              </>
            )}
          </Box>
        )
      }
      return null
    }

    return (
      <>
        {renderSuggestionMovesList()}
        <Box sx={{ mx: 1, my: 0.5, height: '1px', background: '#e8eef4' }} />
        {proofMovesSection()}
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
            {suggestionWorkflow
              ? "Suggestions"
              : status === "loaded"
                ? `${applicableMoves.length} Move${applicableMoves.length !== 1 ? 's' : ''}`
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


      {/* Scrollable suggestions / suggestion workflow */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {suggestionWorkflow ? renderSuggestionWorkflow() : renderMoveSuggestions()}
      </Box>

      {/* Custom move section */}
      <Box sx={{ flexShrink: 0 }}>
        <CustomMoveSection onHasText={setCustomInputActive} />
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

function CustomMoveSection({ onHasText }: { onHasText?: (hasText: boolean) => void }): JSX.Element {
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
      classification: "mathematical",
      runWithGuardrails: false,
      trigger: "",
      action: description.trim(),
      examples: [],
    }
    setApplying(true)
    setError("")
    try {
      await applyMove(proofDiscoveryState, selections, customMove, dispatchProofDiscoveryAction, dispatchSelections)
      setDescription("")
      onHasText?.(false)
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
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setDescription(e.target.value)
          onHasText?.(e.target.value.trim().length > 0)
        }}
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


// ─── Public Move Panel ────────────────────────────────────────────────────────

export function MovePanel({ onLoadingChange }: { onLoadingChange?: (isLoading: boolean) => void }): JSX.Element {
  return <MovePanelContent onLoadingChange={onLoadingChange} />
}
