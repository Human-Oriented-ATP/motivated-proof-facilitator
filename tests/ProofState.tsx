import { JSX, useContext } from "react"
import ProofStateContextProvider from "./ProofStateContext"
import { ProofState } from "../src/components/ProofState"
import { ProofStateSelectionContext } from "../src/core/ProofStateSelectionContext"
import { sampleProofStates } from "./samples/ProofState"



function ProofStateContent(): JSX.Element {
    const { selections, dispatch } = useContext(ProofStateSelectionContext)
    
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
                            <ProofState proofState={testCase.proofState} />
                        </div>
                    </div>
                ))}
            </div>
            
            <h2>Current Selections</h2>
            <div style={{ 
                padding: '15px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '5px',
                border: '1px solid #ddd',
                position: 'sticky',
                top: '20px',
                marginBottom: '20px'
            }}>
                {selections.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>
                        No selections - click on any statement or expression to select it
                    </p>
                ) : (
                    <>
                        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{selections.length} selection{selections.length !== 1 ? 's' : ''}</strong>
                            <button 
                                onClick={() => dispatch({ type: 'CLEAR_ALL_SELECTIONS' })}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Clear All
                            </button>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {selections.map((sel, idx) => (
                                <li key={idx} style={{ marginBottom: '10px', fontSize: '14px' }}>
                                    <div><strong>Proof Node:</strong> {sel.proofStateId.proofNodeId}</div>
                                    <div><strong>Context:</strong> {sel.proofStateId.proofContextId}</div>
                                    <div><strong>Location:</strong> {sel.location.kind} ({sel.location.label})</div>
                                    <div><strong>Address:</strong> {sel.address.length === 0 ? 'root' : JSON.stringify(sel.address)}</div>
                                    <div><strong>Selection Type:</strong> {
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
        </div>
    )
}

export default function RenderProofStates(): JSX.Element {
    return ( 
        <ProofStateContextProvider>
            <ProofStateContent />
        </ProofStateContextProvider>
    )
}
