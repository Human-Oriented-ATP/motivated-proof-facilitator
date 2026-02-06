import React, { JSX, useState, useContext, useReducer } from 'react'
import { ProofDiscoveryState, proofDiscoveryStateReducer } from '../core/ProofDiscoveryState'
import { ProofStateWithLibraryResult as ProofStateComponent } from './ProofState'
import { ProofDiscoveryState as ProofDiscoveryStateVisualization } from './ProofDiscoveryState'
import { MathStatement } from './MathStatement'
import { ProofStateSelectionContext, ProofStateLocationContext } from '../core/ProofStateSelectionContext'
import { ProofStateIdContext, ProofDiscoveryStateContext } from '../core/ProofDiscoveryStateContext'

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
  const [isGraphExpanded, setIsGraphExpanded] = useState(true)
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true)
  const [isInformalizePopupOpen, setIsInformalizePopupOpen] = useState(false)
  const [informalizedText, setInformalizedText] = useState("")
  const [isInformalizeLoading, setIsInformalizeLoading] = useState(false)
  const { selections, dispatch: selectionsDispatch } = useContext(ProofStateSelectionContext)

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
      {proofDiscoveryState.library.length > 0 && (
        <div style={styles.librarySection}>
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
              Library Statements ({proofDiscoveryState.library.length})
            </span>
          </button>

          {isLibraryExpanded && (
            <div style={styles.libraryList}>
              {proofDiscoveryState.library.map((statement, idx) => (
                <div
                  key={idx}
                  onClick={() => dispatchProofDiscoveryAction({
                    action: 'setHighlightedStatement',
                    index: idx
                  })}
                  style={{
                    ...styles.libraryItem,
                    ...(proofDiscoveryState.highlightedLibraryStatement === idx 
                      ? styles.libraryItemActive 
                      : {})
                  }}
                >
                  <div style={styles.libraryItemLabel}>
                    {statement.label}
                  </div>
                  <div style={styles.libraryItemStatement}>
                    <ProofStateLocationContext.Provider value={{ kind: 'library_statement', label: statement.label }}>
                      <MathStatement
                        address={[]}
                        statement={statement.statement}
                        polarity={null}
                      />
                    </ProofStateLocationContext.Provider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Action Panel */}
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

        {/* Side Panel for Proof Discovery Graph */}
        <div style={{
          ...styles.graphPanel,
          width: isGraphExpanded ? '500px' : '50px'
        }}>
          <button
            onClick={() => setIsGraphExpanded(!isGraphExpanded)}
            style={styles.graphToggle}
            title={isGraphExpanded ? 'Collapse graph' : 'Expand graph'}
          >
            <svg 
              style={{
                ...styles.graphToggleIcon,
                transform: isGraphExpanded ? 'rotate(0deg)' : 'rotate(180deg)'
              }} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {isGraphExpanded && (
            <div style={styles.graphContent}>
              <div style={styles.graphHeader}>
                <h3 style={styles.graphTitle}>Proof Discovery Graph</h3>
                <button
                  onClick={() => setIsGraphFullscreen(!isGraphFullscreen)}
                  style={styles.fullscreenButton}
                  title={isGraphFullscreen ? 'Exit fullscreen' : 'Fullscreen view'}
                >
                  <svg style={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                    {isGraphFullscreen ? (
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM5 5a1 1 0 011-1h3a1 1 0 110 2H6v3a1 1 0 01-2 0V5zm10 10a1 1 0 01-1 1h-3a1 1 0 110-2h3v-3a1 1 0 112 0v4z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>
              </div>
              <div style={styles.graphVisualization}>
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
        </div>
      </div>

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
    </div>
  )

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
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#f7fafc',
  },
  actionPanel: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    background: 'white',
    borderBottom: '2px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    gap: '1.5rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
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
    width: '18px',
    height: '18px',
  },
  selectionCounter: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#5a67d8',
    background: '#ebf4ff',
    border: '1px solid #5a67d8',
    borderRadius: '20px',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  librarySection: {
    background: '#fffbeb',
    borderBottom: '2px solid #fbbf24',
    padding: '1rem 1.5rem',
  },
  libraryToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.75rem',
    background: 'white',
    border: '2px solid #fbbf24',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#92400e',
    transition: 'all 0.2s',
    marginBottom: '1rem',
  },
  chevron: {
    width: '20px',
    height: '20px',
    transition: 'transform 0.2s',
  },
  libraryTitle: {
    flex: 1,
    textAlign: 'left',
  },
  libraryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  libraryItem: {
    padding: '0.875rem',
    background: 'white',
    border: '2px solid #fde047',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  libraryItemActive: {
    background: '#fef9c3',
    border: '2px solid #eab308',
    boxShadow: '0 2px 8px rgba(234, 179, 8, 0.2)',
  },
  libraryItemLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '0.25rem',
  },
  libraryItemStatement: {
    fontSize: '0.875rem',
    color: '#78350f',
    marginTop: '0.5rem',
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
  graphPanel: {
    position: 'relative',
    background: 'white',
    borderLeft: '2px solid #e2e8f0',
    transition: 'width 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  graphToggle: {
    position: 'absolute',
    top: '1rem',
    left: '0',
    width: '50px',
    height: '50px',
    background: '#667eea',
    border: 'none',
    borderRadius: '0 8px 8px 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    zIndex: 10,
    boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  graphToggleIcon: {
    width: '24px',
    height: '24px',
    color: 'white',
    transition: 'transform 0.3s',
  },
  graphContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '1rem',
    paddingTop: '4rem',
  },
  graphHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  graphTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },
  fullscreenButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: '#667eea',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.2s',
  },
  graphVisualization: {
    flex: 1,
    background: '#f7fafc',
    borderRadius: '8px',
    overflow: 'hidden',
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
}
