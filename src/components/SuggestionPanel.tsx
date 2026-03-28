import React, { JSX, useContext, useState, useEffect } from "react"
import {
  Box, Typography, Button, IconButton, Paper,
} from "@mui/material"
import { ProofStateSelection, ProofStateSelectionContext, ProofStateLocationContext, selectionPolarity, toProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext"
import { ContextVariable, ProofState, Statement } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryAction, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove, ProofDiscoverySuggestionMove } from "../core/ProofDiscoveryMove"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { MathStatement } from "./MathStatement"
import { suggestionMoves } from "../prompts/moves"
import { checkMoveValidity, FilterResponse } from "../fetchers/filter"
import { suggestStatements, SuggestResult, SuggestResults } from "../fetchers/suggest"
import { applyMove, ChevronIcon, PlayIcon, SpinnerBox } from "./MovesList"

// ─── Exported helpers ─────────────────────────────────────────────────────────

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

/** Get all applicable suggestion moves for a given proof state and selections. */
export async function getApplicableSuggestionMoves(
  proofDiscoveryState: ProofDiscoveryState,
  selections: ProofStateSelection[],
  signal?: AbortSignal,
  movesToCheck: ProofDiscoverySuggestionMove[] = suggestionMoves
): Promise<{ move: ProofDiscoverySuggestionMove, filterResponse: FilterResponse }[]> {
  const results = await Promise.all(
    movesToCheck.map(async (move) => {
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
    parts.push(`The specific suggestion chosen by the user is: ${JSON.stringify(result.suggestion)}`)
  }
  if (result.generalResult !== null) {
    parts.push(`The following general result is provided for context — "${result.generalResult.label}": ${JSON.stringify(result.generalResult.statement)}`)
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

// ─── Design tokens ────────────────────────────────────────────────────────────

// Purple palette — suggestion moves
export const P = {
  dark:   '#4c1d95',
  med:    '#7c3aed',
  bright: '#8b5cf6',
  light:  '#ddd6fe',
  bg:     '#faf5ff',
  border: '#ede9fe',
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicableSuggestionMove = { move: ProofDiscoverySuggestionMove, filterResponse: FilterResponse }

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

// ─── StaticStatement ──────────────────────────────────────────────────────────

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

// ─── SuggestionPanel ─────────────────────────────────────────────────────────

interface SuggestionPanelProps {
  graphOrder: number
  onWorkflowChange: (isActive: boolean) => void
  onMoveApplied: (reasoning: string | null) => void
}

export function SuggestionPanel({ graphOrder, onWorkflowChange, onMoveApplied }: SuggestionPanelProps): JSX.Element {
  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)

  const [suggestionWorkflow, setSuggestionWorkflow] = useState<SuggestionWorkflow | null>(null)
  const [expandedGeneralResults, setExpandedGeneralResults] = useState<Set<number>>(new Set())

  // Reset when graph changes (a move was applied)
  useEffect(() => {
    setSuggestionWorkflow(null)
    setExpandedGeneralResults(new Set())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphOrder])

  // Notify parent when workflow active state changes
  useEffect(() => {
    onWorkflowChange(suggestionWorkflow !== null)
  }, [suggestionWorkflow, onWorkflowChange])

  // ── Helpers ──────────────────────────────────────────────────────────────

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
      onMoveApplied(reasoning ?? null)
      setSuggestionWorkflow(null)
    } catch (err) {
      setSuggestionWorkflow(prev => prev ? { move: prev.move, mainSelections: prev.mainSelections, phase: "error", error: err instanceof Error ? err.message : "Failed to apply suggestion" } : null)
    }
  }

  // ── Suggestion move list ──────────────────────────────────────────────────

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

  // ── Workflow renderer ─────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  if (suggestionWorkflow !== null) {
    return renderSuggestionWorkflow()!
  }

  return renderSuggestionMovesList()
}
