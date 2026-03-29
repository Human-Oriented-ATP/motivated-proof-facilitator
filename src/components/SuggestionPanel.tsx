import React, { JSX, useContext, useState, useEffect, useRef } from "react"
import {
  Box, Typography, Button, IconButton, Paper, Chip, Tooltip,
} from "@mui/material"
import { ProofStateSelection, ProofStateSelectionContext, ProofStateLocationContext, selectionPolarity, toProofStateSelectionWithPolarity } from "../core/ProofStateSelectionContext"
import { ContextVariable, ProofState, Statement } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryAction, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { MathStatement } from "./MathStatement"
import { suggestStatements, SuggestResult, SuggestResults, SuggestionKind, SelectionWithPolarity } from "../fetchers/suggest"
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
      selection: typeof selection.selection === 'string' || (typeof selection.selection === 'object' && 'kind' in selection.selection) ? selection.selection : selection.selection.text,
      polarity: selectionPolarity(selection)
    })),
    additionalSelections: additionalSelections.map(selection => ({
      selection: typeof selection.selection === 'string' || (typeof selection.selection === 'object' && 'kind' in selection.selection) ? selection.selection : selection.selection.text,
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
          return { ...base, name: "Replace hypothesis with an equivalent statement", kind: "equivalence", action: `This move replaces the selected expression or statement with the equivalent suggestion.` }
        case "construction":
          return { ...base, name: "Introduce a construction", kind: "strengthening", action: "This move introduces the constructed object into the proof state as a new let variable with a suitable name." }
      }
    // falls through
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
    // falls through
    default:
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

// Purple palette — suggestion panel
export const P = {
  dark:   '#4c1d95',
  med:    '#7c3aed',
  bright: '#8b5cf6',
  light:  '#ddd6fe',
  bg:     '#faf5ff',
  border: '#ede9fe',
}

// Soft purple button — matches the general panel style
export const shinyPurpleBtn = {
  color: '#4c1d95',
  background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
  boxShadow: '0 1px 2px rgba(124,58,237,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
  border: '1.5px solid #ede9fe',
  textTransform: 'none' as const,
  fontWeight: 700,
  '&:hover': {
    background: 'linear-gradient(180deg, #faf5ff 0%, #ddd6fe 100%)',
    borderColor: '#8b5cf6',
    boxShadow: '0 2px 5px rgba(124,58,237,0.18)',
  },
  '&:disabled': { opacity: 0.45, boxShadow: 'none' },
}

// ─── Kind palette ─────────────────────────────────────────────────────────────

type KindStyle = { bg: string; border: string; text: string; accent: string; chipBg: string }

const KIND_STYLES: Record<SuggestionKind, KindStyle> = {
  sufficient_condition: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', accent: '#3B82F6', chipBg: '#DBEAFE' },
  standard_consequence: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', accent: '#F59E0B', chipBg: '#FEF3C7' },
  equivalent_statement: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', accent: '#10B981', chipBg: '#D1FAE5' },
  construction:         { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', accent: '#7C3AED', chipBg: '#EDE9FE' },
}

const KIND_LABELS: Record<SuggestionKind, string> = {
  sufficient_condition: "Sufficient Condition",
  standard_consequence: "Standard Consequence",
  equivalent_statement: "Equivalent Statement",
  construction:         "Construction",
}

const ALL_KINDS: SuggestionKind[] = ["sufficient_condition", "standard_consequence", "equivalent_statement", "construction"]

// ─── Polarity card colors ─────────────────────────────────────────────────────

function polarityCardStyle(polarity: boolean | null): { bg: string; border: string; accent: string } {
  if (polarity === true)  return { bg: 'rgba(255,140,0,0.07)',  border: 'rgba(255,140,0,0.30)',  accent: '#FF8C00' }
  if (polarity === false) return { bg: 'rgba(33,150,243,0.07)', border: 'rgba(33,150,243,0.30)', accent: '#2196F3' }
  return                         { bg: 'rgba(130,130,130,0.06)', border: 'rgba(130,130,130,0.22)', accent: '#9E9E9E' }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SuggestionWorkflow =
  | { phase: "selecting_main" }
  | { phase: "selecting_additional"; mainSelections: ProofStateSelection[] }
  | { phase: "loading";              mainSelections: ProofStateSelection[] }
  | { phase: "loaded";               mainSelections: ProofStateSelection[]; results: SuggestResults }
  | { phase: "applying";             mainSelections: ProofStateSelection[]; results: SuggestResults; applyingIdx: number }
  | { phase: "error";                mainSelections: ProofStateSelection[]; error: string }

// ─── StaticStatement ──────────────────────────────────────────────────────────

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
  const [filterOpen, setFilterOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    onWorkflowChange(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const toSelectionWithPolarity = (sel: ProofStateSelection): SelectionWithPolarity =>
    ({
      selection: typeof sel.selection === 'string' || (typeof sel.selection === 'object' && 'kind' in sel.selection) ? sel.selection : { textSelection: `$${sel.selection.text}$` },
      polarity: selectionPolarity(sel),
    })

  const refreshSuggestions = async (mainSelections: ProofStateSelection[]) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const additional = getAdditionalSelections(mainSelections)
    const instructions = ""
    setWorkflow({ phase: "loading", mainSelections })
    setExpandedGeneralResults(new Set())
    try {
      const results = await fetchSuggestions(proofDiscoveryState, instructions, mainSelections, additional)
      if (!controller.signal.aborted) {
        setWorkflow({ phase: "loaded", mainSelections, results })
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setWorkflow({ phase: "error", mainSelections, error: err instanceof Error ? err.message : "Failed to fetch suggestions" })
      }
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
        if (n.size === 1) return prev
        n.delete(kind)
      } else {
        n.add(kind)
      }
      return n
    })
  }

  // ── Polarity selection card (no location label, color-coded) ─────────────

  const renderPolarityCard = (s: SelectionWithPolarity, i: number) => {
    const { bg, border, accent } = polarityCardStyle(s.polarity)
    const stmt: Statement = (typeof s.selection === 'object' && 'textSelection' in s.selection) ? (s.selection.textSelection as Statement) : s.selection as Statement
    return (
      <Box key={i} sx={{
        background: bg, border: `1px solid ${border}`, borderRadius: '6px',
        borderLeft: `3px solid ${accent}`, px: 0.875, py: 0.5,
      }}>
        <Box sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}><StaticStatement statement={stmt} /></Box>
      </Box>
    )
  }

  // ── Workflow header ───────────────────────────────────────────────────────

  const renderHeader = (title: string, onBack: (() => void) | null, actions?: React.ReactNode) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.875, borderBottom: `1px solid ${P.border}`, background: P.bg, flexShrink: 0 }}>
      {onBack && (
        <IconButton size="small" onClick={onBack}
          sx={{ width: 28, height: 28, borderRadius: '7px', border: `1px solid ${P.border}`, color: P.med, background: 'white', flexShrink: 0, '&:hover': { background: P.light } }}>
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </IconButton>
      )}
      <Typography sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, color: P.dark }}>
        {title}
      </Typography>
      {actions}
    </Box>
  )

  // ── Phase: selecting_main ─────────────────────────────────────────────────

  const renderSelectingMain = () => {
    const mixed = hasMixedPolarity(selections)
    const display = selections.map(toSelectionWithPolarity)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {renderHeader("Generate Suggestions", () => { onWorkflowChange(false) })}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', p: '1.25rem 1.5rem', gap: 1.25 }}>
            {/* Main selections heading with info bubble */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.med }}>
                Main selections
              </Typography>
              <Tooltip
                title="Main selections decide the location in the proof state where suggestions will be inserted. They can be thought of as the terms that suggestions can in principle replace."
                placement="right"
                arrow
              >
                <Box component="span" sx={{ display: 'flex', color: P.bright, cursor: 'default', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                  <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </Box>
              </Tooltip>
            </Box>

            {display.length === 0 ? (
              <Typography sx={{ fontSize: '0.75rem', color: P.med, fontStyle: 'italic' }}>
                No selections yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {display.map((s, i) => renderPolarityCard(s, i))}
              </Box>
            )}

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

            <Button
              onClick={() => setWorkflow({ phase: "selecting_additional", mainSelections: [...selections] })}
              disabled={mixed || selections.length === 0}
              sx={{ alignSelf: 'flex-start', px: 2, py: 0.875, fontSize: '0.82rem', borderRadius: '20px', ...shinyPurpleBtn }}
            >
              Confirm main selections
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Phase: selecting_additional ───────────────────────────────────────────

  const renderSelectingAdditional = (mainSelections: ProofStateSelection[]) => {
    const additional = getAdditionalSelections(mainSelections)
    const mainDisplay = mainSelections.map(toSelectionWithPolarity)
    const additionalDisplay = additional.map(toSelectionWithPolarity)
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
                Confirmed selections
              </Typography>
              {mainDisplay.map((s, i) => renderPolarityCard(s, i))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.med }}>
                Additional context
              </Typography>
              <Tooltip
                title="Additional selections provide extra context to guide the suggestion generation."
                placement="right"
                arrow
              >
                <Box component="span" sx={{ display: 'flex', color: P.bright, cursor: 'default', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                  <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </Box>
              </Tooltip>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: P.med, lineHeight: 1.5 }}>
              Make additional selections in the proof state to provide extra context if necessary, then generate suggestions.
            </Typography>
            {additionalDisplay.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {additionalDisplay.map((s, i) => renderPolarityCard(s, i))}
              </Box>
            )}
            <Button onClick={() => void refreshSuggestions(mainSelections)}
              sx={{ alignSelf: 'flex-start', px: 2, py: 0.875, fontSize: '0.82rem', borderRadius: '20px', ...shinyPurpleBtn }}
            >
              Generate suggestions
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Phase: loading ────────────────────────────────────────────────────────

  const renderLoading = (mainSelections: ProofStateSelection[]) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {renderHeader("Generate Suggestions", () => {
        abortRef.current?.abort()
        setWorkflow({ phase: "selecting_additional", mainSelections })
      })}
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
    const polarity = aggregatePolarity(mainSelections)
    const presentKinds = ALL_KINDS.filter(k => results.suggestions.some(r => r.kind === k))
    const filtered = results.suggestions.filter(r => activeKinds.has(r.kind))

    const filterActions = (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <Tooltip title="Filter by kind">
          <IconButton size="small" onClick={() => setFilterOpen(v => !v)}
            sx={{
              width: 26, height: 26, borderRadius: '6px',
              border: `1px solid ${filterOpen ? P.bright : P.border}`,
              color: filterOpen ? P.med : P.bright,
              background: filterOpen ? P.light : 'white',
              '&:hover': { background: P.light, borderColor: P.bright },
            }}>
            <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L13 9.414V15a1 1 0 01-.553.894l-4 2A1 1 0 017 17v-7.586L3.293 5.707A1 1 0 013 5V3z" clipRule="evenodd" />
            </svg>
          </IconButton>
        </Tooltip>
      </Box>
    )

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {renderHeader("Suggestions", () => setWorkflow({ phase: "selecting_additional", mainSelections }), filterActions)}

        {/* Filter chips (toggleable) */}
        {filterOpen && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1.25, py: 0.75, borderBottom: `1px solid ${P.border}`, background: P.bg, flexShrink: 0 }}>
            {presentKinds.map(kind => {
              const ks = KIND_STYLES[kind]
              const active = activeKinds.has(kind)
              return (
                <Chip key={kind} label={KIND_LABELS[kind]} size="small" onClick={() => toggleKind(kind)}
                  sx={{
                    fontSize: '0.65rem', fontWeight: 700, height: 22,
                    background: active ? ks.chipBg : 'white',
                    border: `1px solid ${active ? ks.accent : '#E0E0E0'}`,
                    color: active ? ks.text : '#9E9E9E',
                    cursor: 'pointer',
                    '&:hover': { background: ks.chipBg },
                  }}
                />
              )
            })}
          </Box>
        )}

        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, gap: 0.75 }}>
            {filtered.length === 0 ? (
              <Typography sx={{ p: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#78909C', fontStyle: 'italic' }}>
                No suggestions for the selected filters.
              </Typography>
            ) : filtered.map((result, _) => {
              const originalIdx = results.suggestions.indexOf(result)
              const thisApplying = isApplying && applyingIdx === originalIdx
              const isDisabled = isApplying
              const ks = KIND_STYLES[result.kind]
              const moveName = applyMoveFromKindAndPolarity(result.kind, polarity).name
              const hasBoth = result.suggestion !== null && result.generalResult !== null
              const isGeneralExpanded = expandedGeneralResults.has(originalIdx)
              const toggleGeneral = () => setExpandedGeneralResults(prev => {
                const n = new Set(prev); n.has(originalIdx) ? n.delete(originalIdx) : n.add(originalIdx); return n
              })

              return (
                <Paper key={originalIdx} elevation={0} sx={{
                  display: 'flex', flexDirection: 'row', alignItems: 'stretch',
                  background: 'white', border: `1px solid ${ks.border}`, borderRadius: '10px', overflow: 'hidden',
                  transition: 'box-shadow 0.15s',
                  '&:hover': { boxShadow: `0 2px 8px ${ks.accent}28` },
                }}>
                  {/* Left accent bar */}
                  <Box sx={{ width: 3, flexShrink: 0, background: ks.accent, borderRadius: '10px 0 0 10px' }} />

                  {/* Content */}
                  <Box sx={{ flex: 1, p: '8px 10px', display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0 }}>
                    {result.suggestion !== null && (
                      <Box sx={{ fontSize: '0.83rem', lineHeight: 1.5 }}>
                        <StaticStatement statement={result.suggestion} />
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
                        <Box sx={{ background: P.bg, border: `1px solid ${P.border}`, borderRadius: '7px', p: '6px 8px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                            <svg style={{ width: 11, height: 11, color: P.med, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: P.med, flex: 1 }}>
                              General result — saved to library
                            </Typography>
                            {hasBoth && (
                              <IconButton size="small" onClick={toggleGeneral}
                                sx={{ width: 16, height: 16, p: 0, color: P.med, '&:hover': { color: P.dark } }}>
                                <ChevronIcon rotated />
                              </IconButton>
                            )}
                          </Box>
                          <Typography sx={{ fontSize: '0.7rem', color: P.dark, fontWeight: 600, mb: 0.25 }}>
                            {result.generalResult.label}
                          </Typography>
                          <Box sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                            <StaticStatement statement={result.generalResult.statement} />
                          </Box>
                        </Box>
                      )
                    )}
                    {/* Kind chip at bottom */}
                    <Box>
                      <Chip label={KIND_LABELS[result.kind]} size="small"
                        sx={{ fontSize: '0.6rem', fontWeight: 700, height: 17, background: ks.chipBg, border: `1px solid ${ks.border}`, color: ks.text, '& .MuiChip-label': { px: '6px' } }}
                      />
                    </Box>
                  </Box>

                  {/* Apply button — right side */}
                  <Box sx={{ display: 'flex', alignItems: 'center', px: '8px', borderLeft: `1px solid ${ks.border}`, flexShrink: 0, background: `${ks.bg}88` }}>
                    <Tooltip title={moveName} placement="left">
                      <span>
                        <IconButton size="small" disabled={isDisabled} onClick={() => void handleApplySuggestion(result, originalIdx)}
                          sx={{
                            width: 32, height: 32, borderRadius: '8px',
                            border: `1.5px solid ${ks.border}`,
                            color: ks.text,
                            background: `linear-gradient(180deg, white 0%, ${ks.chipBg} 100%)`,
                            boxShadow: `0 1px 2px ${ks.accent}22, inset 0 1px 0 rgba(255,255,255,0.8)`,
                            '&:hover': { background: ks.chipBg, borderColor: ks.accent, boxShadow: `0 2px 5px ${ks.accent}33` },
                            '&:disabled': { opacity: 0.45 },
                          }}>
                          {thisApplying ? <SpinnerBox size={14} trackColor={ks.border} spinColor={ks.accent} /> : <PlayIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
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
    case "selecting_main":      return renderSelectingMain()
    case "selecting_additional": return renderSelectingAdditional(workflow.mainSelections)
    case "loading":              return renderLoading(workflow.mainSelections)
    case "loaded":               return renderResults(workflow.mainSelections, workflow.results, null)
    case "applying":             return renderResults(workflow.mainSelections, workflow.results, workflow.applyingIdx)
    case "error":                return renderError(workflow.mainSelections, workflow.error)
  }
}
