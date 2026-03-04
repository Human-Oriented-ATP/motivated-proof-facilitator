import React, { JSX, useContext, useState, useEffect, useRef, useCallback } from "react"
import { z } from "zod"
import { ProofStateSelection, ProofStateSelectionContext } from "../core/ProofStateSelectionContext"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod"
import { getCurrentProofState, ProofDiscoveryState } from "../core/ProofDiscoveryState"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { goalConjunctionMove } from "../prompts/goalConjunction"
import { goalDisjunctionMove } from "../prompts/goalDisjunction"
import { goalEquivalenceMove } from "../prompts/goalEquivalence"
import { goalExistentialMove } from "../prompts/goalExistential"
import { goalImplicationMove } from "../prompts/goalImplication"
import { goalContradictionMove } from "../prompts/goalContradiction"
import { goalUniversalMove } from "../prompts/goalUniversal"
import { hypothesisConjunctionMove } from "../prompts/hypothesisConjunction"
import { hypothesisDisjunctionMove } from "../prompts/hypothesisDisjunction"
import { ProofDiscoveryStateContext } from "../core/ProofDiscoveryStateContext"

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

// ─── Move Panel Component ─────────────────────────────────────────────────────

type MovePanelStatus = "idle" | "loading" | "loaded" | "error"

type ApplicableMove = { move: ProofDiscoveryMove, filterResponse: FilterResponse }

/** A color badge for the move kind. */
function MoveKindBadge({ kind }: { kind: ProofDiscoveryMove["kind"] }): JSX.Element {
  const colors: Record<string, { bg: string, fg: string }> = {
    strengthening: { bg: "#dcfce7", fg: "#166534" },
    weakening: { bg: "#fef9c3", fg: "#854d0e" },
    equivalence: { bg: "#dbeafe", fg: "#1e40af" },
  }
  const c = colors[kind] ?? { bg: "#f3f4f6", fg: "#374151" }
  return (
    <span style={{
      display: "inline-block",
      fontSize: "0.7rem",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: "9999px",
      background: c.bg,
      color: c.fg,
      textTransform: "capitalize",
      lineHeight: 1.4,
    }}>
      {kind}
    </span>
  )
}

/**
 * MovePanel – displays applicable proof discovery moves for the current selections.
 *
 * Behaviour:
 * - Shows an idle prompt when no suggestions have been generated
 * - Auto-generates suggestions 1 s after the last selection change when hovered
 * - Displays applicable moves as green-themed buttons
 * - Each move has a collapsible reasoning trace
 * - A small preview icon shows move details on hover
 * - Clicking a move applies it
 */
