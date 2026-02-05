import React from 'react'
import { ProofDiscoveryState } from '../src/components/ProofDiscoveryState'
import { proofDiscoveryStates } from './samples/ProofDiscoveryState'
import TypstContextProvider from '../src/components/TypstContext'
import { ProofDiscoveryStateContext } from '../src/core/ProofDiscoveryStateContext'
import { proofDiscoveryStateReducer, ProofDiscoveryState as ProofDiscoveryStateType } from '../src/core/ProofDiscoveryState'

function ProofDiscoveryStateInteractive({ initialState }: { initialState: ProofDiscoveryStateType }) {
    const [state, dispatch] = React.useReducer(proofDiscoveryStateReducer, initialState)

    return (
        <ProofDiscoveryStateContext.Provider value={{ proofDiscoveryState: state, dispatchProofDiscoveryAction: dispatch }}>
            <ProofDiscoveryState proofDiscoveryState={state} />
        </ProofDiscoveryStateContext.Provider>
    )
}

/**
 * Test component for the ProofDiscoveryState graph visualization.
 * 
 * This demonstrates rendering different types of proof discovery states:
 * - Simple: A linear sequence of proof states
 * - Branching: Multiple branches with different move types
 * - Complex: A more intricate graph structure
 * - Solved: A completed proof
 */
export default function Test() {
    return (
        <TypstContextProvider>
        <div style={{ 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '40px',
            backgroundColor: '#f9fafb'
        }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                ProofDiscoveryState Graph Visualization Tests
            </h1>
            
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                    Simple Linear Proof Discovery
                </h2>
                <p style={{ marginBottom: '10px', color: '#6b7280' }}>
                    A simple linear progression with strengthening moves
                </p>
                <ProofDiscoveryStateInteractive initialState={proofDiscoveryStates.simple} />
            </div>
            
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                    Branching Proof Discovery
                </h2>
                <p style={{ marginBottom: '10px', color: '#6b7280' }}>
                    Multiple branches showing strengthening (green), weakening (orange), 
                    and equivalence (purple) moves
                </p>
                <ProofDiscoveryStateInteractive initialState={proofDiscoveryStates.branching} />
            </div>
            
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                    Complex Proof Discovery
                </h2>
                <p style={{ marginBottom: '10px', color: '#6b7280' }}>
                    A complex graph with all move types including exploratory moves (gray, dashed)
                </p>
                <ProofDiscoveryStateInteractive initialState={proofDiscoveryStates.complex} />
            </div>
            
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                    Solved Proof Discovery
                </h2>
                <p style={{ marginBottom: '10px', color: '#6b7280' }}>
                    A completed proof (isSolved = true)
                </p>
                <ProofDiscoveryStateInteractive initialState={proofDiscoveryStates.solved} />
            </div>
            
            <div style={{ 
                padding: '20px', 
                backgroundColor: '#fff', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
                    Legend
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '3px', backgroundColor: '#10b981' }}></div>
                        <span>Strengthening move (goal becomes stronger)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '3px', backgroundColor: '#f59e0b' }}></div>
                        <span>Weakening move (goal becomes weaker)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '3px', backgroundColor: '#8b5cf6' }}></div>
                        <span>Equivalence (logically equivalent states)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '1px', backgroundColor: '#9ca3af', borderTop: '1px dashed #9ca3af' }}></div>
                        <span>Other/exploratory move</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#2563eb' }}></div>
                        <span>Current node (highlighted in blue)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></div>
                        <span>Other nodes</span>
                    </li>
                </ul>
            </div>
        </div>
        </TypstContextProvider>
    )
}
