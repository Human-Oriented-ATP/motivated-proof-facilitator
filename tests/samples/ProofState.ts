import { ProofState } from "../../src/core/ProofStateZod";

export const sampleProofStates: { description: string; proofState: ProofState }[] = [
    {
        description: "Every finite group G of order greater than 2 admits a non-trivial automorphism.",
        proofState: [
            {
                variables: [{ name: "$G$", kind: "free", description: "Group" }],
                hypotheses: [{ 
                    label: "hyp_G_order_geq_2", 
                    statement: "$G$ has order greater than $2$" 
                }],
                goals: [{ 
                    label: "admits_nontrivial_aut",
                    statement: { 
                        kind: "existential", 
                        variable: { name: "$phi$", description: "$G arrow.r G$" }, 
                        statement: { kind: "conjunction", statements: ["$phi$ is an automorphism of $G$", "$phi$ is not the identity map"] }
                    }
                }]
            }
        ]
    },
    {
        description: "Let X be an infinite-dimensional Banach space that is isomorphic to all its closed infinite-dimensional subspaces. Then X is isomorphic to $ell_2$.",
        proofState: [
        {
            variables: [{ name: "$X$",kind: "free", description: "Banach space" }],
            hypotheses: [
                { 
                    label: "hyp_X_inf_dim", 
                    statement: "$X$ is infinite dimensional" 
                },
                { 
                    label: "hyp_closed_inf_dim_subspace_iso", 
                    statement: {
                        kind: "universal",
                        variable: { name: "$Y$", description: "subspace of $X$" },
                        statement: { 
                            kind: "implication",
                            antecedent: { kind: "conjunction", statements: ["$Y$ is closed", "$Y$ is infinite dimensional"] },
                            consequent: "$X tilde.eq Y$" 
                        }
                    }
                }
            ],
            goals: [{ 
                label: "X_iso_ell2", 
                statement: "$X tilde.eq ell_2$" 
            }]
        }
        ]
    },
    {
        description: "For every δ > 0 and every positive integer k there exists a positive integer N such that every subset of {1, 2, . . . , N} of size at least δN contains an arithmetic progression of length k.",
        proofState: [
            {
                variables: [
                    { name: "$delta$", kind: "free", description: "$RR_(gt.eq 0)$" },
                    { name: "$k$", kind: "free", description: "$NN$" }
                ],
                hypotheses: [],
                goals: [{
                    label: "exists_range_with_AP",
                    statement: {
                        kind: "existential",
                        variable: { name: "$N$", description: "$NN$" },
                        statement: {
                            kind: "universal",
                            variable: { name: "$A$", description: "subset of $\\{1, 2, dots, N\\}$" },
                            statement: {
                                kind: "implication",
                                antecedent: "$bar.v A bar.v gt.eq delta dot N$",
                                consequent: {
                                    kind: "existential",
                                    variable: { name: "$P$", description: "subset of $\\{1, 2, dots, N\\}$" },
                                    statement: {
                                        kind: "conjunction",
                                        statements: [
                                            "$P$ is an arithmetic progression",
                                            "$P$ is a subset of $A$",
                                            "$P$ has length $k$"
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }]
            }
        ]
    },
    {
        description: "Freiman homomorphisms map cosets of subgroups to cosets of subgroups.",
        proofState: [
            {
                variables: [
                    { name: "$G$", kind: "free", description: "Group" },
                    { name: "$H$", kind: "free", description: "Group" },
                    { name: "$X$", kind: "free", description: "Subgroup of $G$"},
                    { name: "$Y$", kind: "free", description: "Subset of $G$"},
                    { name: "$phi$", kind: "free", description: "$G arrow.r H$" }
                ],
                hypotheses: [
                    { 
                        label: "hyp_Y_coset_X", 
                        statement: "$Y$ is a coset of $X$" 
                    },
                    { 
                        label: "hyp_ɸ_Frieman", 
                        statement: "$phi$ is a Frieman homomorphism" 
                    }
                ],
                goals: [{
                    label: "img_phi_coset",
                    statement: {
                        kind: "existential",
                        variable: { name: "$Z$", description: "subgroup of $H$" },
                        statement: "$phi(Y)$ is a coset of $Z$"
                    }
                }]
            }
        ]
    },
    {
        description: "The rank of a free product of two finitely-generated groups is the sum of the ranks of the free factors.",
        proofState: [
            {
                variables: [
                    { name: "$A$", kind: "free", description: "Group" },
                    { name: "$B$", kind: "free", description: "Group" }
                ],
                hypotheses: [
                    { 
                        label: "hyp_A_finitely_generated", 
                        statement: "$A$ is finitely generated" 
                    },
                    { 
                        label: "hyp_B_finitely_generated", 
                        statement: "$B$ is finitely generated" 
                    }
                ],
                goals: [{
                    label: "rank_free_product",
                    statement: "$upright(\"rank\")(A ast B) = upright(\"rank\")(A) + upright(\"rank\")(B)$"
                }]
            }
        ]
    },
    {
        description: "Given two positive numbers which are coprime to each other, find the largest number that cannot be expressed as a non-negative integer combination of the two.",
        proofState: [
            {
                variables: [
                    { name: "$a$", kind: "free", description: "$NN$" },
                    { name: "$b$", kind: "free", description: "$NN$" },
                    { name: "$N$", kind: "meta", description: "$NN$" }
                ],
                hypotheses: [
                    { 
                        label: "hyp_a_b_coprime", 
                        statement: "$gcd(a, b) = 1$" 
                    }
                ],
                goals: [{
                    label: "largest_nonrepresentable",
                    statement: {
                        kind: "conjunction",
                        statements: [
                            {
                                kind: "negation",
                                statement: {
                                    kind: "existential",
                                    variable: { name: "$x$", description: "$NN$" },
                                    statement: {
                                        kind: "existential",
                                        variable: { name: "$y$", description: "$NN$" },
                                        statement: "$N = a x + b y$"
                                    }
                                }
                            },
                            {
                                kind: "universal",
                                variable: { name: "$M$", description: "$NN$" },
                                statement: {
                                    kind: "implication",
                                    antecedent: "$M > N$",
                                    consequent: {
                                        kind: "existential",
                                        variable: { name: "$x$", description: "$NN$" },
                                        statement: {
                                            kind: "existential",
                                            variable: { name: "$y$", description: "$NN$" },
                                            statement: "$M = a x + b y$"
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }]
            }
        ]
    },
    {
        description: "Let $psi(M)$ be the number of powers of $2$ from $1$ to $2^M$ which begin with the digit $1$ in the usual decimal representation. Find the limiting value of $(psi(M))/(M)$ as $M$ grows very large.",
        proofState: [
            {
                variables: [
                    { name: "$psi$", kind: "let", description: "$NN arrow.r NN$", value: "$M$ $arrow.r.bar$ the number of powers of $2$ from $1$ to $2^M$ which begin with the digit $1$ in the usual decimal representation" },
                    { name: "$L$", kind: "meta", description: "$RR$" }
                ],
                hypotheses: [],
                goals: [{
                    label: "limiting_value",
                    statement: "$L = lim_(M arrow.r infinity) (psi(M))/(M)$"
                }]
            }
        ]               
    },  
    {
        description: "Whenever an infinite number of points in the plane all have integer distances, the points lie on a straight line.",
        proofState: [
            {
                variables: [
                    { name: "$S$", kind: "free", description: "Subset of $RR^2$" }
                ],
                hypotheses: [
                    { 
                        label: "hyp_S_infinite", 
                        statement: "$S$ is infinite" 
                    },
                    { 
                        label: "hyp_integer_distances", 
                        statement: { kind: "universal", variable: { name: "$P$", description: "element of $S$" }, 
                            statement: { kind: "universal", variable: { name: "$Q$", description: "element of $S$" },
                            statement: "the distance between $P$ and $Q$ is an integer" } }
                    }
                ],
                goals: [{
                    label: "points_on_line",
                    statement: { kind: "existential", variable: { name: "$L$", description: "line in $RR^2$" }, statement: "$S$ is a subset of $L$" }
                }]
            }
        ]
    },
    {
        description: "There are infinitely many prime numbers $p$ such that $p + 2$ is also prime.",
        proofState: [
            {
                variables: [],
                hypotheses: [],
                goals: [{
                    label: "infinitely_many_twin_primes",
                    statement: {
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
                }]
            }
        ]
    },
    {
        description: "Every subgroup of a free group is free.",
        proofState: [
            {
                variables: [
                    { name: "$G$", kind: "free", description: "Group" },
                    { name: "$H$", kind: "free", description: "Subgroup of $G$" }
                ],
                hypotheses: [
                    { 
                        label: "hyp_G_free", 
                        statement: "$G$ is a free group" 
                    }
                ],
                goals: [{
                    label: "H_free",
                    statement: "$H$ is a free group"
                }]
            }
        ]
    }
]