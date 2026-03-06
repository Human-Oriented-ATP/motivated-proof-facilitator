import React, { useState } from 'react';
import { ProofStateWithLibraryResult as ProofStateWithLibraryResultComponent } from '../src/components/ProofState';
import { ProofStateSelectionContext } from '../src/core/ProofStateSelectionContext';
import { ProofStateIdContext } from '../src/core/ProofDiscoveryStateContext';
import TypstContextProvider from '../src/components/TypstContext';
import { ProofDiscoveryMove } from '../src/core/ProofDiscoveryMove';

import { goalConjunctionMove } from '../src/prompts/goalConjunction';
import { goalDisjunctionMove } from '../src/prompts/goalDisjunction';
import { goalEquivalenceMove } from '../src/prompts/goalEquivalence';
import { goalExistentialMove } from '../src/prompts/goalExistential';
import { goalImplicationMove } from '../src/prompts/goalImplication';
import { goalContradictionMove } from '../src/prompts/goalContradiction';
import { goalUniversalMove } from '../src/prompts/goalUniversal';
import { hypothesisConjunctionMove } from '../src/prompts/hypothesisConjunction';
import { hypothesisDisjunctionMove } from '../src/prompts/hypothesisDisjunction';

const prompts: Record<string, ProofDiscoveryMove> = {
    goalConjunctionMove,
    goalDisjunctionMove,
    goalEquivalenceMove,
    goalExistentialMove,
    goalImplicationMove,
    goalContradictionMove,
    goalUniversalMove,
    hypothesisConjunctionMove,
    hypothesisDisjunctionMove,
};

const kindColors: Record<string, { bg: string; fg: string; border: string }> = {
    strengthening: { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
    weakening:     { bg: '#fef9c3', fg: '#854d0e', border: '#fde047' },
    equivalence:   { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
};

function KindBadge({ kind }: { kind: string }): React.JSX.Element {
    const c = kindColors[kind] ?? { bg: '#f3f4f6', fg: '#374151', border: '#d1d5db' };
    return (
        <span style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
            padding: '1px 7px', borderRadius: 9999, background: c.bg, color: c.fg,
            border: `1px solid ${c.border}`, textTransform: 'capitalize' as const,
            lineHeight: 1.5, letterSpacing: '0.02em' }}>
            {kind}
        </span>
    );
}

type Props = { onOpenInGenerator?: (moveJson: string) => void };

