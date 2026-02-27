import React, { useState, useReducer, JSX } from "react"
import { ProofState, ProofStateSchema, ProofStateWithLibraryResult as ProofStateWithLibraryResultType, LabelledStatementSchema, StatementSchema } from "../src/core/ProofStateZod"
import { ProofDiscoveryMove, MoveKind, ProofDiscoveryMoveExample } from "../src/core/ProofDiscoveryMove"

type UIExample = ProofDiscoveryMoveExample & { id: string }
import { proofDiscoveryStateReducer, nullProofDiscoveryState } from "../src/core/ProofDiscoveryState"
import { ProofStateWithLibraryResult as ProofStateWithLibraryResultComponent } from "../src/components/ProofState"
import ProofStateContextProvider from "./ProofStateContext"
import { ProofStateSelection, ProofStateSelectionContext, proofStateSelectionReducer } from "../src/core/ProofStateSelectionContext"
import TypstContextProvider from "../src/components/TypstContext"
import { ProofStateEditor } from "./ProofStateEditor"

type WorkflowState = "idle" | "formalizing" | "formalized" | "applying" | "applied"

/**
 * Move Generator UI - Allows users to interactively create ProofDiscoveryMove definitions
 */
export default function MoveGenerator(): JSX.Element {
  // Basic move information
  const [moveName, setMoveName] = useState("")
  const [moveKind, setMoveKind] = useState<MoveKind>("strengthening")
  const [trigger, setTrigger] = useState("")
  const [action, setAction] = useState("")

  // Examples collection
  const [examples, setExamples] = useState<UIExample[]>([])

  // Current example being constructed
  const [workflowState, setWorkflowState] = useState<WorkflowState>("idle")
  const [problemDescription, setProblemDescription] = useState("")
  const [libraryStatement, setLibraryStatement] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentInputState, setCurrentInputState] = useState<ProofStateWithLibraryResultType | null>(null)
  const [currentOutputState, setCurrentOutputState] = useState<ProofStateWithLibraryResultType | null>(null)
  const [exampleComment, setExampleComment] = useState("")

  // Proof discovery state for interactive selection
  const [proofDiscoveryState, dispatch] = useReducer(
    proofDiscoveryStateReducer,
    nullProofDiscoveryState
  )

  // Selection state - will be managed by ProofStateSelectionContext
  const [selections, selectionsDispatch] = React.useReducer(proofStateSelectionReducer, [])

  // Copy state
  const [copySuccess, setCopySuccess] = useState(false)

  // Load move state
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleLoadMove = (jsonString: string): void => {
    try {
      setLoadError(null)
      const parsed = JSON.parse(jsonString) as ProofDiscoveryMove
      
      // Validate the structure
      if (!parsed.name || !parsed.kind || !parsed.trigger || !parsed.action) {
        throw new Error("Invalid move structure: missing required fields")
      }

      // Load the move data
      setMoveName(parsed.name)
      setMoveKind(parsed.kind)
      setTrigger(parsed.trigger)
      setAction(parsed.action)
      
      // Load examples if they exist
      if (Array.isArray(parsed.examples)) {
        const loadedExamples: UIExample[] = parsed.examples.map((ex, idx) => ({
          id: `loaded-${Date.now()}-${idx}`,
          description: ex.description,
          inputState: ex.inputState,
          selections: ex.selections ?? [],
          outputState: ex.outputState,
          comment: ex.comment,
          kind: ex.kind,
        }))
        setExamples(loadedExamples)
      }
      
      // Reset workflow state
      handleReset()
    } catch (err) {
      if (err instanceof Error) {
        setLoadError(`Failed to load move: ${err.message}`)
      } else {
        setLoadError("Invalid JSON format")
      }
    }
  }

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      handleLoadMove(content)
    }
    reader.onerror = () => {
      setLoadError("Failed to read file")
    }
    reader.readAsText(file)
    
    // Reset the input so the same file can be loaded again
    event.target.value = ""
  }

  const handleFormalize = async (): Promise<void> => {
    if (!problemDescription.trim()) {
      setError("Please enter a problem description")
      return
    }

    setIsLoading(true)
    setError(null)
    setWorkflowState("formalizing")

    try {
      // Always call the formalize endpoint for the problem
      const response = await fetch("https://atp-backend-rygt.onrender.com/formalize", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problem: problemDescription }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: unknown = await response.json()
      console.log("Formalization response:", data)
      const proofState = ProofStateSchema.parse([data])

      let proofStateWithLibrary: ProofStateWithLibraryResultType = { proofState }

      // If library statement is provided, also call formalize-statement
      if (libraryStatement.trim()) {
        const libraryResponse = await fetch("https://atp-backend-rygt.onrender.com/formalize-statement", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ statement: libraryStatement }),
        })

        if (!libraryResponse.ok) {
          throw new Error(`HTTP error from formalize-statement! status: ${libraryResponse.status}`)
        }

        const libraryData: unknown = await libraryResponse.json()
        console.log("Formalized library statement:", libraryData)
        const libraryResult = StatementSchema.parse(libraryData)
        proofStateWithLibrary.libraryResult = { label: "", statement: libraryResult }
      }

      dispatch({
        action: "initialize",
        statement: problemDescription,
        proofState: proofStateWithLibrary.proofState,
      })

      setCurrentInputState(proofStateWithLibrary)
      setWorkflowState("formalized")
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to formalize: ${err.message}`)
      } else {
        setError("An unknown error occurred")
      }
      setWorkflowState("idle")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyMove = async (skipWarning: boolean = false): Promise<void> => {
    if (!currentInputState) {
      setError("No proof state to apply move to")
      return
    }

    if (!action.trim()) {
      setError("Please enter an action description first")
      return
    }

    // Warn if no selections made
    if (!skipWarning && selections.length === 0) {
      const proceed = window.confirm(
        "No selections have been made in the proof state. Would you still like to proceed?"
      )
      if (!proceed) return
    }

    setIsLoading(true)
    setError(null)
    setWorkflowState("applying")

    try {
      const response = await fetch("https://atp-backend-rygt.onrender.com/move", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofState: currentInputState.proofState,
          move: action,
          selections: selections,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: unknown = await response.json()
      const newProofState = ProofStateSchema.parse([data])

      // Keep the library result from the input state in the output state
      setCurrentOutputState({
        proofState: newProofState,
        libraryResult: currentInputState.libraryResult
      })
      setWorkflowState("applied")
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to apply move: ${err.message}`)
      } else {
        setError("An unknown error occurred")
      }
      setWorkflowState("formalized")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveExample = (kind: "example" | "non-example"): void => {
    if (!currentInputState) return

    const newExample: UIExample = {
      id: Date.now().toString(),
      description: problemDescription,
      inputState: currentInputState,
      selections: selections,
      outputState: currentOutputState,
      comment: exampleComment || undefined,
      kind: kind,
    }

    setExamples([...examples, newExample])
    handleReset()
  }

  const handleReset = (): void => {
    setProblemDescription("")
    setLibraryStatement("")
    setCurrentInputState(null)
    setCurrentOutputState(null)
    setExampleComment("")
    setWorkflowState("idle")
    setError(null)
    
    selectionsDispatch({ type: 'CLEAR_ALL_SELECTIONS' })
    
    dispatch({ action: "initialize", statement: "", proofState: [] })
  }

  const handleCreateManually = (): void => {
    const emptyState: ProofStateWithLibraryResultType = {
      proofState: [{ variables: [], hypotheses: [], goals: [] }]
    }
    setCurrentInputState(emptyState)
    dispatch({ action: "initialize", statement: "Manual proof state", proofState: emptyState.proofState })
    setWorkflowState("formalized")
  }

  const handleUpdateInputProofState = (newProofState: ProofState): void => {
    if (!currentInputState) return
    const updated = { ...currentInputState, proofState: newProofState }
    setCurrentInputState(updated)
    dispatch({ action: "initialize", statement: problemDescription || "Manual proof state", proofState: newProofState })
  }

  const handleUpdateOutputProofState = (newProofState: ProofState): void => {
    if (!currentOutputState) return
    setCurrentOutputState({ ...currentOutputState, proofState: newProofState })
  }

  const handleDeleteExample = (id: string): void => {
    setExamples(examples.filter((e) => e.id !== id))
  }

  const generateMoveJSON = (): string => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const strippedExamples: ProofDiscoveryMoveExample[] = examples.map(({ id: _id, ...rest }) => rest)
    const move: ProofDiscoveryMove = {
      name: moveName,
      kind: moveKind,
      trigger: trigger,
      action: action,
      examples: strippedExamples,
    }

    return JSON.stringify(move, null, 2)
  }

  const handleExport = (): void => {
    const json = generateMoveJSON()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${moveName || "move"}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyJSON = async (): Promise<void> => {
    const json = generateMoveJSON()
    try {
      await navigator.clipboard.writeText(json)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const currentSelectionsCount = selections.length

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Move Generator</h1>
        <p style={styles.subtitle}>An interface for conveniently generating prompts for motivated proof moves</p>
      </div>

      {/* Move Configuration */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Move Configuration</h2>
        
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Move Name</label>
            <input
              type="text"
              value={moveName}
              onChange={(e) => setMoveName(e.target.value)}
              style={styles.input}
              placeholder="Enter a descriptive name for the move..."
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Kind</label>
            <select
              value={moveKind}
              onChange={(e) => setMoveKind(e.target.value as MoveKind)}
              style={styles.select}
            >
              <option value="strengthening">Strengthening</option>
              <option value="weakening">Weakening</option>
              <option value="equivalence">Equivalence</option>
            </select>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Trigger</label>
          <textarea
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            style={styles.textarea}
            rows={2}
            placeholder="Describe when this move should be available in the list of move suggestions..."
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Action</label>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            style={styles.textarea}
            rows={2}
            placeholder="Describe how the move transforms the proof state..."
          />
        </div>
      </div>

      {/* Examples List */}
      {examples.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Examples ({examples.length})</h2>
          
          {examples.map((ex) => (
            <div key={ex.id} style={styles.exampleCard}>
              <div style={styles.exampleHeader}>
                <div>
                  <span style={ex.kind === "example" ? styles.exampleBadge : styles.nonexampleBadge}>
                    {ex.kind === "example" ? "Example" : "Non-example"}
                  </span>
                  <span style={styles.exampleDescription}>{ex.description}</span>
                </div>
                <button
                  onClick={() => handleDeleteExample(ex.id)}
                  style={styles.deleteButton}
                >
                  ✕
                </button>
              </div>
              {ex.selections.length === 0 && (
                <div style={styles.noSelectionsWarning}>⚠ No selections recorded for this example</div>
              )}
              {ex.comment && (
                <div style={styles.commentText}>{ex.comment}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Workflow Section */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Add Example</h2>

        {workflowState === "idle" && (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Example Description</label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                style={styles.textarea}
                rows={2}
                placeholder="Describe the proof state you want to use as an example..."
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Library Statement (optional)</label>
              <textarea
                value={libraryStatement}
                onChange={(e) => setLibraryStatement(e.target.value)}
                style={styles.textarea}
                rows={2}
                placeholder="Enter a library statement to include in the proof state..."
              />
            </div>
            <div style={styles.actionButtons}>
              <button
                onClick={handleFormalize}
                disabled={isLoading || !problemDescription.trim()}
                style={styles.primaryButton}
              >
                {isLoading ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={handleCreateManually}
                style={styles.secondaryButton}
              >
                Create Manually
              </button>
            </div>
          </div>
        )}

        {workflowState === "formalizing" && (
          <div style={styles.loadingSection}>
            <div style={styles.inlineSpinner}></div>
            <p style={styles.inlineLoadingText}>Generating proof state...</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {(workflowState === "formalized" || workflowState === "applying" || workflowState === "applied") && currentInputState && (
          <div>
            <div style={styles.proofStateSection}>
              <h3 style={styles.sectionHeading}>Input State</h3>
              <p style={styles.helpText}>
                Make selections in the proof state below, then either mark as a non-example or apply the move.
              </p>
              <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
              <TypstContextProvider>
                <ProofStateWithLibraryResultComponent proofState={currentInputState.proofState} libraryResult={currentInputState.libraryResult} />
              </TypstContextProvider>
              </ProofStateSelectionContext.Provider>
              <div style={styles.selectionInfo}>
                {currentSelectionsCount} selection{currentSelectionsCount !== 1 ? 's' : ''} made
              </div>
              <ProofStateEditor
                proofState={currentInputState.proofState}
                onUpdate={handleUpdateInputProofState}
              />
            </div>

            {workflowState === "formalized" && (
              <div style={styles.actionButtons}>
                <button
                  onClick={() => handleSaveExample("non-example")}
                  style={styles.secondaryButton}
                >
                  Mark as Non-example
                </button>
                <button
                  onClick={() => handleApplyMove()}
                  disabled={isLoading || !action.trim()}
                  style={styles.primaryButton}
                >
                  {isLoading ? "Applying..." : "Apply Move"}
                </button>
                <button
                  onClick={handleReset}
                  style={styles.tertiaryButton}
                >
                  Discard
                </button>
              </div>
            )}
          </div>
        )}

        {workflowState === "applying" && (
          <div style={styles.loadingSection}>
            <div style={styles.inlineSpinner}></div>
            <p style={styles.inlineLoadingText}>Applying move...</p>
          </div>
        )}

        {workflowState === "applied" && currentOutputState && (
          <div>
            <div style={styles.proofStateSection}>
              <h3 style={styles.sectionHeading}>Output State</h3>
              <ProofStateContextProvider>
                <ProofStateWithLibraryResultComponent proofState={currentOutputState.proofState} libraryResult={currentOutputState.libraryResult} />
              </ProofStateContextProvider>
              <ProofStateEditor
                proofState={currentOutputState.proofState}
                onUpdate={handleUpdateOutputProofState}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Comment (optional)</label>
              <input
                type="text"
                value={exampleComment}
                onChange={(e) => setExampleComment(e.target.value)}
                style={styles.input}
                placeholder="Add a note about this example..."
              />
            </div>

            <div style={styles.actionButtons}>
              <button
                onClick={() => handleSaveExample("example")}
                style={styles.primaryButton}
              >
                Save as Example
              </button>
              <button
                onClick={() => handleSaveExample("non-example")}
                style={styles.secondaryButton}
              >
                Save as Non-example
              </button>
              <button
                onClick={handleReset}
                style={styles.tertiaryButton}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Load Existing Move */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Load Move</h2>
        <p style={styles.helpText}>
          Load an existing move definition to edit it. You can either upload a JSON file or paste the JSON directly.
        </p>
        
        <div style={styles.loadSection}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Upload JSON File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileLoad}
              style={styles.fileInput}
            />
          </div>

          <details style={styles.details}>
            <summary style={styles.summary}>Or paste JSON here</summary>
            <textarea
              style={styles.textarea}
              rows={6}
              placeholder='Paste move JSON here...'
              onBlur={(e) => {
                const value = e.target.value.trim()
                if (value) {
                  handleLoadMove(value)
                  e.target.value = ""
                }
              }}
            />
          </details>
        </div>

        {loadError && (
          <div style={styles.errorBox}>{loadError}</div>
        )}
      </div>

      {/* Export Section */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Export</h2>
        <div style={styles.exportSection}>
          <div style={styles.exportButtons}>
            <button
              onClick={handleExport}
              disabled={!moveName || examples.length === 0}
              style={{
                ...styles.exportButton,
                opacity: (!moveName || examples.length === 0) ? 0.5 : 1,
                cursor: (!moveName || examples.length === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              Download Move Definition
            </button>
            <button
              onClick={handleCopyJSON}
              style={{
                ...styles.copyButton,
                backgroundColor: copySuccess ? '#38a169' : 'white',
                color: copySuccess ? 'white' : '#3182ce',
              }}
            >
              {copySuccess ? '✓ Copied!' : 'Copy JSON'}
            </button>
          </div>
          
          <details style={styles.details}>
            <summary style={styles.summary}>Preview JSON</summary>
            <pre style={styles.jsonPreview}>{generateMoveJSON()}</pre>
          </details>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    color: "#1a202c",
  },
  header: {
    marginBottom: "32px",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "16px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    color: "#2d3748",
  },
  subtitle: {
    fontSize: "16px",
    color: "#718096",
    margin: 0,
  },
  card: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginTop: 0,
    marginBottom: "20px",
    color: "#2d3748",
  },
  row: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  formGroup: {
    marginBottom: "16px",
    flex: 1,
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    fontSize: "14px",
    color: "#4a5568",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
    lineHeight: "1.5",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    boxSizing: "border-box" as const,
    cursor: "pointer",
  },
  exampleCard: {
    backgroundColor: "#f7fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "8px",
  },
  exampleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  exampleBadge: {
    display: "inline-block",
    padding: "3px 8px",
    backgroundColor: "#c6f6d5",
    color: "#22543d",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    marginRight: "8px",
    textTransform: "uppercase" as const,
  },
  nonexampleBadge: {
    display: "inline-block",
    padding: "3px 8px",
    backgroundColor: "#fed7d7",
    color: "#742a2a",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    marginRight: "8px",
    textTransform: "uppercase" as const,
  },
  exampleDescription: {
    fontSize: "14px",
    color: "#4a5568",
  },
  commentText: {
    fontSize: "13px",
    color: "#718096",
    marginTop: "8px",
    fontStyle: "italic",
  },
  noSelectionsWarning: {
    fontSize: "12px",
    color: "#b7791f",
    backgroundColor: "#fefcbf",
    border: "1px solid #f6e05e",
    borderRadius: "4px",
    padding: "4px 8px",
    marginTop: "8px",
  },
  deleteButton: {
    padding: "4px 8px",
    backgroundColor: "transparent",
    color: "#e53e3e",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  primaryButton: {
    padding: "10px 20px",
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.15s",
    marginRight: "8px",
  },
  secondaryButton: {
    padding: "10px 20px",
    backgroundColor: "white",
    color: "#3182ce",
    border: "1px solid #3182ce",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s",
    marginRight: "8px",
  },
  tertiaryButton: {
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "#718096",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  exportButton: {
    padding: "12px 24px",
    backgroundColor: "#38a169",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  errorBox: {
    backgroundColor: "#fff5f5",
    color: "#c53030",
    border: "1px solid #feb2b2",
    borderRadius: "6px",
    padding: "12px 16px",
    marginTop: "12px",
    marginBottom: "12px",
    fontSize: "14px",
  },
  proofStateSection: {
    marginBottom: "20px",
    padding: "16px",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  sectionHeading: {
    fontSize: "16px",
    fontWeight: "600",
    marginTop: 0,
    marginBottom: "8px",
    color: "#2d3748",
  },
  helpText: {
    fontSize: "14px",
    color: "#718096",
    marginBottom: "12px",
    lineHeight: "1.5",
  },
  selectionInfo: {
    fontSize: "13px",
    color: "#4a5568",
    marginTop: "12px",
    fontWeight: "500",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
    flexWrap: "wrap" as const,
  },
  exportSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  fileInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    cursor: "pointer",
    backgroundColor: "white",
  },
  loadSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  exportButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  copyButton: {
    padding: "12px 24px",
    backgroundColor: "white",
    color: "#3182ce",
    border: "1px solid #3182ce",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  details: {
    marginTop: "12px",
  },
  summary: {
    cursor: "pointer",
    fontWeight: "500",
    color: "#3182ce",
    padding: "8px 0",
    fontSize: "14px",
  },
  jsonPreview: {
    backgroundColor: "#1a202c",
    color: "#e2e8f0",
    padding: "16px",
    borderRadius: "6px",
    overflow: "auto",
    fontSize: "12px",
    marginTop: "8px",
    lineHeight: "1.5",
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
  },
  loadingSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  inlineSpinner: {
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #3182ce",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    animation: "spin 1s linear infinite",
    flexShrink: 0,
  },
  inlineLoadingText: {
    color: "#4a5568",
    fontSize: "14px",
    fontWeight: "500",
    margin: 0,
  },
}
