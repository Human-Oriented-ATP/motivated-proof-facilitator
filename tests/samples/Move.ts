import { ProofDiscoveryMove } from "../../src/core/ProofDiscoveryMove";

const sampleMoves: ProofDiscoveryMove[] = [
    {
        name: "Peel quantified variable",
        kind: "equivalence",
        trigger: {
            description: "This move applies when there is a universally quantified variable in the goal.",
            examples: [{
                proofState: [{
                    variables: [{ name: "P", kind: "free", description: "$\\alpha \\to \\text{Prop}$" }],
                    hypotheses: [],
                    goals: [{ label: "example_goal", statement: { kind: "highlight", statement: {
                        kind: "universal",
                        variable: { name: "x", description: "$\\alpha$" },
                        statement: "P(x)"
                    }}}]
                }],
                selections: [{
                    proofStateId: { proofNodeId: 0, proofContextId: 0 },
                    location: { kind: "goal", label: "example_goal" },
                    address: [],
                    selection: {
                        kind: "universal",
                        variable: { name: "x", description: "$\\alpha$" },
                        statement: "P(x)"
                    }}]
            }],
            nonexamples: []
        },
        action: {
            prompt: "Remove the universal quantifier from the goal and introduce a new variable.",
            examples: [{
                inputState: [{
                    variables: [{ name: "P", kind: "free", description: "$\\alpha \\to \\text{Prop}$" }],
                    hypotheses: [],
                    goals: [{ label: "example_goal", statement: { kind: "highlight", statement: {
                        kind: "universal",
                        variable: { name: "x", description: "$\\alpha$" },
                        statement: "P(x)"
                    }}}]
                }],
                outputState: [{
                    variables: [{ name: "P", kind: "free", description: "$\\alpha \\to \\text{Prop}$" }, 
                                { name: "x", kind: "free", description: "$\\alpha$" }],
                    hypotheses: [],
                    goals: [{ label: "example_goal", statement: "P(x)" }]
                }]
            }],
            nonexamples: []
        }
    }   
]