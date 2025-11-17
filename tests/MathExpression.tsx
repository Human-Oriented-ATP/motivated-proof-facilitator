import { JSX, useContext } from "react";
import "./ProofStateContext";
import { expressions } from "./samples/MathExpression";
import ProofStateContextProvider from "./ProofStateContext";
import { MathExpression } from "../src/components/MathExpression";
import { ProofStateSelectionContext } from "../src/core/ProofStateSelectionContext";

function MathExpressionsContent(): JSX.Element {
    const { selections, dispatch } = useContext(ProofStateSelectionContext)
    
    return (
        <div style={{ padding: '20px' }}>
            <h2>Math Expressions</h2>
            <div style={{ marginBottom: '30px' }}>
                {expressions.map((expr, idx) => (
                    <div key={idx} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                        <MathExpression {...expr} index={idx} />
                    </div>
                ))}
            </div>
            
            <h2>Current Selections</h2>
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                {selections.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No selections</p>
                ) : (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {selections.map((sel, idx) => (
                            <li key={idx} style={{ marginBottom: '10px' }}>
                                <strong>Proof State ID:</strong> {sel.proofStateId}<br/>
                                <strong>Location:</strong> {sel.location.kind} - {sel.location.label}<br/>
                                <strong>Address:</strong> {JSON.stringify(sel.address)}<br/>
                                <strong>Selection:</strong> {typeof sel.selection === 'object' && 'text' in sel.selection 
                                    ? sel.selection.text 
                                    : JSON.stringify(sel.selection)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default function RenderMathExpressions(): JSX.Element {
    return ( 
        <ProofStateContextProvider>
            <MathExpressionsContent />
        </ProofStateContextProvider>
    )
} 