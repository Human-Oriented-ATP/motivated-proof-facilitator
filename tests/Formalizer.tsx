import React, { useState, useReducer, JSX } from "react"
import { ProofState, ProofStateSchema } from "../src/core/ProofStateZod"
import { proofDiscoveryStateReducer, nullProofDiscoveryState, getCurrentProofState } from "../src/core/ProofDiscoveryState"
import { ProofState as ProofStateComponent, ProofStateWithLibraryResult } from "../src/components/ProofState"
import { MathStatement } from "../src/components/MathStatement"
import ProofStateContextProvider from "./ProofStateContext"
import { formalizeStatement } from "../src/fetchers/Formalize"

/**
 * Formalizer component that allows users to input mathematical statements,
 * sends them to an endpoint for formalization, and displays the resulting proof state.
 */
export default function RenderFormalizer(): JSX.Element {
  const [inputStatement, setInputStatement] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proofDiscoveryState, dispatch] = useReducer(
    proofDiscoveryStateReducer,
    nullProofDiscoveryState
  )
  const [hasProofState, setHasProofState] = useState<boolean>(false)
  const [isInformalizePopupOpen, setIsInformalizePopupOpen] = useState(false)
  const [informalizedText, setInformalizedText] = useState("")
  const [isInformalizeLoading, setIsInformalizeLoading] = useState(false)

  const handleFormalize = async (): Promise<void> => {
    if (!inputStatement.trim()) {
      setError("Please enter a mathematical statement")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const proofState = await formalizeStatement({ problem: inputStatement })

      // Initialize the proof discovery state with the received proof state
      dispatch({
        action: "initialize",
        statement: inputStatement,
        proofState: proofState,
      })

      setHasProofState(true)
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to formalize statement: ${err.message}`)
      } else {
        setError("An unknown error occurred")
      }
      setHasProofState(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleFormalize()
    }
  }


  const handleInformalize = async (): Promise<void> => {
    setIsInformalizeLoading(true)

    try {
      const currentProofState = getCurrentProofState(proofDiscoveryState)

      const response = await fetch("https://atp-backend-rygt.onrender.com/informalize", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proofState: currentProofState }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`)
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
      {!hasProofState ? (
        <div style={styles.inputCard}>
          <div style={styles.header}>
            <h1 style={styles.title}>Motivated Proof Facilitator</h1>
          </div>

          <div style={styles.inputSection}>
            <textarea
              id="statement-input"
              value={inputStatement}
              onChange={(e) => setInputStatement(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter a mathematical statement to formalize..."
              style={styles.textarea}
              rows={2}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <svg style={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleFormalize}
            disabled={isLoading || !inputStatement.trim()}
            style={{
              ...styles.button,
              ...(isLoading || !inputStatement.trim() ? styles.buttonDisabled : {}),
            }}
          >
            {isLoading ? (
              <>
                <svg style={styles.spinner} viewBox="0 0 24 24">
                  <circle
                    style={styles.spinnerCircle}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    style={styles.spinnerPath}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Formalizing...
              </>
            ) : (
              "Formalize Statement"
            )}
          </button>

        </div>
      ) : (
        <div style={styles.proofStateContainer}>
          <div style={styles.proofStateHeader}>
            <h2 style={styles.proofStateTitle}>Proof Discovery</h2>
            <div style={styles.headerButtons}>
              <button 
                style={styles.informalizeButton} 
                onClick={handleInformalize}
                disabled={isInformalizeLoading}
              >
                {isInformalizeLoading ? "Loading..." : "🔍 Informalize"}
              </button>
              <button style={styles.backButton} onClick={() => setHasProofState(false)}>
                ← New Statement
              </button>
            </div>
          </div>
          <div style={styles.statementDisplay}>
            <strong>Statement:</strong> {proofDiscoveryState.statement}
          </div>

          {/* Library Browser Panel */}
          {proofDiscoveryState.library.length > 0 && (
            <div style={styles.libraryPanel}>
              <div style={styles.libraryHeader}>
                <h3 style={styles.libraryTitle}>Library</h3>
                {proofDiscoveryState.highlightedLibraryStatement !== undefined && (
                  <button 
                    style={styles.clearButton}
                    onClick={() => dispatch({ action: "clearHighlightedStatement" })}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              <div style={styles.libraryList}>
                {proofDiscoveryState.library.map((lemma, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.libraryItem,
                      ...(proofDiscoveryState.highlightedLibraryStatement === idx ? styles.libraryItemActive : {}),
                    }}
                    onClick={() => dispatch({ action: "setHighlightedStatement", index: idx })}
                  >
                    <div style={styles.libraryItemContent}>
                      <span 
                        style={{ 
                          color: '#a16207', 
                          fontSize: '16px', 
                          fontWeight: 'bold',
                          flexShrink: 0,
                          userSelect: 'none'
                        }}
                      >
                        ★
                      </span>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                        <div style={{ flex: '1' }}>
                          <MathStatement address={[]} statement={lemma.statement} polarity={true} />
                        </div>
                        <span 
                          style={{
                            backgroundColor: '#fefce8',
                            border: '1px solid #eab308',
                            color: '#a16207',
                            fontSize: '12px',
                            fontWeight: '500',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                            userSelect: 'none'
                          }}
                        >
                          {lemma.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ProofStateContextProvider>
            { proofDiscoveryState.highlightedLibraryStatement ? 
              <ProofStateWithLibraryResult 
                proofState={getCurrentProofState(proofDiscoveryState)}
                libraryResult={proofDiscoveryState.library[proofDiscoveryState.highlightedLibraryStatement]}
              /> : 
              <ProofStateComponent 
                proofState={getCurrentProofState(proofDiscoveryState)} 
              /> 
            }
          </ProofStateContextProvider>


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
        </div>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#f0eef6",
    padding: "2rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  inputCard: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    padding: "3rem",
  },
  header: {
    textAlign: "center",
    marginBottom: "2.5rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#6b5b95",
    margin: "0 0 0.5rem 0",
  },
  inputSection: {
    marginBottom: "1.5rem",
  },
  textarea: {
    width: "100%",
    padding: "1rem",
    fontSize: "1rem",
    lineHeight: "1.5",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    resize: "vertical",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem",
    backgroundColor: "#fed7d7",
    border: "1px solid #fc8181",
    borderRadius: "8px",
    color: "#742a2a",
    marginBottom: "1.5rem",
  },
  errorIcon: {
    width: "20px",
    height: "20px",
    flexShrink: 0,
  },
  button: {
    width: "100%",
    padding: "1rem 2rem",
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "white",
    background: "#7c6ba3",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none",
  },
  spinner: {
    width: "20px",
    height: "20px",
    animation: "spin 1s linear infinite",
  },
  spinnerCircle: {
    opacity: 0.25,
  },
  spinnerPath: {
    opacity: 0.75,
  },
  proofStateContainer: {
    maxWidth: "1400px",
    margin: "0 auto",
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    padding: "2rem",
    minHeight: "80vh",
  },
  proofStateHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "2px solid #e2e8f0",
  },
  proofStateTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#1a202c",
    margin: 0,
  },
  headerButtons: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  informalizeButton: {
    padding: "0.5rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    color: "white",
    background: "#7c6ba3",
    border: "2px solid #7c6ba3",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  backButton: {
    padding: "0.5rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    color: "#667eea",
    background: "white",
    border: "2px solid #667eea",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  statementDisplay: {
    padding: "1rem",
    background: "#f7fafc",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    fontSize: "1rem",
    color: "#2d3748",
    borderLeft: "4px solid #667eea",
  },
  moveSection: {
    marginTop: "2rem",
    padding: "1.5rem",
    background: "#f7fafc",
    borderRadius: "8px",
    borderLeft: "4px solid #7c6ba3",
  },
  moveTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1a202c",
    marginTop: 0,
    marginBottom: "1rem",
  },
  moveTextarea: {
    width: "100%",
    padding: "1rem",
    fontSize: "1rem",
    lineHeight: "1.5",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    resize: "vertical",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "1rem",
  },
  moveButton: {
    width: "100%",
    padding: "0.875rem 2rem",
    fontSize: "1rem",
    fontWeight: "600",
    color: "white",
    background: "#7c6ba3",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    borderRadius: "12px",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "2px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1a202c",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    color: "#718096",
    cursor: "pointer",
    padding: "0.25rem",
    lineHeight: 1,
    transition: "color 0.2s",
  },
  modalBody: {
    padding: "1.5rem",
    overflow: "auto",
    fontSize: "1rem",
    lineHeight: "1.6",
    color: "#2d3748",
    whiteSpace: "pre-wrap",
  },
  libraryPanel: {
    marginBottom: "1.5rem",
    background: "#fefce8",
    border: "2px solid #fde047",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  libraryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  libraryTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#a16207",
    margin: 0,
  },
  clearButton: {
    padding: "0.375rem 1rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#a16207",
    background: "white",
    border: "1px solid #eab308",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  libraryList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  libraryItem: {
    padding: "0.875rem",
    background: "white",
    border: "2px solid #fde047",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  libraryItemContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  libraryItemActive: {
    background: "#fef9c3",
    border: "2px solid #eab308",
    boxShadow: "0 2px 8px rgba(234, 179, 8, 0.2)",
  },

}
