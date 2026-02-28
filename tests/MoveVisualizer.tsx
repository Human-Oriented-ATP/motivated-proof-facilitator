import React, { useState } from 'react';
import { ProofStateWithLibraryResult as ProofStateWithLibraryResultComponent } from '../src/components/ProofState';
import { ProofStateSelectionContext } from '../src/core/ProofStateSelectionContext';
import TypstContextProvider from '../src/components/TypstContext';

import { goalConjunctionMove } from '../src/prompts/goalConjunction';
import { goalDisjunctionMove } from '../src/prompts/goalDisjunction';
import { goalExistentialMove } from '../src/prompts/goalExistential';
import { goalUniversalMove } from '../src/prompts/goalUniversal';
import { hypothesisConjunctionMove } from '../src/prompts/hypothesisConjunction';
import { hypothesisDisjunctionMove } from '../src/prompts/hypothesisDisjunction';

const prompts = {
    goalConjunctionMove,
    goalDisjunctionMove,
    goalExistentialMove,
    goalUniversalMove,
    hypothesisConjunctionMove,
    hypothesisDisjunctionMove
};

export default function MoveVisualizer(): React.JSX.Element {
    const [selectedPromptKey, setSelectedPromptKey] = useState<keyof typeof prompts>('goalConjunctionMove');
    const activePrompt = prompts[selectedPromptKey];

    const styles: Record<string, React.CSSProperties> = {
        container: { padding: '20px', fontFamily: 'sans-serif' },
        selector: { marginBottom: '20px', padding: '10px', fontSize: '16px' },
        promptHeader: { backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' },
        exampleContainer: { border: '1px solid #ccc', borderRadius: '5px', padding: '15px', marginBottom: '20px' },
        exampleHeader: { marginTop: 0 },
        stateContainer: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
        stateBox: { flex: '1 1 45%', minWidth: '400px', backgroundColor: '#fafafa', padding: '15px', borderRadius: '5px', border: '1px solid #eee' },
        tag: { display: 'inline-block', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginLeft: '10px' },
        exampleTag: { backgroundColor: '#e6f4ea', color: '#137333' },
        nonExampleTag: { backgroundColor: '#fce8e6', color: '#c5221f' },
        comment: { fontStyle: 'italic', color: '#666', marginTop: '10px', marginBottom: '10px' }
    };

    return (
        <div style={styles.container}>
            <select 
                style={styles.selector}
                value={selectedPromptKey} 
                onChange={e => setSelectedPromptKey(e.target.value as keyof typeof prompts)}
            >
                {Object.keys(prompts).map(key => (
                    <option key={key} value={key}>{prompts[key as keyof typeof prompts].name}</option>
                ))}
            </select>

            <div style={styles.promptHeader}>
                <h2>{activePrompt.name}</h2>
                <p><strong>Kind:</strong> {activePrompt.kind}</p>
                <p><strong>Trigger:</strong> {activePrompt.trigger}</p>
                <p><strong>Action:</strong> {activePrompt.action}</p>
            </div>

            <h3>Examples ({activePrompt.examples.length})</h3>
            
            {activePrompt.examples.map((example, idx) => (
                <div key={idx} style={styles.exampleContainer}>
                    <h4 style={styles.exampleHeader}>
                        Example {idx + 1}: {example.description}
                        <span style={{...styles.tag, ...(example.kind === 'example' ? styles.exampleTag : styles.nonExampleTag)}}>
                            {example.kind === 'example' ? 'Example' : 'Non-Example'}
                        </span>
                    </h4>
                    
                    {example.comment && (
                        <p style={styles.comment}>{example.comment}</p>
                    )}

                    <div style={styles.stateContainer}>
                        <div style={styles.stateBox}>
                            <h5>Input State</h5>
                            <ProofStateSelectionContext.Provider value={{ selections: example.selections, dispatch: () => {} }}>
                                <TypstContextProvider>
                                    <ProofStateWithLibraryResultComponent 
                                        proofState={example.inputState.proofState} 
                                        libraryResult={example.inputState.libraryResult ?? undefined} 
                                    />
                                </TypstContextProvider>
                            </ProofStateSelectionContext.Provider>
                        </div>
                        
                        <div style={styles.stateBox}>
                            <h5>Output State</h5>
                            {example.outputState ? (
                                <TypstContextProvider>
                                    <ProofStateWithLibraryResultComponent 
                                        proofState={example.outputState.proofState} 
                                        libraryResult={example.outputState.libraryResult ?? undefined} 
                                    />
                                </TypstContextProvider>
                            ) : (
                                <p style={{ color: '#888' }}>No output state</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}