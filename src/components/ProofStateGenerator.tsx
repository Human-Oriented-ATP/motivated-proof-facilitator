import React, { useState, JSX } from "react"
import { ProofStateSchema } from "../core/ProofStateZod"
import { ProofDiscoveryState, ProofNode, MoveDescription } from "../core/ProofDiscoveryState"
import Graph from "graphology"

export type ProofStateGeneratorProps = {
  onGenerated: (state: ProofDiscoveryState) => void
}

export function ProofStateGenerator({ onGenerated }: ProofStateGeneratorProps): JSX.Element {
  const [inputStatement, setInputStatement] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormalize = async (): Promise<void> => {
    if (!inputStatement.trim()) {
      setError("Please enter a mathematical statement")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("https://atp-backend-rygt.onrender.com/formalize", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problem: inputStatement }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: unknown = await response.json()
      const proofState = ProofStateSchema.parse([data])

      const graph = new Graph<ProofNode, MoveDescription>()
      graph.addNode(0, { proofState })

      onGenerated({
        statement: inputStatement,
        graph,
        currentNodeId: 0,
        library: [],
        highlightedLibraryStatement: undefined,
        isSolved: false,
      })
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to formalize statement: ${err.message}`)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleFormalize()
    }
  }

  return (
    <div style={styles.container}>
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
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#f0eef6",
    padding: "2rem",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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
    fontFamily:
      "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
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
}
