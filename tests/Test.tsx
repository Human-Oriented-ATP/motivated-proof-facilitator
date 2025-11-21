import { JSX, useState } from "react"
import "./MathExpression"
import "./MathStatement"
import RenderMathExpressions from "./MathExpression"
import RenderMathStatements from "./MathStatement"

export default function Test(): JSX.Element {
    const [activeTest, setActiveTest] = useState<'expressions' | 'statements'>('statements')
    
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
            </div>
            
            {activeTest === 'expressions' ? <RenderMathExpressions /> : <RenderMathStatements />}
        </div>
    )
}