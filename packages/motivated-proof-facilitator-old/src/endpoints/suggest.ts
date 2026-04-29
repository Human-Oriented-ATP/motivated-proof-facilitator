import { generateText, Output } from "ai"
import { SuggestRequest, SuggestResultsSchema } from "../fetchers/suggest.js"
import { MODELS } from "./models.js"

export const SUGGEST_PROMPT = 
`
Your task is to suggest useful statements that fall within the "cluster" of statements related to the given selections, in the form of
- equivalent formulations
- strengthenings or sufficient conditions
- weakenings obtained through forward reasoning
- simplifications
- definitional unfoldings
- definitional refoldings (i.e., introducing a high-level concept that encapsulates part of the statement)
- descriptions of relevant mathematical objects,
or in other ways.

Main selections decide the location in the proof state where suggestions will be inserted. 
They can be thought of as the terms that suggestions can in principle replace.
Additional selections provide extra context to guide the suggestion generation, 
but are not meant to be modified by the suggestions.

Consult the list of variables to properly interpret the selections. Importantly, if a variable is not mentioned in the hypotheses or goals (but might still have a residual mention in the variable declarations), then it should not be involved in any suggestions.

Assume that the user has chosen a minimal collection of selections of interests and use **all** the main and additional selections to guide the generation of suggestions.
Selections may either be used as facts necessary to justify the suggestions, or as templates indicating the form that the suggestions or terms within them should take, or both.

Additionally, the more a suggestion deviates from the "cluster" of related statements around the main selections,
the more oriented it must be towards the additional selections, and the more terms it should have that are syntactically similar to 
ones in the additional selections.

Syntactic similarity means that the parse tree of the new statement matches better with that of one of the additional selections. The expression $a dot (b + c)$ matches the syntax tree of $a dot d$ better $a dot b + a dot c$, since the former has head symbol "dot" and left child $a$, just like $a dot d$, while the latter has head symbol "+".

For example, if the main selection is "$f$ is continuous" and a goal "$A$ is closed in $X$" is the additional selection, then the closed-sets formulation of "$f$ is continuous" would be a good suggestion.
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

It is also important to pay attention to the polarities of the statements involved. The "true" polarity is associated with statements that are hypothesis-like, and the "false" polarity is associated with statements that are goal-like. Replacing a statement in goal-like polarity with a stronger statement strengthens the overall statement, while replacing a statement in hypothesis-like polarity with a stronger statement weakens the overall statement. The polarity flips underneath a negation and in the antecedent of an implication, and stays the same otherwise. 

What makes the example above a particularly good suggestion is that the polarity of the conclusion "$f^(-1)(C)$ is closed in $X$" has hypothesis-like polarity, while the goal "$A$ is closed in $X$" has goal-like polarity, and creating syntactically similar statements of opposite polarity is good since it potentially allows them to be matched up.

Another example is if the main selection is the hypothesis "$U$ is open"
and the additional selection is the goal "$V$ is closed",  where $U$ is a free variable and $V$ is a meta variable, both of which represent subsets of a metric space $X$. The suggestion "$U^c$ is closed" would be preferred, since it matches quite closely with the additional selection of opposite polarity.

Note that since one of the variables is a meta variable, the parse tree resemblance is much stronger than if both variables had been free variables, since meta variables can take on any value to make the statements match up. Suggestions that create opportunities for matching up statements of opposite polarity with meta variables are particularly good, since they indicate a clear way to make progress.

As another example, if the main selection is a hypothesis $n is even$ and the additional selection is a goal $k divides n$, where $k$ is a meta variable, a good suggestion would be to introduce the hypothesis $2 divides n$, which is syntactically similar to the goal and equivalent to the hypothesis, and the syntactic similar is greatly strengthened by the fact that $k$ is a meta variable, making it possible to match the statements up in principle.

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

Suggestions deduced using all the information in the selected hypothesis-like statements should be preferred. For example, suppose the hypotheses $sin(theta) >= 0$ and $0 <= theta <= pi$ are the main selections, and the goal $x >= 0$ is the additional selection, $x$ is a real number that is a metavariable. Then the deduction $sin^2(theta) >= 0$ would be bad because it follows just from the type of $sin(theta)$. By contrast, $cos(theta) >= 0$ would be good because it genuinely uses the two hypotheses.
Another example. Let $G$ be a group and suppose we have selected the hypothesis "$H$ is a normal subgroup of $G$" as well as the variable $x$ (which is an element of $G$) hypothesis $y in H$. Then the deduction $y^(-1) in H$ would be perfectly valid, but would not be good because it wouldn't use the selected variable $x$ or the fact that $H$ is normal. By contrast, the deductions $x y x^(-1) in H$ and $x^(-1) y x in H$ would be good.

Favour strengthenings, weakenings and unfoldings that are *minimal*, in the sense of not going any further than they need to.
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
long and convoluted atomic statements. Avoid free form natural language phrases like "for every", "for all", "there exists", and "is not", preferring the logical connectives like { kind: "universal" | "existential" | "negation" ..., ... } etc. instead. This is because the structured statements are easier to parse and manipulate, and are more likely to be directly useful for the user in their proof development.

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

Suggestions are meant to be labelled as one of the following kinds:
- Standard consequences: 
    Statements that are direct consequences of the main selections, obtained by reasoning forwards from them.
    If the main selections have hypothesis-like ("true") polarity, one may use additional selections of hypothesis-like ("true") polarity as relevant facts to justify the suggestions, and additional selections of goal-like ("false") polarity as templates to guide the syntactic form of the suggestions. However, one should not use additional selections of goal-like polarity as relevant facts to justify the suggestions, since that would be logically dubious.
    The situation is reversed if the main selections have goal-like ("false") polarity: one may use additional selections of goal-like ("false") polarity as relevant facts to justify the suggestions, and additional selections of hypothesis-like ("true") polarity as templates to guide the syntactic form of the suggestions.
- Sufficient conditions: 
    Statements that imply the main selections in the proof state, obtained by reasoning backwards from them.
    One may use additional selections of the opposite polarity as templates to guide the syntactic form of the suggestions.
- Equivalent statements: 
    Statements that are mathematically equivalent to the main selections in the proof state. These can be obtained by 
    - simplifying the main selection 
    - unfolding the definitions within
    - refolding parts of the main selection into higher-level concepts
    - extensionality equivalences, for example, suggesting that two functions are equal iff they have the same values at all points, or that two sets are equal iff they have the same elements, or that two vectors are equal iff they have the same components.
- Constructions: Atomic statements representing mathematical objects associated with the main selections in the proof state. For example, If $phi$ is a homomorphism of groups, natural obejcts to associate with it would be its kernel and image, and if $g$ is an element of a group, natural statements to associate with it would be the order of $g$, the subgroup generated by $g$, and the inverse of $g$.

While equivalences are often preferable because they are 100% safe, it is also good to suggest strengthenings of goals and weakenings of hypotheses if 
(i) they are very naturally associated with the original statement, 
(ii) they have a better syntactic resemblance with a selected statement in the opposite position, and 
(iii) they are not massively stronger/weaker than the original statement. 
(A good sign of (iii) is that $Q$ is not massively stronger/weaker than $P$ if there isn't some other highly natural statement that fits strictly in between.)

The output is also expected to contain a clear and concise explanation of why the suggestion is relevant to the selections and how it relates to them. 
For example, if the suggestion is derived from some selected hypotheses, then the reasoning trace should contain a proof that it follows from those hypotheses. Since only simple and standard consequences are expected, this proof would normally be short. If some selections are used as templates for the suggestion, the syntactic relationship between those selections and the suggestion should be explained briefly in the reasoning.

Please keep the suggestions simple, precise, structured, direct and relevant, avoiding wordy phrasing.

Output up to 10 suggestions that could be relevant to the selections.
If there are fewer than 10 suggestions that could be relevant, return only those.
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
