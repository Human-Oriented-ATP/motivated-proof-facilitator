import React, { JSX, useContext, useState, useEffect, useRef, useCallback } from "react"
import { z } from "zod"
import { ProofStateSelection, ProofStateSelectionContext } from "../core/ProofStateSelectionContext"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryAction, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove, ProofDiscoveryMoveExample } from "../core/ProofDiscoveryMove"
import { ProofDiscoveryStateContext, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import { ProofStateWithLibraryResult as ProofStateComponent } from "./ProofState"
import { queryMove } from "../endpoints/Move"
import MoveGenerator from "../../tests/MoveGenerator"
import { moves } from "../prompts/AllMoves"

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
  dispatchProofDiscoveryAction: React.Dispatch<ProofDiscoveryAction>,
  dispatchSelections: React.Dispatch<any>
): Promise<string | undefined> {
  const { proofState: newProofState, reasoning } = await queryMove(
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

// ─── Sub-components ───────────────────────────────────────────────────────────

type MovePanelStatus = "idle" | "loading" | "loaded" | "error"
type ApplicableMove = { move: ProofDiscoveryMove, filterResponse: FilterResponse }

function MoveKindBadge({ kind }: { kind: ProofDiscoveryMove["kind"] }): JSX.Element {
  const colors: Record<string, { bg: string, fg: string, border: string }> = {
    strengthening: { bg: "#E2F0E2", fg: "#0D2B11", border: "#A5D6A7" },
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
  const accentColor = isExample ? "#1B5E20" : "#dc2626"
  const borderColor = isExample ? "#A5D6A7" : "#fecaca"
  const bgColor = isExample ? "#F1F8F1" : "#fff5f5"
  const labelBg = isExample ? "#E2F0E2" : "#fee2e2"
  const labelFg = isExample ? "#0D2B11" : "#991b1b"

  return (
    <div style={{
      borderRadius: 10,
      marginBottom: 8,
      border: `1.5px solid ${borderColor}`,
      background: bgColor,
      overflow: "hidden",
    }}>
      {/* Header strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "6px 10px",
        borderBottom: `1px solid ${borderColor}`,
        background: labelBg,
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: "50%",
          background: accentColor, color: "white",
          fontSize: "0.65rem", fontWeight: 800, flexShrink: 0,
        }}>
          {isExample ? "✓" : "✗"}
        </span>
        <span style={{ fontSize: "0.73rem", fontWeight: 700, color: labelFg, flex: 1 }}>
          Example {idx + 1}
        </span>
        <span style={{
          fontSize: "0.65rem", fontWeight: 600, color: labelFg, opacity: 0.75,
          textTransform: "capitalize",
        }}>
          {example.kind.replace("-", " ")}
        </span>
      </div>

      <div style={{ padding: "8px 10px" }}>
        {/* Description */}
        <div style={{ fontSize: "0.73rem", color: "#374151", lineHeight: 1.45, marginBottom: 6 }}>
          {example.description}
        </div>
        {example.comment && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 5,
            fontSize: "0.68rem", color: "#6b7280", fontStyle: "italic",
            marginBottom: 7, lineHeight: 1.4,
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>💬</span>
            <span>{example.comment}</span>
          </div>
        )}

        {/* Input block */}
        <div style={{ marginBottom: 6 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, marginBottom: 4,
          }}>
            <span style={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "#6b7280",
            }}>Before</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>
          <div style={{
            background: "white", borderRadius: 7, padding: "6px 8px",
            border: "1px solid #e5e7eb", overflow: "auto", maxHeight: 200,
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
          }}>
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

        {/* Arrow divider */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 6,
        }}>
          <svg style={{ width: 20, height: 20, color: accentColor, opacity: 0.7 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Output block */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, marginBottom: 4,
          }}>
            <span style={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "#6b7280",
            }}>After</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>
          <div style={{
            background: "white", borderRadius: 7, padding: "6px 8px",
            border: "1px solid #e5e7eb", overflow: "auto", maxHeight: 200,
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
          }}>
            {example.outputState ? (
              <ProofStateComponent
                proofState={example.outputState.proofState}
                libraryResult={example.outputState.libraryResult ?? undefined}
              />
            ) : (
              <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontStyle: "italic" }}>No output state</span>
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

function MovePanelContent(): JSX.Element {
  useEffect(ensureKeyframe, [])

  const { proofDiscoveryState, dispatchProofDiscoveryAction } = useContext(ProofDiscoveryStateContext)
  const { selections, dispatch: dispatchSelections } = useContext(ProofStateSelectionContext)

  const [status, setStatus] = useState<MovePanelStatus>("idle")
  const [applicableMoves, setApplicableMoves] = useState<ApplicableMove[]>([])
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set())
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [infoIndex, setInfoIndex] = useState<number | null>(null)
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set())
  const [showAllMovesModal, setShowAllMovesModal] = useState(false)
  const [lastMoveReasoning, setLastMoveReasoning] = useState<string | null>(null)
  const [expandedLastReasoning, setExpandedLastReasoning] = useState(false)


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

  const handleMouseEnter = () => {
    setIsHovering(true)
    if (selections.length > 0 && selectionsKey !== lastFetchedSelectionsRef.current && status !== "loading") {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => { void fetchMoves() }, 1000)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const renderMoveSuggestions = () => {
    // No selections
    if (selections.length === 0 && status !== "loaded") {
      return (
        <div style={S.placeholderInner}>
          <svg style={{ width: 32, height: 32, color: "#A5D6A7" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span style={S.placeholderTitle}>Select expressions in the proof state</span>
          <span style={S.placeholderSub}>Click on hypotheses, goals, or sub-expressions to generate suggestions</span>
        </div>
      )
    }

    // Idle — has selections, waiting for hover
    if (status === "idle") {
      return (
        <div style={{ ...S.placeholderInner, minHeight: 120 }}>
          <svg style={{ width: 32, height: 32, color: "#1B5E20" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span style={S.placeholderTitle}>Hover here to generate move suggestions</span>
          <span style={S.placeholderSub}>Suggestions auto-generate 1 second after your last selection change</span>
        </div>
      )
    }

    // Loading
    if (status === "loading") {
      return (
        <div style={{ ...S.placeholderInner, minHeight: 120 }}>
          <div style={S.spinner} />
          <span style={{ color: "#0D2B11", fontSize: "0.85rem", fontWeight: 500 }}>Checking applicable moves…</span>
        </div>
      )
    }

    // Error
    if (status === "error") {
      return (
        <div style={{ ...S.placeholderInner, minHeight: 100, borderColor: "#fecaca" }}>
          <svg style={{ width: 28, height: 28, color: "#dc2626" }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span style={{ fontSize: "0.85rem", color: "#991b1b", fontWeight: 600 }}>Error</span>
          <span style={{ fontSize: "0.78rem", color: "#991b1b" }}>{errorMessage}</span>
          <button onClick={() => void fetchMoves()} style={S.retryButton}>Retry</button>
        </div>
      )
    }

    // Loaded
    return (
      <>
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
        {/* Last move reasoning (collapsed by default) */}
        {lastMoveReasoning && (
          <div style={S.lastReasoningBox}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
              <strong>Reasoning trace from last move:</strong>
              <button
                onClick={() => setExpandedLastReasoning(v => !v)}
                style={S.lastReasoningToggle}
                title={expandedLastReasoning ? "Hide reasoning" : "Show reasoning"}
              >
                {expandedLastReasoning ? "▲" : "▼"}
              </button>
            </div>
            {expandedLastReasoning && (
              <pre style={S.lastReasoningContent}>{lastMoveReasoning}</pre>
            )}
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
                    <svg style={{ width: 14, height: 14, flexShrink: 0, color: "#1B5E20" }} viewBox="0 0 20 20" fill="currentColor">
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
      </>
    )
  }

  return (
    <div style={S.card} onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsHovering(false)}>
      <div style={S.header}>
        <span style={S.headerTitle}>
          {status === "loaded" 
            ? `${applicableMoves.length} Applicable Move${applicableMoves.length !== 1 ? "s" : ""}`
            : "Move Suggestions"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button 
            onClick={() => setShowAllMovesModal(true)} 
            style={S.headerIconBtn} 
            title="View all available moves"
          >
            <svg style={{ width: 15, height: 15 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={() => void fetchMoves()} style={S.headerIconBtn} title="Refresh suggestions">
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {renderMoveSuggestions()}
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0" }} />
      <CustomMoveSection />

      {showAllMovesModal && (
        <div 
          style={S.modalOverlay} 
          onClick={() => setShowAllMovesModal(false)}
        >
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>Library of Moves</span>
              <button onClick={() => setShowAllMovesModal(false)} style={S.modalCloseBtn}>✕</button>
            </div>
            <div style={S.modalBody}>
              <AllMovesList />
            </div>
          </div>
        </div>
      )}
    </div>
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
      await applyMove(
        proofDiscoveryState,
        selections,
        customMove,
        dispatchProofDiscoveryAction,
        dispatchSelections
      )
      setDescription("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply move")
    } finally {
      setApplying(false)
    }
  }

  return (
    <div style={S.customWrapper}>
      <div style={S.customHeader}>
        <span style={S.customTitle}>Apply Custom Move</span>
        {selections.length === 0 && (
          <div style={S.customWarning}>
            <svg style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span style={{ fontSize: "0.7rem" }}>No selection</span>
          </div>
        )}
      </div>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Describe a move to apply..."
        style={S.customTextarea}
        rows={2}
      />
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8 }}>
        <select
          value={kind}
          onChange={e => setKind(e.target.value as import("../core/ProofDiscoveryMove").MoveKind)}
          style={S.customSelect}
        >
          <option value="strengthening">strengthening</option>
          <option value="weakening">weakening</option>
          <option value="equivalence">equivalence</option>
        </select>
        <button
          onClick={() => void handleApply()}
          disabled={applying || !description.trim()}
          style={{ ...S.customApplyBtn, opacity: applying || !description.trim() ? 0.5 : 1 }}
        >
          {applying ? <div style={{ ...S.spinner, width: 12, height: 12, borderWidth: "2px" }} /> : null}
          Apply
        </button>
      </div>
      {error && <div style={S.customError}>{error}</div>}
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────
// Designed to match the proof state card (white bg, rounded, shadow) with true fern/forest green accent

const S: Record<string, React.CSSProperties> = {
  // Card wrapper — mirrors proofStateContent
  card: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    padding: "0",
    overflow: "hidden",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  placeholderInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "3rem 1.5rem",
    textAlign: "center",
    minHeight: 180,
    flex: 1,
  },
  placeholderTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#0D2B11",
  },
  placeholderSub: {
    fontSize: "0.8rem",
    color: "#6b7280",
    maxWidth: 280,
    lineHeight: 1.5,
  },
  spinner: {
    width: 24, height: 24,
    border: "3px solid #E2F0E2",
    borderTopColor: "#1B5E20",
    borderRadius: "50%",
    animation: "move-panel-spin 0.8s linear infinite",
  },
  retryButton: {
    marginTop: 8, padding: "6px 16px", fontSize: "0.8rem", fontWeight: 600,
    color: "#991b1b", background: "white", border: "1.5px solid #fecaca",
    borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
  },

  // Header
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.85rem 1rem",
    background: "#F1F8F1",
    borderBottom: "1px solid #E2F0E2",
  },
  headerTitle: {
    fontSize: "0.85rem", fontWeight: 700, color: "#0D2B11",
  },
  countBadge: {
    fontSize: "0.75rem", fontWeight: 700, color: "#1B5E20",
    background: "#E2F0E2", border: "1px solid #A5D6A7",
    borderRadius: 9999, padding: "0 8px", lineHeight: "1.6",
  },
  headerIconBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, background: "white",
    border: "1px solid #E2F0E2", borderRadius: 8,
    cursor: "pointer", color: "#1B5E20", transition: "all 0.15s",
  },

  // Sync warning
  syncWarning: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 12px", fontSize: "0.75rem", fontWeight: 500,
    color: "#92400e", background: "#fffbeb",
    borderBottom: "1px solid #fef3c7",
  },
  syncRefreshBtn: {
    marginLeft: "auto", padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700,
    color: "#92400e", background: "white", border: "1.5px solid #fcd34d",
    borderRadius: 6, cursor: "pointer", flexShrink: 0,
  },

  // Move list
  moveList: {
    display: "flex", flexDirection: "column",
    padding: "8px",
    gap: "8px",
  },
  moveCard: {
    display: "flex", flexDirection: "column",
    background: "white",
    border: "1px solid #F1F8F1",
    borderRadius: 12,
    padding: "8px",
    transition: "transform 0.1s, box-shadow 0.1s",
  },
  moveRow: {
    display: "flex", alignItems: "center", gap: 6,
  },
  moveBtn: {
    flex: 1, display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600,
    color: "#0D2B11", background: "#F1F8F1",
    border: "1.5px solid #A5D6A7", borderRadius: 10,
    cursor: "pointer", transition: "all 0.15s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  infoBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: 10,
    background: "white", border: "1.5px solid #A5D6A7",
    cursor: "pointer", color: "#1B5E20", flexShrink: 0,
    transition: "all 0.15s",
  },

  // Info panel
  infoPanel: {
    marginTop: 8, padding: "12px",
    background: "#f9fafb", border: "1.5px solid #f3f4f6",
    borderRadius: 10, fontSize: "0.78rem", color: "#374151",
  },
  infoPanelHeader: {
    fontWeight: 700, fontSize: "0.82rem", color: "#0D2B11", marginBottom: 8,
    borderBottom: "1px solid #e5e7eb", paddingBottom: "4px",
  },
  infoRow: {
    marginBottom: 6, lineHeight: 1.5, wordBreak: "break-word",
  },
  examplesToggle: {
    display: "flex", alignItems: "center", gap: 4,
    marginTop: 8, padding: "4px 8px", background: "#F1F8F1", border: "1px solid #A5D6A7",
    borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: "#0D2B11",
  },

  // Reasoning
  reasoningToggle: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 8px", background: "transparent", border: "none",
    cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, color: "#6b7280",
    borderRadius: 6, marginTop: 4, transition: "background 0.15s",
  },
  reasoningContent: {
    fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.5,
    padding: "8px 12px", whiteSpace: "pre-wrap",
    background: "#f9fafb", borderRadius: 8, marginTop: 4,
    borderLeft: "3px solid #2E7D32",
  },
  lastReasoningBox: {
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 12px",
    margin: "8px",
    fontSize: "0.85rem",
    color: "#374151",
  },
  lastReasoningContent: {
    whiteSpace: "pre-wrap",
    marginTop: "6px",
    fontSize: "0.82rem",
    color: "#1f2937",
  },
  lastReasoningToggle: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "#1B5E20",
    padding: "2px 6px",
    lineHeight: 1,
  },
  emptyMsg: {
    padding: "3rem 1.5rem", textAlign: "center",
    fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic",
  },
  customWrapper: {
    position: "relative" as const,
    margin: "12px 10px 10px",
    padding: "10px",
    background: "#F1F8F1",
    border: "1.5px solid #A5D6A7",
    borderRadius: 12,
  },
  customHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  customTitle: {
    fontSize: "0.72rem",
    fontWeight: 800,
    color: "#0D2B11",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  customTextarea: {
    width: "100%", fontSize: "0.78rem", color: "#374151",
    border: "1.5px solid #A5D6A7", borderRadius: 8,
    padding: "6px 8px", resize: "vertical" as const,
    fontFamily: "inherit", boxSizing: "border-box" as const,
    outline: "none", background: "white", lineHeight: 1.4,
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
  },
  customSelect: {
    flex: 1, fontSize: "0.72rem", color: "#0D2B11",
    border: "1.5px solid #A5D6A7", borderRadius: 8,
    padding: "4px 8px", background: "white",
    cursor: "pointer", outline: "none",
    fontWeight: 600,
  },
  customApplyBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700,
    color: "white", background: "#2E7D32",
    border: "none", borderRadius: 8, cursor: "pointer",
    flexShrink: 0 as const, boxShadow: "0 2px 4px rgba(46,125,50,0.2)",
  },
  customError: {
    marginTop: 6, fontSize: "0.7rem", color: "#991b1b",
    padding: "4px 8px", background: "#fff1f2",
    border: "1px solid #fecaca", borderRadius: 6,
  },
  customWarning: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: "0.65rem", fontWeight: 700,
    color: "#92400e", background: "#fffbeb",
    border: "1px solid #fde68a", padding: "2px 6px", borderRadius: 6,
  },
  modalOverlay: {
    position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.4)", 
    zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    backdropFilter: "blur(2px)",
  },
  modalContent: {
    background: "white", borderRadius: 20, width: "100%", maxWidth: 600,
    maxHeight: "85vh", display: "flex", flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9",
  },
  modalTitle: {
    fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em",
  },
  modalCloseBtn: {
    background: "#f1f5f9", border: "none", cursor: "pointer",
    width: 28, height: 28, borderRadius: "50%",
    fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center",
  },
  modalBody: {
    overflowY: "auto" as const, flex: 1, padding: "1rem 0",
  },
}

