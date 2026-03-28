import React, { JSX, useContext, useState, useEffect } from "react"
import {
  Box, Typography, Button, IconButton, Paper, Chip,
} from "@mui/material"
import { ProofStateSelection, ProofStateSelectionContext, ProofStateLocationContext, selectionPolarity, toProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext"
import { ContextVariable, ProofState, Statement } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryAction, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { MathStatement } from "./MathStatement"
import { suggestStatements, SuggestResult, SuggestResults, SuggestionKind } from "../fetchers/suggest"
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

/** Fetch suggestions for a given set of selections. */
export async function fetchSuggestions(
  proofDiscoveryState: ProofDiscoveryState,
  instructions: string,
  mainSelections: ProofStateSelection[],
  additionalSelections: ProofStateSelection[]
): Promise<SuggestResults> {
  return suggestStatements({
    variables: getVariablesInProofState(getCurrentProofState(proofDiscoveryState)),
    mainSelections: mainSelections.map(selection => ({
      selection: typeof selection.selection === 'string' || 'kind' in selection.selection ? selection.selection : selection.selection.text,
      polarity: selectionPolarity(selection)
    })),
    additionalSelections: additionalSelections.map(selection => ({
      selection: typeof selection.selection === 'string' || 'kind' in selection.selection ? selection.selection : selection.selection.text,
      polarity: selectionPolarity(selection)
    })),
    instructions
  })
}

/** Apply a selected suggestion result. */
export async function applySuggestionResult(
  proofDiscoveryState: ProofDiscoveryState,
  applySuggestionMove: ProofDiscoveryMove,
  mainSelections: ProofStateSelection[],
  result: SuggestResult,
  dispatchProofDiscoveryAction: React.Dispatch<ProofDiscoveryAction>,
  dispatchSelections: React.Dispatch<any>
): Promise<string | undefined> {
  const parts = [applySuggestionMove.action]
  if (result.suggestion !== null) {
    parts.push(`The specific suggestion chosen by the user is: ${JSON.stringify(result.suggestion)}`)
  }
  if (result.generalResult !== null) {
    parts.push(`The following general result is provided for context — "${result.generalResult.label}": ${JSON.stringify(result.generalResult.statement)}`)
  }

  const augmentedMove: ProofDiscoveryMove = {
    ...applySuggestionMove,
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

// ─── Polarity helpers ─────────────────────────────────────────────────────────

function hasMixedPolarity(sels: ProofStateSelection[]): boolean {
  const ps = sels.map(selectionPolarity).filter((p): p is boolean => p !== null)
  return ps.some(p => p === true) && ps.some(p => p === false)
}

function aggregatePolarity(sels: ProofStateSelection[]): boolean | null {
  const ps = sels.map(selectionPolarity).filter((p): p is boolean => p !== null)
  if (ps.length === 0) return null
  if (ps.every(p => p === true)) return true
  if (ps.every(p => p === false)) return false
  return null
}

/** Return a ProofDiscoveryMove appropriate for applying a suggestion of the given kind and polarity. */
export function applyMoveFromKindAndPolarity(kind: SuggestionKind, polarity: boolean | null): ProofDiscoveryMove {
  const base = { classification: "mathematical" as const, trigger: "", examples: [], runWithGuardrails: false }
  switch(polarity) {
    case true:
      switch (kind) {
        case "sufficient_condition":
          return { ...base, name: "Strengthen hypothesis in proof state", kind: "weakening", action: "This move replaces the selected statement with the suggested sufficient condition." }
        case "standard_consequence":
          return { ...base, name: "Add a hypothesis to the proof state", kind: "strengthening", action: "This move adds the suggested statement as a new hypothesis to the proof state." }
        case "equivalent_statement":
          return { ...base, name: "Replace hypothesiswith an equivalent statement", kind: "equivalence", action: `This move replaces the selected expression or statement with the equivalent suggestion.` }
        case "construction":
          return { ...base, name: "Introduce a construction", kind: "strengthening", action: "This move introduces the constructed object into the proof state as a new let variable with a suitable name." }
      }
    case false:
        switch (kind) {
          case "sufficient_condition":
            return { ...base, name: "Replace the goal with a sufficient condition", kind: "strengthening", action: "This move replaces the selected goals with the suggested sufficient condition." }
          case "standard_consequence":
            return { ...base, name: "Reason forwards from the goal", kind: "weakening", action: "This move adds the suggested statement as a new goal to the proof state." }
          case "equivalent_statement":
            return { ...base, name: "Replace goal with an equivalent statement", kind: "equivalence", action: `This move replaces the selected expression or statement with the equivalent suggestion.` }
          case "construction":
            return { ...base, name: "Introduce a construction", kind: "strengthening", action: "This move introduces the constructed object into the proof state as a new let variable with a suitable name." }
        }
    case null:
        switch (kind) {
          case "sufficient_condition":
            return { ...base, name: "Replace statement with a sufficient condition", kind: "strengthening", action: "This move replaces the selected statement with the suggested sufficient condition if the statement is a goal, and fails otherwise." }
          case "standard_consequence":
            return { ...base, name: "Add a hypothesis to the proof state", kind: "strengthening", action: "This move adds the suggested statement as a new hypothesis to the proof state if the selected statement is a hypothesis, and fails otherwise." }
          case "equivalent_statement":
            return { ...base, name: "Replace with an equivalent statement", kind: "equivalence", action: `This move replaces the selected expression or statement with the equivalent suggestion.` }
          case "construction":
            return { ...base, name: "Introduce a construction", kind: "strengthening", action: "This move introduces the constructed object into the proof state as a new let variable with a suitable name." }
      }
  }
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

// ─── Kind labels ──────────────────────────────────────────────────────────────

const KIND_LABELS: Record<SuggestionKind, string> = {
  sufficient_condition: "Sufficient Condition",
  standard_consequence: "Standard Consequence",
  equivalent_statement: "Equivalent Statement",
  construction: "Construction",
}

const ALL_KINDS: SuggestionKind[] = ["sufficient_condition", "standard_consequence", "equivalent_statement", "construction"]

// ─── Types ────────────────────────────────────────────────────────────────────

type SuggestionWorkflow =
  | { phase: "selecting_main" }
  | { phase: "selecting_additional"; mainSelections: ProofStateSelection[] }
  | { phase: "loading"; mainSelections: ProofStateSelection[] }
  | { phase: "loaded"; mainSelections: ProofStateSelection[]; results: SuggestResults }
  | { phase: "applying"; mainSelections: ProofStateSelection[]; results: SuggestResults; applyingIdx: number }
  | { phase: "error"; mainSelections: ProofStateSelection[]; error: string }

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
  onWorkflowChange: (isActive: boolean) => void
  onMoveApplied: (reasoning: string | null) => void
}

export function SuggestionPanel({ onWorkflowChange, onMoveApplied }: SuggestionPanelProps): JSX.Element {
  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)

  const [workflow, setWorkflow] = useState<SuggestionWorkflow>({ phase: "selecting_main" })
  const [expandedGeneralResults, setExpandedGeneralResults] = useState<Set<number>>(new Set())
  const [activeKinds, setActiveKinds] = useState<Set<SuggestionKind>>(new Set(ALL_KINDS))

  // Notify parent that workflow is active when this component is mounted
  useEffect(() => {
    onWorkflowChange(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset when graph changes (a move was applied)
  useEffect(() => {
    setWorkflow({ phase: "selecting_main" })
    setExpandedGeneralResults(new Set())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proofDiscoveryState.graph.order])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getAdditionalSelections = (mainSelections: ProofStateSelection[]): ProofStateSelection[] => {
    const mainKeys = new Set(mainSelections.map(s => JSON.stringify(s)))
    return selections.filter(s => !mainKeys.has(JSON.stringify(s)))
  }

  const refreshSuggestions = async (mainSelections: ProofStateSelection[]) => {
    const additional = getAdditionalSelections(mainSelections)
    const polarity = aggregatePolarity(mainSelections)
    const instructions = ""
    setWorkflow({ phase: "loading", mainSelections })
    setExpandedGeneralResults(new Set())
    try {
      const results = await fetchSuggestions(proofDiscoveryState, instructions, mainSelections, additional)
      setWorkflow({ phase: "loaded", mainSelections, results })
    } catch (err) {
      setWorkflow({ phase: "error", mainSelections, error: err instanceof Error ? err.message : "Failed to fetch suggestions" })
    }
  }

  const handleApplySuggestion = async (result: SuggestResult, idx: number) => {
    if (workflow.phase !== "loaded") return
    const { mainSelections, results } = workflow
    setWorkflow({ phase: "applying", mainSelections, results, applyingIdx: idx })
    const polarity = aggregatePolarity(mainSelections)
    try {
      const move = applyMoveFromKindAndPolarity(result.kind, polarity)
      const reasoning = await applySuggestionResult(
        proofDiscoveryState, move, mainSelections, result,
        dispatchProofDiscoveryAction, dispatchSelections
      )
      onMoveApplied(reasoning ?? null)
    } catch (err) {
      setWorkflow({ phase: "error", mainSelections, error: err instanceof Error ? err.message : "Failed to apply suggestion" })
    }
  }

  const toggleKind = (kind: SuggestionKind) => {
    setActiveKinds(prev => {
      const n = new Set(prev)
      if (n.has(kind)) {
        // Don't allow deselecting all
        if (n.size === 1) return prev
        n.delete(kind)
      } else {
        n.add(kind)
      }
      return n
    })
  }

  // ── Selection card renderer ───────────────────────────────────────────────

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

  // ── Workflow header ───────────────────────────────────────────────────────

  const renderHeader = (title: string, onBack: (() => void) | null) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.875, borderBottom: `1px solid ${P.border}`, background: P.bg, flexShrink: 0 }}>
      {onBack && (
        <IconButton size="small" onClick={onBack}
          sx={{ width: 28, height: 28, borderRadius: '7px', border: `1px solid ${P.border}`, color: P.med, background: 'white', flexShrink: 0, '&:hover': { background: P.light } }}>
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </IconButton>
      )}
      <Typography sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, color: P.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </Typography>
    </Box>
  )

  // ── Phase: selecting_main ─────────────────────────────────────────────────

  const renderSelectingMain = () => {
    const mixed = hasMixedPolarity(selections)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {renderHeader("Generate Suggestions", () => { onWorkflowChange(false) })}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', p: '1.25rem 1.5rem', gap: 1.25 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.med }}>
                Main selections
              </Typography>
              {selections.length === 0 ? (
                <Typography sx={{ fontSize: '0.75rem', color: P.med, fontStyle: 'italic' }}>
                  No selections yet. Click on terms in the proof state.
                </Typography>
              ) : (
                selections.map((s, i) => renderSelectionCard(s, i))
              )}
            </Box>
            {mixed && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, p: '8px 10px', background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: '7px' }}>
                <svg style={{ width: 14, height: 14, color: '#E65100', flexShrink: 0, marginTop: 1 }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <Typography sx={{ fontSize: '0.75rem', color: '#E65100', lineHeight: 1.4 }}>
                  Goal-like and hypothesis-like selections are not simultaneously allowed.
                </Typography>
              </Box>
            )}
            <Typography sx={{ fontSize: '0.75rem', color: P.med, lineHeight: 1.5 }}>
              Modify your selections in the proof state, then confirm to proceed.
            </Typography>
            <Button
              onClick={() => setWorkflow({ phase: "selecting_additional", mainSelections: [...selections] })}
              disabled={mixed || selections.length === 0}
              sx={{
                alignSelf: 'flex-start', px: 2, py: 0.875, fontSize: '0.82rem', fontWeight: 700,
                color: 'white', background: P.med, borderRadius: '20px',
                textTransform: 'none', border: `1.5px solid ${P.bright}`,
                '&:hover': { background: P.dark },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              Confirm selections
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Phase: selecting_additional ───────────────────────────────────────────

  const renderSelectingAdditional = (mainSelections: ProofStateSelection[]) => {
    const additional = getAdditionalSelections(mainSelections)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {renderHeader("Generate Suggestions", () => {
          dispatchSelections({ type: 'SET_SELECTIONS', selections: mainSelections })
          setWorkflow({ phase: "selecting_main" })
        })}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
            {additional.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.med }}>
                  Additional context
                </Typography>
                {additional.map((s, i) => renderSelectionCard(s, i))}
              </Box>
            )}
            <Button onClick={() => void refreshSuggestions(mainSelections)}
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
        </Box>
      </Box>
    )
  }

  // ── Phase: loading ────────────────────────────────────────────────────────

  const renderLoading = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {renderHeader("Generate Suggestions", null)}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: '2rem 1.5rem', flex: 1 }}>
        <SpinnerBox size={24} trackColor={P.border} spinColor={P.bright} />
        <Typography sx={{ color: P.dark, fontSize: '0.85rem', fontWeight: 500 }}>Fetching suggestions…</Typography>
      </Box>
    </Box>
  )

  // ── Phase: error ──────────────────────────────────────────────────────────

  const renderError = (mainSelections: ProofStateSelection[], error: string) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {renderHeader("Generate Suggestions", () => setWorkflow({ phase: "selecting_additional", mainSelections }))}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: '2rem 1.5rem', flex: 1 }}>
        <Typography sx={{ fontSize: '0.85rem', color: '#C62828', fontWeight: 600 }}>Error</Typography>
        <Typography sx={{ fontSize: '0.78rem', color: '#C62828', textAlign: 'center' }}>{error}</Typography>
        <Button size="small" variant="outlined" onClick={() => void refreshSuggestions(mainSelections)}
          sx={{ color: '#C62828', borderColor: '#FFCDD2', fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: '8px', '&:hover': { background: '#FFF5F5' } }}>
          Retry
        </Button>
      </Box>
    </Box>
  )

  // ── Phase: loaded / applying ──────────────────────────────────────────────

  const renderResults = (mainSelections: ProofStateSelection[], results: SuggestResults, applyingIdx: number | null) => {
    const isApplying = applyingIdx !== null
    const filtered = results.suggestions.filter(r => activeKinds.has(r.kind))

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {renderHeader("Suggestions", () => setWorkflow({ phase: "selecting_additional", mainSelections }))}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* Kind filter chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1, pt: 1, pb: 0.5 }}>
            {ALL_KINDS.filter(k => results.suggestions.some(r => r.kind === k)).map(kind => (
              <Chip
                key={kind}
                label={KIND_LABELS[kind]}
                size="small"
                onClick={() => toggleKind(kind)}
                sx={{
                  fontSize: '0.65rem', fontWeight: 700, height: 22,
                  background: activeKinds.has(kind) ? P.light : 'white',
                  border: `1px solid ${activeKinds.has(kind) ? P.bright : P.border}`,
                  color: activeKinds.has(kind) ? P.dark : '#9E9E9E',
                  cursor: 'pointer',
                  '&:hover': { background: P.light },
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, gap: 0.75 }}>
            {filtered.length === 0 ? (
              <Typography sx={{ p: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#78909C', fontStyle: 'italic' }}>
                No suggestions for the selected filters.
              </Typography>
            ) : filtered.map((result, idx) => {
              const originalIdx = results.suggestions.indexOf(result)
              const thisApplying = isApplying && applyingIdx === originalIdx
              const isDisabled = isApplying
              const hasBoth = result.suggestion !== null && result.generalResult !== null
              const isGeneralExpanded = expandedGeneralResults.has(originalIdx)
              const toggleGeneral = () => setExpandedGeneralResults(prev => {
                const n = new Set(prev); n.has(originalIdx) ? n.delete(originalIdx) : n.add(originalIdx); return n
              })

              return (
                <Paper key={originalIdx} elevation={0} sx={{
                  display: 'flex', flexDirection: 'column',
                  background: 'white', border: `1px solid ${P.border}`, borderRadius: '10px', overflow: 'hidden',
                  transition: 'box-shadow 0.15s',
                  '&:hover': { boxShadow: `0 2px 8px rgba(139,92,246,0.12)` },
                }}>
                  {/* Kind badge */}
                  <Box sx={{ px: '12px', pt: '8px' }}>
                    <Chip
                      label={KIND_LABELS[result.kind]}
                      size="small"
                      sx={{ fontSize: '0.6rem', fontWeight: 700, height: 18, background: P.bg, border: `1px solid ${P.border}`, color: P.med }}
                    />
                  </Box>
                  <Box sx={{ p: '6px 12px 10px', display: 'flex', flexDirection: 'column', gap: 0.875 }}>
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
                    <Button size="small" disabled={isDisabled} onClick={() => void handleApplySuggestion(result, originalIdx)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                        color: P.dark, background: `linear-gradient(180deg, ${P.bg} 0%, ${P.light} 100%)`,
                        border: `1.5px solid ${P.light}`, borderRadius: '20px',
                        '&:hover': { background: P.light, borderColor: P.bright },
                        '&:disabled': { opacity: 0.5 },
                      }}
                    >
                      {thisApplying ? <SpinnerBox size={12} trackColor={P.border} spinColor={P.bright} /> : <PlayIcon />}
                      Apply
                    </Button>
                  </Box>
                </Paper>
              )
            })}
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  switch (workflow.phase) {
    case "selecting_main":
      return renderSelectingMain()
    case "selecting_additional":
      return renderSelectingAdditional(workflow.mainSelections)
    case "loading":
      return renderLoading()
    case "loaded":
      return renderResults(workflow.mainSelections, workflow.results, null)
    case "applying":
      return renderResults(workflow.mainSelections, workflow.results, workflow.applyingIdx)
    case "error":
      return renderError(workflow.mainSelections, workflow.error)
  }
}
