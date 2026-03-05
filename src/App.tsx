import React, { useState, useReducer, JSX } from "react"
import { ProofDiscoveryState } from "./core/ProofDiscoveryState"
import { ProofDiscoveryEnvironment } from "./components/ProofDiscoveryEnvironment"
import { ProofStateGenerator } from "./components/ProofStateGenerator"
import { ProofStateSelectionContext, proofStateSelectionReducer } from "./core/ProofStateSelectionContext"
import TypstContextProvider from "./components/TypstContext"

export default function App(): JSX.Element {
  const [initialState, setInitialState] = useState<ProofDiscoveryState | null>(null)
  const [selections, selectionsDispatch] = useReducer(proofStateSelectionReducer, [])

  if (initialState) {
    return (
      <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
        <TypstContextProvider>
          <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <div style={styles.appHeader}>
              <h1 style={styles.appTitle}>Motivated Proof Facilitator</h1>
              <div style={styles.statementDisplay}>
                <strong>Statement:</strong> {initialState.statement}
              </div>
              <button
                style={styles.backButton}
                onClick={() => {
                  setInitialState(null)
                  selectionsDispatch({ type: "CLEAR_ALL_SELECTIONS" })
                }}
              >
                ← New Statement
              </button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <ProofDiscoveryEnvironment initialProofDiscoveryState={initialState} />
            </div>
          </div>
        </TypstContextProvider>
      </ProofStateSelectionContext.Provider>
    )
  }

  return <ProofStateGenerator onGenerated={setInitialState} />
}

const styles: { [key: string]: React.CSSProperties } = {
  appHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    borderBottom: "2px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  appTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1a74d2",
    margin: 0,
    whiteSpace: "nowrap",
  },
  statementDisplay: {
    flex: 1,
    fontSize: "0.95rem",
    color: "#2d3748",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  backButton: {
    padding: "0.5rem 1.25rem",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#1a74d2",
    background: "white",
    border: "2px solid #1a74d2",
    borderRadius: "8px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
}
