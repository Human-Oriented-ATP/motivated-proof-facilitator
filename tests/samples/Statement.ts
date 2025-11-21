import { Statement } from "../../src/core/ProofState"

/** Sample statements for testing the MathStatement component */
export const statements: Statement[] = [
    // Atomic statements
    "The sum $a + b$ is equal to $c$",
    "For all natural numbers $n$, we have $n >= 0$",
    
    // Conjunction
    {
        kind: "conjunction",
        statements: [
            "$x > 0$",
            "$y > 0$",
            "$z > 0$"
        ]
    },
    
    // Disjunction
    {
        kind: "disjunction",
        statements: [
            "$n$ is even",
            "$n$ is odd"
        ]
    },
    
    // Negation
    {
        kind: "negation",
        statement: "$x = 0$"
    },
    
    // Implication
    {
        kind: "implication",
        antecedent: "$n$ is divisible by $4$",
        consequent: "$n$ is divisible by $2$"
    },
    
    // Equivalence
    {
        kind: "equivalence",
        left: "$x^2 = 4$",
        right: {
            kind: "disjunction",
            statements: ["$x = 2$", "$x = -2$"]
        }
    },
    
    // Universal quantifier
    {
        kind: "universal",
        variable: {
            name: "$x$",
            description: "$RR$"
        },
        statement: "$x^2 >= 0$"
    },
    
    // Existential quantifier
    {
        kind: "existential",
        variable: {
            name: "$n$",
            description: "$NN$"
        },
        statement: "$n > 100$"
    },
    
    // Highlighted statement
    {
        kind: "highlight",
        statement: "This statement is highlighted"
    },
    
    // Complex nested statement
    {
        kind: "implication",
        antecedent: {
            kind: "conjunction",
            statements: [
                "$f$ is continuous",
                "$f$ is differentiable"
            ]
        },
        consequent: {
            kind: "universal",
            variable: {
                name: "$x$",
                description: "$RR$"
            },
            statement: {
                kind: "existential",
                variable: {
                    name: "$delta$",
                    description: "$RR^+$"
                },
                statement: "$|f(x + delta) - f(x)| < epsilon$"
            }
        }
    },
    
    // Multiple levels of negation
    {
        kind: "negation",
        statement: {
            kind: "negation",
            statement: "$p$"
        }
    },
    
    // Conjunction with implication
    {
        kind: "conjunction",
        statements: [
            {
                kind: "implication",
                antecedent: "$p$",
                consequent: "$q$"
            },
            {
                kind: "implication",
                antecedent: "$q$",
                consequent: "$r$"
            }
        ]
    },
    
    // Equivalence chain
    {
        kind: "equivalence",
        left: {
            kind: "equivalence",
            left: "$a = b$",
            right: "$b = c$"
        },
        right: "$a = c$"
    }
]