// ─── All Moves List ────────────────────────────────────────────────────────

function AllMovesList(): JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)

  const selected = selectedIdx !== null ? moves[selectedIdx] : null

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0 12px 12px 12px" }}>
        <button
          onClick={() => setShowGenerator(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", padding: "10px", borderRadius: 10,
            background: "#2E7D32", color: "white", border: "none", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 2px 4px rgba(46,125,50,0.2)",
          }}
        >
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Move Definition
        </button>
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6" }}>
        {moves.map((move, idx) => (
          <div key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
            <button
              onClick={() => { setSelectedIdx(selectedIdx === idx ? null : idx); setExamplesOpen(false) }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                width: "100%", padding: "12px 14px", border: "none",
                background: selectedIdx === idx ? "#F1F8F1" : "transparent",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: "0.85rem", 
                  fontWeight: selectedIdx === idx ? 700 : 600,
                  color: selectedIdx === idx ? "#0D2B11" : "#374151" 
                }}>
                  {move.name}
                </div>
              </div>
              <MoveKindBadge kind={move.kind} />
              <svg style={{
                width: 14, height: 14, flexShrink: 0, color: "#9ca3af",
                transition: "transform 0.2s",
                transform: selectedIdx === idx ? "rotate(90deg)" : "rotate(0deg)",
              }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {selectedIdx === idx && selected && (
              <div style={{
                padding: "12px 16px",
                background: "#f9fafb",
                fontSize: "0.8rem", color: "#374151", lineHeight: 1.5,
              }}>
                <div style={{ marginBottom: 6, wordBreak: "break-word" }}><strong>Trigger:</strong> {selected.trigger || <em style={{ color: "#9ca3af" }}>none</em>}</div>
                <div style={{ wordBreak: "break-word" }}><strong>Action:</strong> {selected.action}</div>
                {selected.examples.length > 0 && (
                  <>
                    <button onClick={() => setExamplesOpen(v => !v)} style={{
                      display: "flex", alignItems: "center", gap: 4, marginTop: 10,
                      padding: "6px 10px", background: "#F1F8F1", border: "1px solid #E2F0E2",
                      borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, color: "#1B5E20",
                    }}>
                      <svg style={{
                        width: 12, height: 12, transition: "transform 0.2s",
                        transform: examplesOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Examples ({selected.examples.length})
                    </button>
                    {examplesOpen && (
                      <div style={{ marginTop: 12 }}>
                        {selected.examples.map((ex, exIdx) => (
                          <ExamplePreview key={exIdx} example={ex} idx={exIdx} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showGenerator && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100,
            display: "flex", alignItems: "stretch", justifyContent: "center", padding: "1.5rem",
          }}
          onClick={() => setShowGenerator(false)}
        >
          <div
            style={{
              background: "white", borderRadius: 16, width: "100%", maxWidth: 1200,
              display: "flex", flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "1rem 1.5rem", borderBottom: "1.5px solid #e2e8f0",
              background: "white", flexShrink: 0,
            }}>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", letterSpacing: "-0.01em" }}>Live Move Generator</span>
              <button
                onClick={() => setShowGenerator(false)}
                style={{ background: "#f1f5f9", border: "none", cursor: "pointer",
                  width: 32, height: 32, borderRadius: "50%",
                  fontSize: "0.9rem", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "1.5rem", background: "#f8fafc" }}>
              <MoveGenerator />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Public Move Panel ────────────────────────────────────────────────────────

export function MovePanel(): JSX.Element {
  return <MovePanelContent />
}