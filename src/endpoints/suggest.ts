import { generateText, Output } from "ai"
import { SuggestRequest, SuggestResultsSchema } from "../fetchers/suggest.js"
import { MODELS } from "./models.js"

const SUGGEST_PROMPT = 
`
Your task is to suggest useful statements that fall within the "cluster" of statements related to the given selections, in the form of
- standard equivalent formulations
- standard strengthenings or sufficient conditions
- standard weakenings
- simplifications
- definitional unfoldings
- definitional refoldings (i.e., introducing a high-level concept that encapsulates part of the statement)
- descriptions of relevant mathematical objects,
or in other ways.

Main selections decide the location in the proof state where suggestions will be inserted. 
They can be thought of as the terms that suggestions can in principle replace.
Additional selections provide extra context to guide the suggestion generation 
but are not meant to be modified by the suggestions.

Consult the list of variables to properly interpret the selections.

Please keep the suggestions simple, precise, structured, direct and relevant, avoiding wordy phrasing.

The more a suggestion deviates from the "cluster" of related statements around the main selections,
the more oriented it must be towards the additional selections, and the more terms it should produce that match with 
ones in the additional selections.

For example, if the main selection is "$f$ is continuous" and a goal "$A$ is closed in $X$" has been selected, then the closed-sets formulation of "$f$ is continuous" would be a good suggestion.
\`\`\`
{
    "kind": "universal",
    "variable": {
    "name": "$C$",
    "description": "subset of $Y$"
    },
    "statement": {
    "kind": "implication",
    "antecedent": "$C$ is closed in $Y$",
    "consequent": "$f^(-1)(C)$ is closed in $X$"
    }
}
\`\`\`

This is because by introducing the predicate "is closed in" it makes it more likely that a purely logical deduction will be possible. By contrast, if closed sets haven't been mentioned at all, then the closed-sets formulation would be rather arbitrary and unmotivated, and therefore not a good fit for the list of suggestions.

Another situation where such matching would be desirable is when one of the main selections has an associated statement that resembles an additional selection of opposite polarity ("true" polarity is associated with hypothesis-like statements and "false" polarity is associated with goal-like statements). For example, if the main selection is the hypothesis "$U$ is open"
and the additional selection is the goal "$V$ is closed",  where $U$ is a free variable and $V$ is a meta variable, both of which represent subsets of a metric space $X$, then the suggestion "$U^c$ is closed" would be preferred over the open-ball definition, since it matches quite closely with the additional selection of opposite polarity which contains metavariables that can be instantiated. 

A slightly more complicated instance of the set-up is when the main selection is the hypothesis "$U$ is open" ("true" polarity) and the additional selection is the goal "$U^c sect V$ is closed" ("false" polarity), where $U$ and $V$ are now subsets of a topological space. It would still make sense to suggest "$U^c$ is closed" as a standard consequence in this case, since the it creates matches with the term "U^c" and the predicate "is closed".

Another example is where the main selections are hypotheses "$a < c$" and "$b < d$" ("true" polarity), and the additional selection is the goal  $a + b < n$ ("false" polarity), where all variables are real numbers. In this case, a good suggestion would be "$a + b < c + d$" as a standard consequence, since it matches the general structure of the additional selection well by having the form "$a + b < ...$".

It may be useful to offer suggestions that reduce the number of variables involved, as that is often a sign of progress.
For example, if the main selection is the statement
\`\`\`
{
    "kind": "existential",
    "variable": {
        "name": "$x$",
        "description": "$G$"
    },
    "statement": {
        "kind": "existential",
        "variable": {
            "name": "$y$",
            "description": "$G$"
        },
        "statement": "$x y eq.not y x$"
        }
    }
}
\`\`\`
where $G$ is a group, a suggestion "$G$ is non-abelian" would be a good suggestion, as it eliminates the variables $x$ and $y$. 

Please favour strengthenings, weakenings and unfoldings that are *minimal*, in the sense of not going any further than they need to.
For example, if $B$ is a subset of a metric space $X$ and the selection is "$B$ is an open set", it would be better to pick the higher-level definition
\`\`\`

{
    "kind": "universal",
    "variable": {
    "name": "$x$",
    "description": "$B$"
    },
    "statement": {
    "kind": "existential",
    "variable": {
        "name": "$epsilon$",
        "description": "$RR_(>0)$"
    },
    "statement": "$B_epsilon(x) subset.eq B$"
    }
}
\`\`\`
as a suggestion over the lower-level definition
\`\`\`
{
    "kind": "universal",
    "variable": {
    "name": "$x$",
    "description": "$B$"
    },
    "statement": {
    "kind": "existential",
    "variable": {
        "name": "$epsilon$",
        "description": "$RR_(>0)$"
    },
    "statement": {
        "kind": "universal",
        "variable": {
        "name": "$y$",
        "description": "$X$"
        },
        "statement": {
        "kind": "implication",
        "antecedent": "$d(x, y) < epsilon$",
        "consequent": "$y in B$"
        }
    }
}
\`\`\`


Prefer generating structured statements composed of simpler atomic sentences with logical connectives over
long and convoluted atomic statements.

Some examples of statements include:
\`\`\`
{
    kind: "universal",
    variable: { name: "$N$", description: "$NN$" },
    statement: {
        kind: "existential",
        variable: { name: "$p$", description: "$NN$" },
        statement: {
            kind: "conjunction",
            statements: [
                "$p$ is prime",
                "$p + 2$ is prime",
                "$p > N$"
            ]
        }
    }
}
\'\'\'

\`\`\`
{
    "kind": "universal",
    "variable": {
    "name": "$delta$",
    "description": "$RR_(>0)$"
    },
    "statement": {
    "kind": "universal",
    "variable": {
        "name": "$k$",
        "description": "$NN$"
    },
    "statement": {
        "kind": "existential",
        "variable": {
        "name": "$N$",
        "description": "$NN$"
        },
        "statement": {
        "kind": "universal",
        "variable": {
            "name": "$A$",
            "description": "subset of $ {1, 2, dots, N} $"
        },
        "statement": {
            "kind": "implication",
            "antecedent": "$bar.v A bar.v gt.eq delta dot N$",
            "consequent": {
            "kind": "existential",
            "variable": {
                "name": "$P$",
                "description": "subset of $ {1, 2, dots, N} $"
            },
            "statement": {
                "kind": "conjunction",
                "statements": [
                "$P$ is an arithmetic progression",
                "$P$ is a subset of $A$",
                "$P$ has length $k$"
                ]
            }
            }
        }
        }
    }
    }
}
\`\`\`

\`\`\`
{
    kind: "universal",
    variable: { name: "$n$", description: "$NN$" },
    statement: {
        kind: "universal",
        variable: { name: "$x$", description: "$NN$" },
        statement: {
            kind: "universal",
            variable: { name: "$y$", description: "$NN$" },
            statement: {
                kind: "implication",
                antecedent: {
                    kind: "conjunction",
                    statements: [
                        "$n > 2$",
                        "$x^n + y^n = z^n$"
                    ]
                },
                consequent: "$x dot y dot z = 0$"
                }
            }
        }
    }
\`\`\`

In some cases, you may be required to output a statement that is relevant to the selections,
along with a general theorem statement that relates the two.

Include general library results only if the statement suggested is non-trivially related to the selections, 
or if you have been explicitly asked to include them, and omit them otherwise. 

For example, if the main selection is $ 5 divides a dot b $ and an auxilliary selection is $ 5 divides.not a $, 
a relevant suggestion could be $ 5 divides b $ along with the general theorem statement 
\`\`\`
{
    label: "divisibility_by_prime",
    statement: {
        kind: "universal", variable: { name: "p", description: "$NN$" }, statement: {
        kind: "universal", variable: { name: "a", description: "$NN$" }, statement: {
        kind: "universal", variable: { name: "b", description: "$NN$" }, statement: {
        kind: "implication", antecedent: { kind: "conjunction", statements: [
            "$p divides a dot b$",
            "$p$ is prime"
        ]}, consequent: {kind: "disjunction", statements: [
            "$p$ divides $a$",
            "$p$ divides $b$"
        ]}
}}}}}}
\`\`\`

Output up to 5 suggestions that could be relevant to the selections.
If there are fewer than 5 suggestions that could be relevant, return only those.
Ensure that there are no duplicate suggestions. 

Order the suggestions from most relevant to least relevant, where relevance is determined
by the relevance of the statement to the main selections, similarity to the additional selections, and simplicity.
`



export const suggestStatements = async(req: SuggestRequest) => {
    console.log('Generating suggestions with request', req)
    return await generateText({
        model: MODELS.suggest,
        system: SUGGEST_PROMPT,
        prompt: JSON.stringify(req, null, 2),
        output: Output.object({
            schema: SuggestResultsSchema
        }),
        maxRetries: 3
    })
}
