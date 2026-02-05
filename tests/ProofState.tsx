import { JSX, useContext } from "react"
import ProofStateContextProvider from "./ProofStateContext"
import { ProofState, ProofStateWithLibraryResult } from "../src/components/ProofState"
import { ProofStateSelectionContext } from "../src/core/ProofStateSelectionContext"
import { sampleProofStates } from "./samples/ProofState"

function SelectionDisplay(): JSX.Element {
    const { selections, dispatch } = useContext(ProofStateSelectionContext)

    return (
        <div style={{ 
            padding: '12px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '5px',
            border: '1px solid #bae6fd',
            marginTop: '15px'
        }}>
            {selections.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic', margin: 0, fontSize: '13px' }}>
                    No selections in this proof state
                </p>
            ) : (
                <>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px' }}>
                            {selections.length} selection{selections.length !== 1 ? 's' : ''}
                        </strong>
                        <button 
                            onClick={() => dispatch({ type: 'CLEAR_ALL_SELECTIONS' })}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                            }}
                        >
                            Clear
                        </button>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        {selections.map((sel, idx) => (
                            <li key={idx} style={{ marginBottom: '8px', fontSize: '13px', lineHeight: '1.5' }}>
                                <div><strong>Location:</strong> {sel.location.kind} ({sel.location.label})</div>
                                <div><strong>Address:</strong> {sel.address.length === 0 ? 'root' : JSON.stringify(sel.address)}</div>
                                <div><strong>Type:</strong> {
                                    typeof sel.selection === 'string' 
                                        ? 'Atomic Statement' 
                                        : typeof sel.selection === 'object' && 'text' in sel.selection
                                            ? 'Subexpression'
                                            : 'Complex Statement'
                                }</div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
}

export default function RenderProofStates(): JSX.Element {
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>ProofState Component Tests</h1>
            
            <h2>Test Cases</h2>
            <div style={{ marginBottom: '30px' }}>
                {sampleProofStates.map((testCase, idx) => (
                    <div key={idx} style={{ 
                        marginBottom: '30px', 
                        padding: '20px', 
                        border: '2px solid #ddd', 
                        borderRadius: '8px',
                        backgroundColor: '#fafafa'
                    }}>
                        <div style={{ 
                            fontSize: '18px', 
                            color: '#333', 
                            marginBottom: '15px', 
                            fontWeight: 'bold',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #2196F3'
                        }}>
                            Test {idx + 1}: {testCase.description}
                        </div>
                        <div style={{ 
                            padding: '20px', 
                            backgroundColor: '#fff', 
                            borderRadius: '5px',
                            border: '1px solid #eee'
                        }}>
                            <ProofStateContextProvider>
                                <ProofStateWithLibraryResult proofState={testCase.proofState} libraryResult={testCase.libraryResult} />
                                <SelectionDisplay />
                            </ProofStateContextProvider>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
