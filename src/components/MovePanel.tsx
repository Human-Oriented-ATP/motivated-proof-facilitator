import React, { JSX, useContext, useState, useEffect, useRef, useCallback } from "react"
import { z } from "zod"
import { ProofStateSelection, ProofStateSelectionContext } from "../core/ProofStateSelectionContext"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove, ProofDiscoveryMoveExample } from "../core/ProofDiscoveryMove"
import { goalConjunctionMove } from "../prompts/goalConjunction"
import { goalDisjunctionMove } from "../prompts/goalDisjunction"
import { goalEquivalenceMove } from "../prompts/goalEquivalence"
import { goalExistentialMove } from "../prompts/goalExistential"
import { goalImplicationMove } from "../prompts/goalImplication"
import { goalContradictionMove } from "../prompts/goalContradiction"
import { goalUniversalMove } from "../prompts/goalUniversal"
import { hypothesisConjunctionMove } from "../prompts/hypothesisConjunction"
import { hypothesisDisjunctionMove } from "../prompts/hypothesisDisjunction"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { ProofStateWithLibraryResult as ProofStateComponent } from "./ProofState"

const moves: ProofDiscoveryMove[] = [
    goalConjunctionMove,
    goalDisjunctionMove,
    goalEquivalenceMove,
    goalExistentialMove,
    goalImplicationMove,
    goalContradictionMove,
    goalUniversalMove,
    hypothesisConjunctionMove,
    hypothesisDisjunctionMove
]

const FilterResponseSchema = z.object({
  meetsCondition: z.boolean(),
  reasoning: z.string()
})

type FilterResponse = z.infer<typeof FilterResponseSchema>

export async function checkMoveValidity(proofState: ProofState, selections: ProofStateSelection[], move: ProofDiscoveryMove): Promise<FilterResponse> {
    const response = await fetch("https://atp-backend-rygt.onrender.com/filter", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            proofState,
            selections,
            triggerCriterion: move.trigger
        }),
      })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: unknown = await response.json()
    return FilterResponseSchema.parse(data)
}

