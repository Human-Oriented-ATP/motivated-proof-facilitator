import React, { useState, useEffect, useMemo, useRef, JSX } from "react"
import { ProofState, ProofStateSchema } from "../core/ProofStateZod"
import { ProofDiscoveryState, ProofNode, MoveDescription } from "../core/ProofDiscoveryState"
import { WasmContext, loadWasm } from "./MathExpression"
import { ProofStateEditor } from "./ProofStateEditor"
import Graph from "graphology"
import { formalizeStatement } from "../fetchers/Formalize"

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
              <span key={i} style={{ color: "#e53e3e", fontStyle: "italic", margin: "0 0.4em" }}>
                {part}
              </span>
            )
          }
          const SCALING = 1.5
          const rawSvg = result.svg.replace(/fill="#ffffff"/g, 'fill="#000000"')
          const wMatch = rawSvg.match(/\bwidth="([\d.]+)(pt|px)?"/)
          const hMatch = rawSvg.match(/\bheight="([\d.]+)(pt|px)?"/)
          const w = wMatch?.[1] != null ? parseFloat(wMatch[1]!) : null
          const h = hMatch?.[1] != null ? parseFloat(hMatch[1]!) : null
          const unit = wMatch?.[2] ?? "pt"
          const svgStyle = "width:100%; height:100%; font-size:10pt; vertical-align:-0.2em"
          const fixedSvg = rawSvg.includes(" style=")
            ? rawSvg.replace(/(<svg[^>]*) style="([^"]*)"/, `$1 style="${svgStyle}; $2"`)
            : rawSvg.replace("<svg", `<svg style="${svgStyle}"`)
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                ...(w != null ? { width: `${w * SCALING}${unit}` } : {}),
                ...(h != null ? { height: `${h * SCALING}${unit}` } : {}),
                margin: "0 0.4em",
              }}
              dangerouslySetInnerHTML={{ __html: fixedSvg }}
            />
          )
        } catch {
          return (
            <span key={i} style={{ color: "#e53e3e", fontStyle: "italic", margin: "0 0.4em" }}>
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
  
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualProofState, setManualProofState] = useState<ProofState>([{
    variables: [],
    hypotheses: [],
    goals: []
  }])

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
      const proofState = await formalizeStatement({ problem: inputStatement })

      const graph = new Graph<ProofNode, MoveDescription>()
      graph.addNode(0, { proofState })

      onGenerated({
        statement: inputStatement,
        graph,
        currentNodeId: 0,
        library: [],
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

  const handleManualGenerate = (): void => {
    const graph = new Graph<ProofNode, MoveDescription>()
    graph.addNode(0, { proofState: manualProofState })

    onGenerated({
      statement: "Manual Proof State",
      graph,
      currentNodeId: 0,
      library: [],
      isSolved: false,
    })
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
              A graphical user interface for constructing motivated proofs in natural language with AI assistance
            </p>
          </div>

          {isManualMode ? (
            <div style={{ marginBottom: "2rem" }}>
              <div style={{...styles.statementBox, padding: "10px", minHeight: "300px"}}>
                <div style={styles.statementLabel}>MANUAL PROOF STATE</div>
                <ProofStateEditor proofState={manualProofState} onUpdate={setManualProofState} />
              </div>

              <div style={{ ...styles.buttonRow, marginTop: "2rem", display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setIsManualMode(false)}
                  style={styles.secondaryButton}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back to Natural Language
                </button>

                <button
                  onClick={handleManualGenerate}
                  style={styles.button}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Start Proof
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.inputSection}>
                <div style={styles.statementBox}>
                  <div style={styles.statementLabel}>STATEMENT</div>
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
                </div>
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

              <div style={styles.buttonRow}>
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
                      Generating proof state...
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

              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <button
                  onClick={() => setIsManualMode(true)}
                  style={styles.textButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Or manually build a proof state
                </button>
              </div>
            </>
          )}
        </div>
        <div style={styles.links}>
          <a
            href="https://github.com/Human-Oriented-ATP/motivated-proof-facilitator"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Source Code
          </a>
          <span style={styles.linkDivider}>·</span>
          <a
            href="https://gowers.wordpress.com/2025/09/22/creating-a-database-of-motivated-proofs/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            About This Project
          </a>
        </div>
      </div>
    </WasmContext.Provider>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "white",
    padding: "0 1.5rem",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputCard: {
    width: "100%",
    maxWidth: "780px",
    paddingBottom: "8rem",
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
    color: "#1d4ed8",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#5a7a9a",
    margin: 0,
    lineHeight: "1.6",
    whiteSpace: "nowrap" as const,
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
  statementBox: {
    backgroundColor: "#eff6ff",
    border: "2px solid #bfdbfe",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    position: "relative" as const,
  },
  statementLabel: {
    position: "absolute" as const,
    top: "-12px",
    left: "20px",
    backgroundColor: "white",
    padding: "0 8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1d4ed8",
    letterSpacing: "0.1em",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1.05rem",
    lineHeight: "1.6",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    fontFamily:
      "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    resize: "vertical",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box" as const,
    background: "white",
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
    lineHeight: "2.4",
    color: "#1a2a3a",
    wordBreak: "break-word" as const,
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "baseline",
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
  buttonRow: {
    display: "flex",
    justifyContent: "center",
  },
  button: {
    width: "auto",
    padding: "0.85rem 2.5rem",
    fontSize: "1.05rem",
    fontWeight: "600",
    color: "white",
    background: "linear-gradient(135deg, #1d4fd8a1 0%, #4664b4 100%)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    boxShadow: "0 2px 8px rgba(29, 78, 216, 0.3)",
    letterSpacing: "0.01em",
  },
  secondaryButton: {
    width: "auto",
    padding: "0.85rem 2.5rem",
    fontSize: "1.05rem",
    fontWeight: "600",
    color: "#4664b4",
    background: "white",
    border: "2px solid #bfdbfe",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s, background 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    letterSpacing: "0.01em",
  },
  textButton: {
    background: "transparent",
    border: "none",
    color: "#5a8abb",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    textDecoration: "underline",
    padding: "0.5rem 1rem",
    transition: "color 0.15s",
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
  links: {
    position: "fixed",
    bottom: "1.25rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.875rem",
    color: "#5a8abb",
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.15s",
  },
  linkDivider: {
    color: "#c0d4e8",
    fontSize: "0.875rem",
    userSelect: "none" as const,
  },
}
