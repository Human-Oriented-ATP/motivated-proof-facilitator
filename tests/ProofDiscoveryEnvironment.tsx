import React from 'react'
import { ProofDiscoveryEnvironment } from '../src/components/ProofDiscoveryEnvironment'
import { sampleProofDiscoveryState } from './samples/ProofDiscoveryState'
import ProofStateContextProvider from './ProofStateContext'

/**
 * Test component for the ProofDiscoveryEnvironment.
 *
 * This renders the full proof discovery environment with the sample proof discovery state,
 * including the current proof state display, action buttons, graph visualization, and library.
 */
export default function Test() {
    return (
        <ProofStateContextProvider>
            <div style={{ 
                width: '100vw',
                height: '100vh',
                backgroundColor: '#f9fafb',
                overflow: 'hidden'
            }}>
                <ProofDiscoveryEnvironment 
                    initialProofDiscoveryState={sampleProofDiscoveryState}
                />
            </div>
        </ProofStateContextProvider>
    )
}