/** Get all the applicable moves for a given proof state and selections. */
export async function getApplicableMoves(
  proofDiscoveryState: ProofDiscoveryState,
  selections: ProofStateSelection[]
): Promise<{ move: ProofDiscoveryMove, filterResponse: FilterResponse }[]> {
  const results = await Promise.all(
    moves.map(async (move) => {
      try {
        const filterResponse = await checkMoveValidity(getCurrentProofState(proofDiscoveryState), selections, move)
        return filterResponse.meetsCondition ? { move, filterResponse } : null
      } catch (error) {
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
  dispatchProofDiscoveryAction: React.Dispatch<import("../core/ProofDiscoveryState").ProofDiscoveryAction>
): Promise<void> {
  const response = await fetch("https://atp-backend-rygt.onrender.com/move", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proofState: getCurrentProofState(proofDiscoveryState),
      move: JSON.stringify(move),
      selections
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data: unknown = await response.json()
  const newProofState = ProofStateSchema.parse(data)

  dispatchProofDiscoveryAction({
    action: "transition",
    newProofState,
    move: {
      kind: move.kind,
      description: move.name
    }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type MovePanelStatus = "idle" | "loading" | "loaded" | "error"
type ApplicableMove = { move: ProofDiscoveryMove, filterResponse: FilterResponse }

function MoveKindBadge({ kind }: { kind: ProofDiscoveryMove["kind"] }): JSX.Element {
  const colors: Record<string, { bg: string, fg: string, border: string }> = {
    strengthening: { bg: "#dcfce7", fg: "#166534", border: "#86efac" },
    weakening: { bg: "#fef9c3", fg: "#854d0e", border: "#fde047" },
    equivalence: { bg: "#dbeafe", fg: "#1e40af", border: "#93c5fd" },
  }
  const c = colors[kind] ?? { bg: "#f3f4f6", fg: "#374151", border: "#d1d5db" }
  return (
    <span style={{
      display: "inline-block", fontSize: "0.65rem", fontWeight: 700,
      padding: "1px 7px", borderRadius: "9999px",
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
      textTransform: "capitalize", lineHeight: 1.5, letterSpacing: "0.02em",
    }}>
      {kind}
    </span>
  )
}

/** Inline preview of a single move example (compact). */
function ExamplePreview({ example, idx }: { example: ProofDiscoveryMoveExample, idx: number }): JSX.Element {
  const isExample = example.kind === "example"
  return (
    <div style={{
      padding: "8px 10px", borderRadius: 8, marginBottom: 6,
      border: `1px solid ${isExample ? "#86efac" : "#fca5a5"}`,
      background: isExample ? "#f0fdf4" : "#fef2f2",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151" }}>
          Example {idx + 1}
        </span>
        <span style={{
          fontSize: "0.6rem", fontWeight: 700, padding: "0px 5px", borderRadius: 9999,
          background: isExample ? "#dcfce7" : "#fee2e2",
          color: isExample ? "#166534" : "#991b1b",
        }}>
          {isExample ? "✓" : "✗"}
        </span>
      </div>
      <div style={{ fontSize: "0.72rem", color: "#4b5563" }}>{example.description}</div>
      {example.comment && (
        <div style={{ fontSize: "0.68rem", color: "#6b7280", fontStyle: "italic", marginTop: 2 }}>
          {example.comment}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 45%", minWidth: 0 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", marginBottom: 2 }}>Input</div>
          <div style={{ background: "white", borderRadius: 6, padding: 6, border: "1px solid #e5e7eb", overflow: "auto", maxHeight: 180 }}>
            <ProofStateIdContext.Provider value={{ proofNodeId: 0, proofContextId: -1 }}>
              <ProofStateSelectionContext.Provider value={{ selections: example.selections, dispatch: () => {} }}>
                <ProofStateComponent
                  proofState={example.inputState.proofState}
                  libraryResult={example.inputState.libraryResult ?? undefined}
                />
              </ProofStateSelectionContext.Provider>
            </ProofStateIdContext.Provider>
          </div>
        </div>
        <div style={{ flex: "1 1 45%", minWidth: 0 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", marginBottom: 2 }}>Output</div>
          <div style={{ background: "white", borderRadius: 6, padding: 6, border: "1px solid #e5e7eb", overflow: "auto", maxHeight: 180 }}>
            {example.outputState ? (
              <ProofStateComponent
                proofState={example.outputState.proofState}
                libraryResult={example.outputState.libraryResult ?? undefined}
              />
            ) : (
              <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>No output state</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Move Panel Component ─────────────────────────────────────────────────────

const KEYFRAME_ID = "move-panel-spin-keyframe"
function ensureKeyframe() {
  if (typeof document !== "undefined" && !document.getElementById(KEYFRAME_ID)) {
    const style = document.createElement("style")
    style.id = KEYFRAME_ID
    style.textContent = `@keyframes move-panel-spin { to { transform: rotate(360deg); } }`
    document.head.appendChild(style)
  }
}

export function MovePanel(): JSX.Element {
  useEffect(ensureKeyframe, [])

  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections } = useContext(ProofStateSelectionContext)

  const [status, setStatus] = useState<MovePanelStatus>("idle")
  const [applicableMoves, setApplicableMoves] = useState<ApplicableMove[]>([])
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set())
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [infoIndex, setInfoIndex] = useState<number | null>(null)
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set())

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedSelectionsRef = useRef<string>("")
  const lastGraphOrderRef = useRef<number>(proofDiscoveryState.graph.order)

  const selectionsKey = JSON.stringify(selections)
  const isOutOfSync = status === "loaded" && selectionsKey !== lastFetchedSelectionsRef.current

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

  // Debounce auto-fetch on selection change while hovering
  useEffect(() => {
    if (selectionsKey !== lastFetchedSelectionsRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (isHovering && selections.length > 0) {
        debounceRef.current = setTimeout(() => { void fetchMoves() }, 1000)
      }
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionsKey, isHovering])

  const fetchMoves = useCallback(async () => {
    setStatus("loading")
    setErrorMessage("")
    setExpandedReasoning(new Set())
    setExpandedExamples(new Set())
    setInfoIndex(null)
    try {
      const result = await getApplicableMoves(proofDiscoveryState, selections)
      setApplicableMoves(result)
      setStatus("loaded")
      lastFetchedSelectionsRef.current = selectionsKey
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proofDiscoveryState, selections, selectionsKey])

  const handleApply = async (am: ApplicableMove, idx: number) => {
    setApplyingIndex(idx)
    try {
      await applyMove(proofDiscoveryState, selections, am.move, dispatchProofDiscoveryAction)
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

  const handleMouseEnter = () => {
    setIsHovering(true)
    if (selections.length > 0 && selectionsKey !== lastFetchedSelectionsRef.current && status !== "loading") {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => { void fetchMoves() }, 1000)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // No selections
  if (selections.length === 0 && status !== "loaded") {
    return (
      <div style={S.card}>
        <div style={S.placeholderInner}>
          <svg style={{ width: 32, height: 32, color: "#86efac" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span style={S.placeholderTitle}>Select expressions in the proof state</span>
          <span style={S.placeholderSub}>Click on hypotheses, goals, or sub-expressions to generate suggestions for modifying the proof state</span>
        </div>
      </div>
    )
  }

  // Idle — has selections, waiting for hover
  if (status === "idle") {
    return (
      <div style={S.card} onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsHovering(false)}>
        <div style={{ ...S.placeholderInner, minHeight: 200 }}>
          <svg style={{ width: 32, height: 32, color: "#16a34a" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span style={S.placeholderTitle}>Hover here to generate move suggestions</span>
          <span style={S.placeholderSub}>Suggestions auto-generate 1 second after your last selection change</span>
        </div>
      </div>
    )
  }

  // Loading
  if (status === "loading") {
    return (
      <div style={S.card}>
        <div style={{ ...S.placeholderInner, minHeight: 200 }}>
          <div style={S.spinner} />
          <span style={{ color: "#166534", fontSize: "0.85rem", fontWeight: 500 }}>Checking applicable moves…</span>
        </div>
      </div>
    )
  }

  // Error
  if (status === "error") {
    return (
      <div style={{ ...S.card, borderColor: "#fecaca" }}>
        <div style={{ ...S.placeholderInner, minHeight: 140 }}>
          <svg style={{ width: 28, height: 28, color: "#dc2626" }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span style={{ fontSize: "0.85rem", color: "#991b1b", fontWeight: 600 }}>Error</span>
          <span style={{ fontSize: "0.78rem", color: "#991b1b" }}>{errorMessage}</span>
          <button onClick={() => void fetchMoves()} style={S.retryButton}>Retry</button>
        </div>
      </div>
    )
  }

  // ── Loaded ──────────────────────────────────────────────────────────────
  return (
    <div style={S.card} onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsHovering(false)}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.headerTitle}>Applicable Moves</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={S.countBadge}>{applicableMoves.length}</span>
          <button onClick={() => void fetchMoves()} style={S.headerIconBtn} title="Refresh suggestions">
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Out-of-sync warning */}
      {isOutOfSync && (
        <div style={S.syncWarning}>
          <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Selections have changed since these suggestions were generated.</span>
          <button onClick={() => void fetchMoves()} style={S.syncRefreshBtn}>Refresh</button>
        </div>
      )}

      {/* Move list */}
      {applicableMoves.length === 0 ? (
        <div style={S.emptyMsg}>No applicable moves for the current selection.</div>
      ) : (
        <div style={S.moveList}>
          {applicableMoves.map((am, idx) => (
            <div key={idx} style={S.moveCard}>
              {/* Move row */}
              <div style={S.moveRow}>
                <button
                  onClick={() => void handleApply(am, idx)}
                  disabled={applyingIndex !== null}
                  style={{ ...S.moveBtn, opacity: applyingIndex !== null && applyingIndex !== idx ? 0.45 : 1 }}
                  title={`Apply "${am.move.name}"`}
                >
                  {applyingIndex === idx ? (
                    <div style={{ ...S.spinner, width: 14, height: 14, borderWidth: "2px" }} />
                  ) : (
                    <svg style={{ width: 14, height: 14, flexShrink: 0, color: "#16a34a" }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span style={{ flex: 1, textAlign: "left" }}>{am.move.name}</span>
                  <MoveKindBadge kind={am.move.kind} />
                </button>

                {/* Info icon */}
                <button
                  style={S.infoBtn}
                  onClick={() => setInfoIndex(infoIndex === idx ? null : idx)}
                  title="View move details"
                >
                  <svg style={{ width: 15, height: 15 }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Info panel (expanded inline) */}
              {infoIndex === idx && (
                <div style={S.infoPanel}>
                  <div style={S.infoPanelHeader}>{am.move.name}</div>
                  <div style={S.infoRow}><strong>Kind:</strong> <MoveKindBadge kind={am.move.kind} /></div>
                  <div style={S.infoRow}><strong>Trigger:</strong> <span>{am.move.trigger}</span></div>
                  <div style={S.infoRow}><strong>Action:</strong> <span>{am.move.action}</span></div>

                  {/* Expandable examples */}
                  {am.move.examples.length > 0 && (
                    <>
                      <button onClick={() => toggleExamples(idx)} style={S.examplesToggle}>
                        <svg style={{
                          width: 12, height: 12, transition: "transform 0.2s",
                          transform: expandedExamples.has(idx) ? "rotate(90deg)" : "rotate(0deg)",
                        }} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Examples ({am.move.examples.length})</span>
                      </button>
                      {expandedExamples.has(idx) && (
                        <div style={{ marginTop: 6 }}>
                          {am.move.examples.map((ex, exIdx) => (
                            <ExamplePreview key={exIdx} example={ex} idx={exIdx} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Collapsible reasoning */}
              <button onClick={() => toggleReasoning(idx)} style={S.reasoningToggle}>
                <svg style={{
                  width: 12, height: 12, transition: "transform 0.2s",
                  transform: expandedReasoning.has(idx) ? "rotate(90deg)" : "rotate(0deg)",
                }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>Reasoning</span>
              </button>
              {expandedReasoning.has(idx) && (
                <div style={S.reasoningContent}>{am.filterResponse.reasoning}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────
// Designed to match the proof state card (white bg, rounded, shadow) with green accent

const S: Record<string, React.CSSProperties> = {
  // Card wrapper — mirrors proofStateContent
  card: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1.5px solid #bbf7d0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  placeholderInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "2.5rem 1.5rem",
    textAlign: "center",
    minHeight: 160,
    flex: 1,
  },
  placeholderTitle: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#166534",
  },
  placeholderSub: {
    fontSize: "0.75rem",
    color: "#6b7280",
    maxWidth: 260,
    lineHeight: 1.45,
  },
  spinner: {
    width: 24, height: 24,
    border: "3px solid #bbf7d0",
    borderTopColor: "#16a34a",
    borderRadius: "50%",
    animation: "move-panel-spin 0.8s linear infinite",
  },
  retryButton: {
    marginTop: 4, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600,
    color: "#991b1b", background: "white", border: "1.5px solid #fca5a5",
    borderRadius: 6, cursor: "pointer",
  },

  // Header
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.65rem 0.85rem",
    background: "#f0fdf4",
    borderBottom: "1px solid #dcfce7",
  },
  headerTitle: {
    fontSize: "0.82rem", fontWeight: 700, color: "#166534",
  },
  countBadge: {
    fontSize: "0.7rem", fontWeight: 700, color: "#166534",
    background: "#dcfce7", border: "1px solid #86efac",
    borderRadius: 9999, padding: "0 7px", lineHeight: "1.6",
  },
  headerIconBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 26, height: 26, background: "white",
    border: "1px solid #86efac", borderRadius: 6,
    cursor: "pointer", color: "#16a34a",
  },

  // Sync warning
  syncWarning: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 12px", fontSize: "0.73rem", fontWeight: 500,
    color: "#92400e", background: "#fefce8",
    borderBottom: "1px solid #fde68a",
  },
  syncRefreshBtn: {
    marginLeft: "auto", padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700,
    color: "#92400e", background: "white", border: "1px solid #fbbf24",
    borderRadius: 4, cursor: "pointer", flexShrink: 0,
  },

  // Move list
  moveList: {
    display: "flex", flexDirection: "column",
  },
  moveCard: {
    display: "flex", flexDirection: "column",
    borderBottom: "1px solid #f0fdf4",
    padding: "8px 10px",
  },
  moveRow: {
    display: "flex", alignItems: "center", gap: 5,
  },
  moveBtn: {
    flex: 1, display: "flex", alignItems: "center", gap: 7,
    padding: "7px 10px", fontSize: "0.82rem", fontWeight: 600,
    color: "#166534", background: "#f0fdf4",
    border: "1.5px solid #86efac", borderRadius: 8,
    cursor: "pointer", transition: "all 0.15s",
  },
  infoBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: 6,
    background: "#f0fdf4", border: "1px solid #86efac",
    cursor: "pointer", color: "#16a34a", flexShrink: 0,
    transition: "background 0.15s",
  },

  // Info panel
  infoPanel: {
    marginTop: 6, padding: "10px 12px",
    background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: "0.75rem", color: "#374151",
  },
  infoPanelHeader: {
    fontWeight: 700, fontSize: "0.8rem", color: "#166534", marginBottom: 6,
  },
  infoRow: {
    marginBottom: 4, lineHeight: 1.5, wordBreak: "break-word",
  },
  examplesToggle: {
    display: "flex", alignItems: "center", gap: 4,
    marginTop: 6, padding: 0, background: "none", border: "none",
    cursor: "pointer", fontSize: "0.73rem", fontWeight: 600, color: "#16a34a",
  },

  // Reasoning
  reasoningToggle: {
    display: "flex", alignItems: "center", gap: 4,
    padding: "3px 0 0 0", background: "none", border: "none",
    cursor: "pointer", fontSize: "0.72rem", fontWeight: 500, color: "#6b7280",
  },
  reasoningContent: {
    fontSize: "0.75rem", color: "#4b5563", lineHeight: 1.5,
    padding: "4px 0 2px 16px", whiteSpace: "pre-wrap",
  },
  emptyMsg: {
    padding: "2rem 1rem", textAlign: "center",
    fontSize: "0.82rem", color: "#6b7280",
  },
}