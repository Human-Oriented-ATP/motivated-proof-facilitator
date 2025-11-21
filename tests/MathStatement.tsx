import { JSX, useContext } from "react";
import "./ProofStateContext";
import { statements } from "./samples/Statement";
import ProofStateContextProvider from "./ProofStateContext";
import { MathStatement } from "../src/components/MathStatement";
import { ProofStateSelectionContext } from "../src/core/ProofStateSelectionContext";
import { Statement } from "../src/core/ProofState";

function describeStatement(stmt: Statement): string {
    if (typeof stmt === "string") {
        return `Atomic: "${stmt.substring(0, 50)}${stmt.length > 50 ? '...' : ''}"`
    }
    
    switch (stmt.kind) {
        case "conjunction":
            return `Conjunction (${stmt.statements.length} parts)`
        case "disjunction":
            return `Disjunction (${stmt.statements.length} parts)`
        case "negation":
            return "Negation"
        case "implication":
            return "Implication"
        case "equivalence":
            return "Equivalence"
        case "universal":
            return `Universal quantifier (∀${stmt.variable.name})`
        case "existential":
            return `Existential quantifier (∃${stmt.variable.name})`
        case "highlight":
            return "Highlighted"
        default:
            return "Unknown"
    }
}

function MathStatementContent(): JSX.Element {
    const { selections, dispatch } = useContext(ProofStateSelectionContext)
    
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>MathStatement Component Tests</h1>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                <h3 style={{ marginTop: 0 }}>Instructions</h3>
                <ul style={{ marginBottom: 0 }}>
                    <li>Hover over any statement segment to see it highlighted in yellow</li>
                    <li>Click on any statement segment to select it (blue highlight)</li>
                    <li>Click again to deselect</li>
                    <li>Multiple segments can be selected simultaneously</li>
                    <li>Check the "Current Selections" section below to see what's selected</li>
                </ul>
            </div>
            
            <h2>Test Cases</h2>
            <div style={{ marginBottom: '30px' }}>
                {statements.map((stmt, idx) => (
                    <div key={idx} style={{ 
                        marginBottom: '20px', 
                        padding: '15px', 
                        border: '1px solid #ddd', 
                        borderRadius: '5px',
                        backgroundColor: '#fafafa'
                    }}>
                        <div style={{ 
                            fontSize: '12px', 
                            color: '#666', 
                            marginBottom: '10px', 
                            fontFamily: 'monospace',
                            fontWeight: 'bold'
                        }}>
                            Test {idx + 1}: {describeStatement(stmt)}
                        </div>
                        <div style={{ 
                            padding: '15px', 
                            backgroundColor: '#fff', 
                            borderRadius: '3px',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            border: '1px solid #eee'
                        }}>
                            <MathStatement address={[]} statement={stmt} />
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
                top: '20px'
            }}>
                {selections.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>
                        No selections - click on any statement to select it
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
                                    <strong>Location:</strong> {sel.location.kind}<br/>
                                    <strong>Address:</strong> {sel.address.length === 0 ? 'root' : JSON.stringify(sel.address)}<br/>
                                    <strong>Selection Type:</strong> {
                                        typeof sel.selection === 'string' 
                                            ? 'Atomic Statement' 
                                            : typeof sel.selection === 'object' && 'text' in sel.selection
                                                ? 'Subexpression'
                                                : 'Complex Statement'
                                    }<br/>
                                    <strong>Content:</strong> {
                                        typeof sel.selection === 'object' && 'text' in sel.selection 
                                            ? `"${sel.selection.text}"` 
                                            : typeof sel.selection === 'string'
                                                ? `"${sel.selection.substring(0, 50)}${sel.selection.length > 50 ? '...' : ''}"`
                                                : describeStatement(sel.selection)
                                    }
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    )
}

export default function RenderMathStatements(): JSX.Element {
    return ( 
        <ProofStateContextProvider>
            <MathStatementContent />
        </ProofStateContextProvider>
    )
} 
