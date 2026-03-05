import React, { useState, useEffect, useMemo, useRef, JSX } from "react"
import { ProofStateSchema } from "../core/ProofStateZod"
import { ProofDiscoveryState, ProofNode, MoveDescription } from "../core/ProofDiscoveryState"
import { WasmContext, loadWasm } from "./MathExpression"
import Graph from "graphology"

export type ProofStateGeneratorProps = {
  onGenerated: (state: ProofDiscoveryState) => void
}

/** Render a live Typst preview for $...$-delimited math in the input string. */
function TypstPreview({ input }: { input: string }): JSX.Element | null {
  const wasm = React.useContext(WasmContext)
  const compiler = wasm?.current

  const rendered = useMemo(() => {
    if (!compiler || !input.trim()) return null

    // Split on $...$ delimiters
    const parts = input.split(/(\$[^$]+\$)/)
    if (parts.every((p) => !p.startsWith("$"))) return null

    return parts.map((part, i) => {
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const math = part.slice(1, -1)
        try {
          const result = JSON.parse(compiler.compile(math)) as
            | { svg: string }
            | { error: string }
          if ("error" in result) {
            return (
              <span key={i} style={{ color: "#e53e3e", fontStyle: "italic" }}>
                {part}
              </span>
            )
          }
          const fixedSvg = result.svg
            .replace(/fill="#ffffff"/g, 'fill="#000000"')
            .replace(/<svg/, '<svg style="font-size:10pt"')
          return (
            <span
              key={i}
              style={{ display: "inline-block", verticalAlign: "-0.2em", transform: "scale(1.5)", transformOrigin: "left center", margin: "0 0.3em" }}
              dangerouslySetInnerHTML={{ __html: fixedSvg }}
            />
          )
        } catch {
          return (
            <span key={i} style={{ color: "#e53e3e", fontStyle: "italic" }}>
              {part}
            </span>
          )
        }
      }
      return <span key={i}>{part}</span>
    })
  }, [compiler, input])

  if (!rendered) return null

  return (
    <div style={styles.previewBox}>
      <div style={styles.previewLabel}>Preview</div>
      <div style={styles.previewContent}>{rendered}</div>
    </div>
  )
}

export function ProofStateGenerator({ onGenerated }: ProofStateGeneratorProps): JSX.Element {
  const [inputStatement, setInputStatement] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load WASM for the Typst preview
  const wasmRef = useRef<{ compile: (input: string) => string } | null>(null)
  const [wasmReady, setWasmReady] = useState(false)

  useEffect(() => {
    loadWasm(wasmRef).then(() => setWasmReady(true))
  }, [])

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

  const hasMath = /\$[^$]+\$/.test(inputStatement)

  return (
    <WasmContext.Provider value={wasmRef}>
      <div style={styles.container}>
        <div style={styles.inputCard}>
          <div style={styles.header}>
            <h1 style={styles.title}>Motivated Proof Facilitator</h1>
            <p style={styles.subtitle}>
              A graphical user interface for constructing motivated proofs.
            </p>
          </div>

          <div style={styles.inputSection}>
            <label htmlFor="statement-input" style={styles.label}>
              Statement
            </label>
            <textarea
              id="statement-input"
              value={inputStatement}
              onChange={(e) => setInputStatement(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter a mathematical statement..."
              style={styles.textarea}
              rows={3}
              disabled={isLoading}
            />
            <div style={styles.hint}>
              Press <kbd style={styles.kbd}>Ctrl</kbd>+<kbd style={styles.kbd}>Enter</kbd> to submit
            </div>
          </div>

          {wasmReady && hasMath && <TypstPreview input={inputStatement} />}

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
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Generate Proof State
              </>
            )}
          </button>
        </div>
      </div>
    </WasmContext.Provider>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #eaf3fc 0%, #f4f8fd 50%, #e8f0fb 100%)",
    padding: "4rem 3rem",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  inputCard: {
    width: "100%",
    maxWidth: "960px",
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(30, 144, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)",
    padding: "3.5rem 4rem",
    border: "1px solid #d6e6f7",
  },
  header: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  logoIcon: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "3.25rem",
    fontWeight: "700",
    color: "#1a74d2",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#5a7a9a",
    margin: 0,
    lineHeight: "1.6",
  },
  code: {
    background: "#eef5ff",
    color: "#1e6fc2",
    padding: "0.15em 0.45em",
    borderRadius: "4px",
    fontSize: "0.9em",
    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace",
  },
  inputSection: {
    marginBottom: "2rem",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#3a6a9a",
    marginBottom: "0.5rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  textarea: {
    width: "100%",
    padding: "1rem 1.25rem",
    fontSize: "1.05rem",
    lineHeight: "1.6",
    border: "2px solid #cddff0",
    borderRadius: "10px",
    fontFamily:
      "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    resize: "vertical",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box",
    background: "#fafcff",
  },
  hint: {
    marginTop: "0.5rem",
    fontSize: "0.8rem",
    color: "#8aa4bd",
    textAlign: "right" as const,
  },
  kbd: {
    display: "inline-block",
    padding: "0.1em 0.4em",
    fontSize: "0.8em",
    fontFamily: "'SF Mono', Monaco, Consolas, monospace",
    color: "#4a7aaa",
    background: "#eef4fa",
    border: "1px solid #cddff0",
    borderRadius: "4px",
    boxShadow: "0 1px 0 #cddff0",
  },
  previewBox: {
    marginBottom: "2rem",
    padding: "1.25rem 1.5rem",
    background: "#f8fbff",
    border: "1px solid #d6e6f7",
    borderRadius: "10px",
  },
  previewLabel: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#6a9ac8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "0.75rem",
  },
  previewContent: {
    fontSize: "1.1rem",
    lineHeight: "2",
    color: "#1a2a3a",
    wordBreak: "break-word" as const,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem 1.25rem",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "10px",
    color: "#991b1b",
    marginBottom: "2rem",
    fontSize: "0.95rem",
  },
  errorIcon: {
    width: "20px",
    height: "20px",
    flexShrink: 0,
    color: "#ef4444",
  },
  button: {
    width: "100%",
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "white",
    background: "linear-gradient(135deg, #1e90ff 0%, #1a74d2 100%)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    boxShadow: "0 2px 8px rgba(30, 144, 255, 0.25)",
    letterSpacing: "0.01em",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
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
