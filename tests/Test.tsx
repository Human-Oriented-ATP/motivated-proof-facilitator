import { JSX, useState } from "react"
import "./MathExpression"
import "./MathStatement"
import "./ProofState"
import "./ProofDiscoveryState"
import "./ProofDiscoveryEnvironment"
import "./Formalizer"
import RenderMathExpressions from "./MathExpression"
import RenderMathStatements from "./MathStatement"
import RenderProofStates from "./ProofState"
import RenderProofDiscoveryStates from "./ProofDiscoveryState"
import RenderProofDiscoveryEnvironment from "./ProofDiscoveryEnvironment"
import RenderFormalizer from "./Formalizer"
import MoveGenerator from "./MoveGenerator"
import MoveVisualizer from "./MoveVisualizer"

export default function Test(): JSX.Element {
    const [activeTest, setActiveTest] = useState<'expressions' | 'statements' | 'proofstates' | 'proofdiscoverystates' | 'proofdiscoveryenvironment' | 'formalizer' | 'movegenerator' | 'movevisualizer'>('proofstates')
    const [generatorInitialMove, setGeneratorInitialMove] = useState<string | undefined>()
    
    return (
        <div>
            <div style={{ 
                padding: '15px', 
                backgroundColor: '#333', 
                color: 'white',
                display: 'flex',
                gap: '10px',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                <button
                    onClick={() => setActiveTest('expressions')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'expressions' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Math Expressions
                </button>
                <button
                    onClick={() => setActiveTest('statements')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'statements' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Statements
                </button>
                <button
                    onClick={() => setActiveTest('proofstates')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'proofstates' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Proof States
                </button>
                <button
                    onClick={() => setActiveTest('proofdiscoverystates')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'proofdiscoverystates' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Proof Discovery States
                </button>
                <button
                    onClick={() => setActiveTest('formalizer')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'formalizer' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Formalizer
                </button>
                <button
                    onClick={() => setActiveTest('proofdiscoveryenvironment')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'proofdiscoveryenvironment' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Proof Discovery Environment
                </button>
                <button
                    onClick={() => setActiveTest('movegenerator')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'movegenerator' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Move Generator
                </button>
                <button
                    onClick={() => setActiveTest('movevisualizer')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTest === 'movevisualizer' ? '#2196F3' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    Move Visualizer
                </button>
            </div>
            
            {activeTest === 'expressions' ? <RenderMathExpressions /> : 
             activeTest === 'statements' ? <RenderMathStatements /> :
             activeTest === 'proofstates' ? <RenderProofStates /> :
             activeTest === 'proofdiscoverystates' ? <RenderProofDiscoveryStates /> :
             activeTest === 'proofdiscoveryenvironment' ? <RenderProofDiscoveryEnvironment /> :
             activeTest === 'formalizer' ? <RenderFormalizer /> :
             activeTest === 'movegenerator' ? <MoveGenerator initialMoveJson={generatorInitialMove} /> :
             <MoveVisualizer onOpenInGenerator={(moveJson) => { setGeneratorInitialMove(moveJson); setActiveTest('movegenerator') }} />}
        </div>
    )
}