// Inject spinner keyframe once
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
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track whether we already fetched for the current selections snapshot
  const lastFetchedSelectionsRef = useRef<string>("")

  const selectionsKey = JSON.stringify(selections)

  // When selections change, reset the debounce timer.
  // We only auto-fire when the panel is being hovered.
  useEffect(() => {
    // If selections changed, mark that we haven't fetched yet
    if (selectionsKey !== lastFetchedSelectionsRef.current) {
      // clear previous timer
      if (debounceRef.current) clearTimeout(debounceRef.current)

      // only auto-fetch if hovering and there are selections
      if (isHovering && selections.length > 0) {
        debounceRef.current = setTimeout(() => {
          void fetchMoves()
        }, 1000)
      }
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionsKey, isHovering])

  const fetchMoves = useCallback(async () => {
    setStatus("loading")
    setErrorMessage("")
    setExpandedReasoning(new Set())
    setPreviewIndex(null)
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
      // Reset panel after successful application
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
    setExpandedReasoning(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
    // If we haven't fetched for the current selections yet, start the timer
    if (selections.length > 0 && selectionsKey !== lastFetchedSelectionsRef.current && status !== "loading") {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void fetchMoves()
      }, 1000)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // No selections made yet
  if (selections.length === 0 && status !== "loaded") {
    return (
      <div style={panelStyles.noSelectionContainer}>
        <svg style={{ width: 28, height: 28, color: "#9ca3af" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <span style={panelStyles.noSelectionTitle}>Select expressions in the proof state</span>
        <span style={panelStyles.noSelectionSubtitle}>Click on hypotheses, goals, or sub-expressions to generate suggestions for modifying the proof state</span>
      </div>
    )
  }

  // Idle / prompt state (has selections but hasn't fetched yet)
  if (status === "idle") {
    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovering(false)}
        style={panelStyles.idleContainer}
      >
        <svg style={{ width: 28, height: 28, color: "#6b7280" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span style={panelStyles.idleTitle}>Hover over this area to generate suggestions for applicable moves</span>
        <span style={panelStyles.idleSubtitle}>Suggestions are automatically generated waiting one second after the last selection in the proof state</span>
      </div>
    )
  }

  // Loading state
  if (status === "loading") {
    return (
      <div style={panelStyles.loadingContainer}>
        <div style={panelStyles.spinner} />
        <span style={{ color: "#374151", fontSize: "0.9rem" }}>Checking applicable moves…</span>
      </div>
    )
  }

  // Error state
  if (status === "error") {
    return (
      <div style={panelStyles.errorContainer}>
        <span style={{ fontWeight: 600 }}>Error</span>
        <span style={{ fontSize: "0.85rem" }}>{errorMessage}</span>
        <button onClick={() => void fetchMoves()} style={panelStyles.retryButton}>Retry</button>
      </div>
    )
  }

  // Loaded state
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovering(false)}
      style={panelStyles.container}
    >
      <div style={panelStyles.header}>
        <span style={panelStyles.headerTitle}>
          Applicable Moves ({applicableMoves.length})
        </span>
        <button
          onClick={() => void fetchMoves()}
          style={panelStyles.refreshButton}
          title="Refresh suggestions"
        >
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {applicableMoves.length === 0 ? (
        <div style={panelStyles.emptyMessage}>
          No applicable moves for the current selection.
        </div>
      ) : (
        <div style={panelStyles.moveList}>
          {applicableMoves.map((am, idx) => (
            <div key={idx} style={panelStyles.moveCard}>
              {/* Move header row */}
              <div style={panelStyles.moveHeaderRow}>
                <button
                  onClick={() => void handleApply(am, idx)}
                  disabled={applyingIndex !== null}
                  style={{
                    ...panelStyles.moveButton,
                    opacity: applyingIndex !== null && applyingIndex !== idx ? 0.5 : 1,
                  }}
                  title={`Apply "${am.move.name}"`}
                >
                  {applyingIndex === idx ? (
                    <div style={{ ...panelStyles.spinner, width: 16, height: 16, borderWidth: "2px" }} />
                  ) : (
                    <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span style={{ flex: 1, textAlign: "left" }}>{am.move.name}</span>
                  <MoveKindBadge kind={am.move.kind} />
                </button>

                {/* Preview icon */}
                <div
                  style={panelStyles.previewIconWrapper}
                  onMouseEnter={() => setPreviewIndex(idx)}
                  onMouseLeave={() => setPreviewIndex(null)}
                >
                  <svg style={{ width: 16, height: 16, color: "#6b7280" }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>

                  {/* Move details tooltip */}
                  {previewIndex === idx && (
                    <div style={panelStyles.previewTooltip}>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.8rem" }}>{am.move.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#374151", marginBottom: 4 }}>
                        <strong>Kind:</strong> {am.move.kind}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#374151", marginBottom: 4 }}>
                        <strong>Trigger:</strong> {am.move.trigger}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#374151" }}>
                        <strong>Action:</strong> {am.move.action}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible reasoning */}
              <button
                onClick={() => toggleReasoning(idx)}
                style={panelStyles.reasoningToggle}
              >
                <svg
                  style={{
                    width: 14,
                    height: 14,
                    transition: "transform 0.2s",
                    transform: expandedReasoning.has(idx) ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Reasoning</span>
              </button>

              {expandedReasoning.has(idx) && (
                <div style={panelStyles.reasoningContent}>
                  {am.filterResponse.reasoning}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const panelStyles: Record<string, React.CSSProperties> = {
  noSelectionContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "2rem 1.5rem",
    background: "#f9fafb",
    borderRadius: 12,
    border: "2px dashed #e5e7eb",
    textAlign: "center",
    minHeight: 120,
  },
  noSelectionTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#6b7280",
  },
  noSelectionSubtitle: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    maxWidth: 300,
    lineHeight: 1.4,
  },
  idleContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "2rem 1.5rem",
    background: "#f3f4f6",
    borderRadius: 12,
    border: "2px dashed #d1d5db",
    textAlign: "center",
    cursor: "default",
    minHeight: 120,
    transition: "background 0.2s",
  },
  idleTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#374151",
  },
  idleSubtitle: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    maxWidth: 320,
    lineHeight: 1.4,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "2rem",
    background: "#f0fdf4",
    borderRadius: 12,
    border: "2px solid #bbf7d0",
    minHeight: 120,
  },
  spinner: {
    width: 24,
    height: 24,
    border: "3px solid #bbf7d0",
    borderTopColor: "#16a34a",
    borderRadius: "50%",
    animation: "move-panel-spin 0.8s linear infinite",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "1.5rem",
    background: "#fef2f2",
    borderRadius: 12,
    border: "2px solid #fecaca",
    color: "#991b1b",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 6,
    padding: "6px 16px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#991b1b",
    background: "white",
    border: "1.5px solid #fca5a5",
    borderRadius: 8,
    cursor: "pointer",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    borderRadius: 12,
    border: "2px solid #bbf7d0",
    background: "#f0fdf4",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    background: "#dcfce7",
    borderBottom: "1px solid #bbf7d0",
  },
  headerTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#166534",
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    background: "white",
    border: "1.5px solid #86efac",
    borderRadius: 8,
    cursor: "pointer",
    color: "#16a34a",
    transition: "all 0.15s",
  },
  moveList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  moveCard: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid #dcfce7",
    padding: "0.5rem 0.75rem",
  },
  moveHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  moveButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#166534",
    background: "white",
    border: "1.5px solid #86efac",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  previewIconWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 6,
    cursor: "pointer",
    transition: "background 0.15s",
    background: "#dcfce7",
    flexShrink: 0,
  },
  previewTooltip: {
    position: "absolute",
    right: "100%",
    top: "50%",
    transform: "translateY(-50%)",
    marginRight: 8,
    width: 280,
    padding: "10px 12px",
    background: "white",
    border: "1.5px solid #d1d5db",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 100,
    pointerEvents: "none",
  },
  reasoningToggle: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 0 0 0",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
  },
  reasoningContent: {
    fontSize: "0.78rem",
    color: "#4b5563",
    lineHeight: 1.5,
    padding: "6px 0 2px 18px",
    whiteSpace: "pre-wrap",
  },
  emptyMessage: {
    padding: "1.5rem",
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#6b7280",
  },
}