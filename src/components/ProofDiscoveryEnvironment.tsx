import React, { JSX, useState, useContext, useReducer, useRef, useEffect, useCallback } from 'react'
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

export type ProofDiscoveryEnvironmentProps = {
  initialProofDiscoveryState: ProofDiscoveryState
}

/**
 * Main environment for proof discovery that displays:
 * - Current proof state prominently
 * - Action buttons panel at the top
 * - Expandable proof discovery graph on the side
 * - Library statements dropdown
 */
export function ProofDiscoveryEnvironment({
  initialProofDiscoveryState
}: ProofDiscoveryEnvironmentProps): JSX.Element {
  const [proofDiscoveryState, dispatchProofDiscoveryAction] = useReducer(
    proofDiscoveryStateReducer,
    initialProofDiscoveryState
  )
  const [isGraphPopped, setIsGraphPopped] = useState(false)
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

  // ── Draggable graph state ───────────────────────────────────────────────
  const [graphPos, setGraphPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 }) // distance from right / bottom
  const isDraggingGraph = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const graphContainerRef = useRef<HTMLDivElement | null>(null)

  const handleGraphDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingGraph.current = true
    const rect = graphContainerRef.current?.getBoundingClientRect()
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingGraph.current || !graphContainerRef.current) return
      const rect = graphContainerRef.current.getBoundingClientRect()
      const newRight = window.innerWidth - e.clientX - (rect.width - dragOffset.current.x)
      const newBottom = window.innerHeight - e.clientY - (rect.height - dragOffset.current.y)
      setGraphPos({
        x: Math.max(0, Math.min(newRight, window.innerWidth - rect.width)),
        y: Math.max(0, Math.min(newBottom, window.innerHeight - rect.height)),
      })
    }
    const onUp = () => { isDraggingGraph.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])

  // Auto-detect proof completion
  useEffect(() => {
    if (!proofDiscoveryState.isSolved && isProofComplete(proofDiscoveryState)) {
      dispatchProofDiscoveryAction({ action: 'finish' })
      setIsFinishScreenOpen(true)
    }
  }, [proofDiscoveryState])

  // Get current proof state from the current node
  const currentProofState = proofDiscoveryState.graph.getNodeAttribute(
    proofDiscoveryState.currentNodeId,
    'proofState'
  )

  // Copy current proof state to clipboard
  const handleCopyProofState = () => {
    const proofStateJson = JSON.stringify(currentProofState, null, 2)
    navigator.clipboard.writeText(proofStateJson)
      .then(() => {
        alert('Proof state copied to clipboard!')
      })
      .catch((err) => {
        console.error('Failed to copy:', err)
        alert('Failed to copy to clipboard')
      })
  }

  // Clear selections in current proof state only
  const handleClearCurrentSelections = () => {
    selectionsDispatch({
      type: 'CLEAR_PROOF_STATE_SELECTIONS',
      proofStateId: {
        proofNodeId: proofDiscoveryState.currentNodeId,
        proofContextId: 0
      }
    })
  }

  // Clear all selections across all proof states
  const handleClearAllSelections = () => {
    selectionsDispatch({ type: 'CLEAR_ALL_SELECTIONS' })
  }

  // Informalize the current proof state
  const handleInformalize = async (): Promise<void> => {
    setIsInformalizeLoading(true)

    try {
      const currentProofState = proofDiscoveryState.graph.getNodeAttribute(
        proofDiscoveryState.currentNodeId,
        'proofState'
      )

      const response = await fetch("https://atp-backend-rygt.onrender.com/informalize", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proofState: currentProofState }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setInformalizedText(data.naturalLanguage || data.text || JSON.stringify(data))
      setIsInformalizePopupOpen(true)
    } catch (err) {
      if (err instanceof Error) {
        setInformalizedText(`Failed to informalize: ${err.message}`)
      } else {
        setInformalizedText("An unknown error occurred")
      }
      setIsInformalizePopupOpen(true)
    } finally {
      setIsInformalizeLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Library Statements at Top */}
      <div style={styles.librarySection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
              style={styles.libraryToggle}
            >
              <svg 
                style={{
                  ...styles.chevron,
                  transform: isLibraryExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                }} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span style={styles.libraryTitle}>
                LIBRARY STATEMENTS ({proofDiscoveryState.library.length})
              </span>
            </button>
            <button
              onClick={() => { setIsAddLibraryOpen(v => !v); setNewLibraryLabel(''); setNewLibraryStatement('') }}
              style={{ ...styles.libraryAddButton, ...(isAddLibraryOpen ? styles.libraryAddButtonActive : {}) }}
              title="Add a statement to the library"
            >
              +
            </button>
          </div>

          {isAddLibraryOpen && (
            <div style={styles.libraryAddForm}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={styles.libraryAddLabel}>Label</label>
                <input
                  type="text"
                  value={newLibraryLabel}
                  onChange={(e) => setNewLibraryLabel(e.target.value)}
                  placeholder="e.g. lemma_1"
                  style={styles.libraryAddInput}
                />
              </div>
              <StatementBuilder value={newLibraryStatement} onChange={setNewLibraryStatement} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    if (!newLibraryLabel.trim()) return
                    dispatchProofDiscoveryAction({ action: 'addToLibrary', statement: { label: newLibraryLabel.trim(), statement: newLibraryStatement } })
                    setIsAddLibraryOpen(false)
                    setNewLibraryLabel('')
                    setNewLibraryStatement('')
                    setIsLibraryExpanded(true)
                  }}
                  disabled={!newLibraryLabel.trim()}
                  style={styles.libraryAddConfirm}
                >
                  Add to Library
                </button>
                <button onClick={() => setIsAddLibraryOpen(false)} style={styles.libraryAddCancel}>Cancel</button>
              </div>
            </div>
          )}

          {isLibraryExpanded && proofDiscoveryState.library.length > 0 && (
            <div style={styles.libraryList}>
              {proofDiscoveryState.library.map((statement, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (proofDiscoveryState.highlightedLibraryStatement === idx) {
                      dispatchProofDiscoveryAction({ action: 'clearHighlightedStatement' })
                    } else {
                      dispatchProofDiscoveryAction({
                        action: 'setHighlightedStatement',
                        index: idx
                      })
                    }
                  }}
                  style={{
                    ...styles.libraryItem,
                    ...(proofDiscoveryState.highlightedLibraryStatement === idx 
                      ? styles.libraryItemActive 
                      : {})
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#a16207', fontSize: '16px', fontWeight: 'bold', flexShrink: 0, userSelect: 'none' }}>★</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                      <div style={{ flex: '1' }}>
                        <ProofStateLocationContext.Provider value={{ kind: 'library_statement', label: statement.label }}>
                          <MathStatement
                            address={[]}
                            statement={statement.statement}
                            polarity={null}
                          />
                        </ProofStateLocationContext.Provider>
                      </div>
                      <span style={{ backgroundColor: '#fefce8', border: '1px solid #eab308', color: '#a16207', fontSize: '12px', fontWeight: '500', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', userSelect: 'none' }}>
                        {statement.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      <div style={styles.mainContent}>
        {/* Main Proof State Display */}
        <div style={styles.proofStateSection}>
          {proofDiscoveryState.isSolved && (
            <div style={styles.proofStateHeader}>
              <div style={styles.solvedBadge}>
                <svg style={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Solved!
              </div>
            </div>
          )}

          <div style={styles.proofStateContent}>
            <ProofStateIdContext.Provider 
              value={{ 
                proofNodeId: proofDiscoveryState.currentNodeId, 
                proofContextId: 0 
              }}
            >
              <ProofStateComponent 
                proofState={currentProofState}
                libraryResult={
                  proofDiscoveryState.highlightedLibraryStatement !== undefined
                    ? proofDiscoveryState.library[proofDiscoveryState.highlightedLibraryStatement]
                    : undefined
                }
              />
            </ProofStateIdContext.Provider>
          </div>
        </div>

        {/* Right Column: Move Panel + Embedded Graph */}
        <div style={styles.rightColumn}>
          <div style={styles.movePanelSide}>
            <ProofDiscoveryStateContext.Provider
              value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}
            >
              <MovePanel />
            </ProofDiscoveryStateContext.Provider>
          </div>

          {/* Embedded Proof Graph (or dock placeholder when popped out) */}
          {!isGraphPopped ? (
            <div style={styles.embeddedGraphPanel}>
              <div style={styles.embeddedGraphHeader}>
                <span style={styles.floatingGraphTitle}>Proof Graph</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => setIsGraphFullscreen(true)}
                    style={styles.floatingGraphButton}
                    title="Fullscreen view"
                  >
                    <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsGraphPopped(true)}
                    style={styles.floatingGraphButton}
                    title="Pop out to floating window"
                  >
                    <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div style={styles.embeddedGraphBody}>
                <ProofDiscoveryStateContext.Provider
                  value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}
                >
                  <ProofDiscoveryStateVisualization
                    proofDiscoveryState={proofDiscoveryState}
                  />
                </ProofDiscoveryStateContext.Provider>
              </div>
            </div>
          ) : (
            <div style={styles.graphDockPlaceholder}>
              <button
                onClick={() => setIsGraphPopped(false)}
                style={styles.dockButton}
                title="Dock graph back to corner"
              >
                <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 11a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 15.586V11z" />
                </svg>
                Dock Graph
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: full-width action panel */}
      <div style={styles.bottomBar}>
        <div style={styles.actionPanel}>
          <div style={styles.actionButtons}>
            <button
              onClick={handleCopyProofState}
              style={styles.actionButton}
              title="Copy current proof state to clipboard"
            >
              <svg style={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy Proof State
            </button>

            <button
              onClick={handleClearCurrentSelections}
              style={styles.actionButton}
              title="Clear selections in current proof state"
              disabled={selections.length === 0}
            >
              <svg style={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Clear Current
            </button>

            <button
              onClick={handleClearAllSelections}
              style={styles.actionButton}
              title="Clear all selections across all proof states"
              disabled={selections.length === 0}
            >
              <svg style={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Clear All
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              style={styles.actionButton}
              title="Edit the current proof state"
            >
              <svg style={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </button>

            <button
              onClick={handleInformalize}
              style={{...styles.actionButton, ...styles.informalizeButton}}
              title="Convert current proof state to natural language"
              disabled={isInformalizeLoading}
            >
              {isInformalizeLoading ? (
                <>
                  <svg style={styles.buttonIcon} viewBox="0 0 24 24">
                    <circle style={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path style={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Informalizing...
                </>
              ) : (
                <>
                  <svg style={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Informalize
                </>
              )}
            </button>
          </div>

          {selections.length > 0 && (
            <div style={styles.selectionCounter}>
              {selections.length} selection{selections.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Floating Proof Graph (when popped out) */}
      {isGraphPopped && (
        <div
          ref={graphContainerRef}
          style={{ ...styles.floatingGraphContainer, right: graphPos.x, bottom: graphPos.y }}
        >
          <div style={styles.floatingGraphHeader} onMouseDown={handleGraphDragStart}>
            <span style={styles.floatingGraphTitle}>Proof Graph</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setIsGraphFullscreen(true)}
                style={styles.floatingGraphButton}
                title="Fullscreen view"
              >
                <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setIsGraphPopped(false)}
                style={styles.floatingGraphButton}
                title="Dock back to corner"
              >
                ✕
              </button>
            </div>
          </div>
          <div style={styles.floatingGraphBody}>
            <ProofDiscoveryStateContext.Provider
              value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}
            >
              <ProofDiscoveryStateVisualization
                proofDiscoveryState={proofDiscoveryState}
              />
            </ProofDiscoveryStateContext.Provider>
          </div>
        </div>
      )}

      {/* Fullscreen Graph Overlay */}
      {isGraphFullscreen && (
        <div style={styles.graphOverlay} onClick={() => setIsGraphFullscreen(false)}>
          <div style={styles.graphOverlayContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.graphOverlayHeader}>
              <h3 style={styles.graphOverlayTitle}>Proof Discovery Graph</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setIsGraphFullscreen(false)}
                title="Close fullscreen view"
              >
                ✕
              </button>
            </div>
            <div style={styles.graphOverlayBody}>
              <ProofDiscoveryStateContext.Provider
                value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}
              >
                <ProofDiscoveryStateVisualization 
                  proofDiscoveryState={proofDiscoveryState} 
                />
              </ProofDiscoveryStateContext.Provider>
            </div>
          </div>
        </div>
      )}

      {/* Edit Proof State Modal */}
      {isEditModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Proof State</h3>
              <button style={styles.closeButton} onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '1rem' }}>
              <ProofStateEditor
                proofState={currentProofState}
                onUpdate={(newState) => {
                  dispatchProofDiscoveryAction({
                    action: 'repair',
                    nodeId: proofDiscoveryState.currentNodeId,
                    newProofState: newState,
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Informalize Modal */}
      {isInformalizePopupOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsInformalizePopupOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Natural Language Translation</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setIsInformalizePopupOpen(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              {informalizedText}
            </div>
          </div>
        </div>
      )}

      {/* Finish Screen Overlay */}
      {isFinishScreenOpen && proofDiscoveryState.isSolved && (
        <div style={styles.finishOverlay} onClick={() => setIsFinishScreenOpen(false)}>
          <div style={styles.finishContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.finishHeader}>
              <div style={styles.finishBadge}>
                <svg style={{ width: 32, height: 32 }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Proof Complete!</h2>
              </div>
              <button style={styles.closeButton} onClick={() => setIsFinishScreenOpen(false)}>✕</button>
            </div>
            <div style={styles.finishStatement}>
              {proofDiscoveryState.statement}
            </div>
            <div style={styles.finishGraphContainer}>
              <ProofDiscoveryStateContext.Provider
                value={{ proofDiscoveryState, dispatchProofDiscoveryAction }}
              >
                <ProofDiscoveryStateVisualization
                  proofDiscoveryState={proofDiscoveryState}
                />
              </ProofDiscoveryStateContext.Provider>
            </div>
            <div style={styles.finishActions}>
              <button
                onClick={() => {
                  const json = JSON.stringify(serializeProofDiscoveryState(proofDiscoveryState), null, 2)
                  navigator.clipboard.writeText(json).then(() => {
                    setJsonCopied(true)
                    setTimeout(() => setJsonCopied(false), 2000)
                  })
                }}
                style={styles.finishCopyButton}
              >
                <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                {jsonCopied ? 'Copied!' : 'Copy Proof JSON'}
              </button>
              <button
                onClick={() => setIsFinishScreenOpen(false)}
                style={styles.finishContinueButton}
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#f7fafc',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  // Library – amber/yellow theme
  librarySection: {
    background: '#fffbeb',
    borderBottom: '2px solid #fbbf24',
    padding: '0.625rem 1.5rem',
  },
  libraryToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.375rem 0.5rem',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#92400e',
    transition: 'all 0.2s',
    marginBottom: '0.5rem',
  },
  chevron: {
    width: '16px',
    height: '16px',
    transition: 'transform 0.2s',
    color: '#d97706',
  },
  libraryTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#a16207',
    letterSpacing: '0.1em',
  },
  libraryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  libraryItem: {
    padding: '12px 16px',
    background: '#fefce8',
    border: '2px solid #fde047',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  libraryAddButton: {
    padding: '2px 10px',
    background: 'transparent',
    border: '1.5px solid #d97706',
    borderRadius: '6px',
    color: '#92400e',
    fontSize: '18px',
    lineHeight: '1.2',
    cursor: 'pointer',
    fontWeight: 600,
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  libraryAddButtonActive: {
    background: '#fef9c3',
    border: '1.5px solid #eab308',
  },
  libraryAddForm: {
    background: 'white',
    border: '1.5px solid #fde68a',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '0.5rem',
    marginTop: '0.25rem',
  },
  libraryAddLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#92400e',
    flexShrink: 0,
    letterSpacing: '0.05em',
  },
  libraryAddInput: {
    flex: 1,
    padding: '5px 10px',
    border: '1px solid #fde68a',
    borderRadius: '5px',
    fontSize: '13px',
    outline: 'none',
  },
  libraryAddConfirm: {
    padding: '5px 14px',
    background: '#a16207',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  libraryAddCancel: {
    padding: '5px 14px',
    background: 'transparent',
    color: '#92400e',
    border: '1px solid #fde68a',
    borderRadius: '5px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  libraryItemActive: {
    background: '#ecfccb',
    border: '2px solid #84cc16',
    boxShadow: '0 4px 12px rgba(132, 204, 22, 0.3)',
  },
  // Bottom bar – spans only the proof-state column
  bottomBar: {
    display: 'flex',
    flexShrink: 0,
    borderTop: '2px solid #e2e8f0',
    background: 'white',
    marginRight: '340px',
  },
  actionPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.625rem 1.5rem',
    gap: '0.75rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#4a5568',
    background: 'white',
    border: '1.5px solid #cbd5e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  informalizeButton: {
    color: '#7c6ba3',
    borderColor: '#7c6ba3',
  },
  buttonIcon: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  selectionCounter: {
    padding: '0.375rem 0.875rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#5a67d8',
    background: '#ebf4ff',
    border: '1px solid #5a67d8',
    borderRadius: '20px',
  },
  // Embedded graph panel – lives at the bottom of the right column
  embeddedGraphPanel: {
    height: '220px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderTop: '2px solid #e2e8f0',
    overflow: 'hidden',
  },
  embeddedGraphHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.4rem 0.75rem',
    background: '#f8fafc',
    borderBottom: '1.5px solid #e2e8f0',
    flexShrink: 0,
  },
  embeddedGraphBody: {
    flex: 1,
    overflow: 'hidden',
    background: '#f7fafc',
  },
  graphDockPlaceholder: {
    height: '220px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: '2px solid #e2e8f0',
    background: '#f7fafc',
  },
  dockButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    background: 'white',
    border: '1.5px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#667eea',
  },
  proofStateSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    padding: '1.5rem',
  },
  proofStateHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  solvedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: '#d1fae5',
    border: '2px solid #10b981',
    borderRadius: '20px',
    color: '#065f46',
    fontSize: '1rem',
    fontWeight: '600',
  },
  checkIcon: {
    width: '20px',
    height: '20px',
  },
  proofStateContent: {
    flex: 1,
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'auto',
  },
  rightColumn: {
    width: '340px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '2px solid #e2e8f0',
    overflow: 'hidden',
  },
  movePanelSide: {
    flex: 1,
    overflow: 'auto',
    padding: '1.25rem 1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  floatingGraphContainer: {
    position: 'fixed',
    width: '380px',
    height: '300px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
    border: '2px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 500,
    resize: 'both',
  },
  floatingGraphHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    background: '#f8fafc',
    borderBottom: '1.5px solid #e2e8f0',
    cursor: 'grab',
    flexShrink: 0,
  },
  floatingGraphTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    letterSpacing: '0.02em',
  },
  floatingGraphButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#4a5568',
    fontSize: '0.85rem',
    lineHeight: 1,
  },
  floatingGraphBody: {
    flex: 1,
    overflow: 'auto',
    background: '#f7fafc',
  },
  spinnerCircle: {
    opacity: 0.25,
  },
  spinnerPath: {
    opacity: 0.75,
  },
  graphOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem',
  },
  graphOverlayContent: {
    background: 'white',
    borderRadius: '12px',
    width: '95%',
    height: '95%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  graphOverlayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '2px solid #e2e8f0',
    flexShrink: 0,
  },
  graphOverlayTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0,
  },
  graphOverlayBody: {
    flex: 1,
    padding: '1.5rem',
    overflow: 'auto',
    background: '#f7fafc',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '2px solid #e2e8f0',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#718096',
    cursor: 'pointer',
    padding: '0.25rem',
    lineHeight: 1,
    transition: 'color 0.2s',
  },
  modalBody: {
    padding: '1.5rem',
    overflow: 'auto',
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#2d3748',
    whiteSpace: 'pre-wrap',
  },
  // Finish screen styles
  finishOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1002,
    padding: '2rem',
  },
  finishContent: {
    background: 'white',
    borderRadius: '16px',
    width: '95%',
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  finishHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    background: 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
    borderBottom: '2px solid #10b981',
    flexShrink: 0,
  },
  finishBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#065f46',
  },
  finishStatement: {
    padding: '1rem 2rem',
    background: '#f0fdf4',
    borderBottom: '1px solid #bbf7d0',
    fontSize: '1rem',
    color: '#166534',
    fontStyle: 'italic',
    flexShrink: 0,
  },
  finishGraphContainer: {
    flex: 1,
    overflow: 'hidden',
    padding: '1rem',
    background: '#f7fafc',
  },
  finishActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1rem 2rem',
    borderTop: '2px solid #e2e8f0',
    background: 'white',
    flexShrink: 0,
  },
  finishCopyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1e40af',
    background: '#dbeafe',
    border: '2px solid #3b82f6',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  finishContinueButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#065f46',
    background: '#d1fae5',
    border: '2px solid #10b981',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
}