export default function MoveVisualizer({ onOpenInGenerator }: Props): React.JSX.Element {
    const [selectedKey, setSelectedKey] = useState<string>(Object.keys(prompts)[0]);
    const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set());
    const active = prompts[selectedKey];

    const handleSelectKey = (key: string) => {
        setSelectedKey(key);
        setExpandedExamples(new Set());
    };

    const toggleExample = (idx: number) => {
        setExpandedExamples(prev => {
            const n = new Set(prev);
            n.has(idx) ? n.delete(idx) : n.add(idx);
            return n;
        });
    };

    return (
        <TypstContextProvider>
            <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, sans-serif', background: '#f7fafc' }}>
                {/* Sidebar */}
                <div style={{ width: 240, flexShrink: 0, background: 'white', borderRight: '1.5px solid #e2e8f0',
                    overflowY: 'auto', padding: '0.75rem 0' }}>
                    <div style={{ padding: '0.5rem 0.875rem 0.75rem', fontSize: '0.7rem', fontWeight: 700,
                        color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Moves
                    </div>
                    {Object.entries(prompts).map(([key, move]) => (
                        <button
                            key={key}
                            onClick={() => handleSelectKey(key)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                                width: '100%', padding: '0.55rem 0.875rem', border: 'none',
                                borderLeft: `3px solid ${selectedKey === key ? '#16a34a' : 'transparent'}`,
                                background: selectedKey === key ? '#f0fdf4' : 'transparent',
                                cursor: 'pointer', textAlign: 'left' }}
                        >
                            <span style={{ fontSize: '0.82rem', fontWeight: selectedKey === key ? 700 : 500,
                                color: selectedKey === key ? '#166534' : '#374151', lineHeight: 1.3 }}>
                                {move.name}
                            </span>
                            <KindBadge kind={move.kind} />
                        </button>
                    ))}
                </div>

                {/* Detail panel */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {/* Move header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem',
                        marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#166534' }}>
                            {active.name}
                        </span>
                        <KindBadge kind={active.kind} />
                        {onOpenInGenerator && (
                            <button
                                onClick={() => onOpenInGenerator(JSON.stringify(active, null, 2))}
                                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 600,
                                    color: '#1e40af', background: 'white', border: '1.5px solid #93c5fd',
                                    borderRadius: 8, cursor: 'pointer' }}
                            >
                                <svg style={{ width: 14, height: 14 }} viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit in Move Generator
                            </button>
                        )}
                    </div>

                    {/* Trigger / Action */}
                    <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10,
                        padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem',
                        color: '#374151', lineHeight: 1.65 }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: '#166534' }}>Trigger: </span>
                            {active.trigger}
                        </div>
                        <div>
                            <span style={{ fontWeight: 700, color: '#1e40af' }}>Action: </span>
                            {active.action}
                        </div>
                    </div>

                    {/* Examples */}
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
                        Examples ({active.examples.length})
                    </div>

                    {active.examples.map((example, idx) => {
                        const isExample = example.kind === 'example';
                        const open = expandedExamples.has(idx);
                        return (
                            <div key={idx} style={{ border: `1.5px solid ${isExample ? '#86efac' : '#fca5a5'}`,
                                borderRadius: 10, marginBottom: '0.75rem', overflow: 'hidden' }}>
                                {/* Example header row */}
                                <button
                                    onClick={() => toggleExample(idx)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                        padding: '0.625rem 0.875rem', background: isExample ? '#f0fdf4' : '#fef2f2',
                                        border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    <svg style={{ width: 12, height: 12, flexShrink: 0, transition: 'transform 0.2s',
                                        transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: '#6b7280' }}
                                        viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700,
                                        color: isExample ? '#166534' : '#991b1b',
                                        background: isExample ? '#dcfce7' : '#fee2e2',
                                        padding: '1px 6px', borderRadius: 9999 }}>
                                        {isExample ? '✓' : '✗'}
                                    </span>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', flex: 1 }}>
                                        {example.description}
                                    </span>
                                </button>

                                {open && (
                                    <div style={{ padding: '0.75rem 0.875rem',
                                        background: isExample ? '#fafffe' : '#fffafa' }}>
                                        {example.comment && (
                                            <p style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic',
                                                margin: '0 0 0.75rem' }}>
                                                {example.comment}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1 1 45%', minWidth: 320 }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280',
                                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                                    marginBottom: '0.375rem' }}>Input</div>
                                                <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem',
                                                    border: '1px solid #e5e7eb', overflow: 'auto', maxHeight: 220 }}>
                                                    <ProofStateIdContext.Provider value={{ proofNodeId: 0, proofContextId: -1 }}>
                                                        <ProofStateSelectionContext.Provider value={{ selections: example.selections, dispatch: () => {} }}>
                                                            <ProofStateWithLibraryResultComponent
                                                                proofState={example.inputState.proofState}
                                                                libraryResult={example.inputState.libraryResult ?? undefined}
                                                            />
                                                        </ProofStateSelectionContext.Provider>
                                                    </ProofStateIdContext.Provider>
                                                </div>
                                            </div>
                                            <div style={{ flex: '1 1 45%', minWidth: 320 }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280',
                                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                                    marginBottom: '0.375rem' }}>Output</div>
                                                <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem',
                                                    border: '1px solid #e5e7eb', overflow: 'auto', maxHeight: 220 }}>
                                                    {example.outputState ? (
                                                        <ProofStateWithLibraryResultComponent
                                                            proofState={example.outputState.proofState}
                                                            libraryResult={example.outputState.libraryResult ?? undefined}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>No output state</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </TypstContextProvider>
    );
}