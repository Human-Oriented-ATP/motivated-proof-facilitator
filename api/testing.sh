#!/bin/bash

# Backend Testing Script for ATP Math Backend
# Base URL: http://localhost:3000

BASE_URL="http://localhost:3000"

echo "Testing ATP Math Backend..."
echo "=========================="

# Test 1: Formalize a mathematical problem
echo -e "\n1. Testing /formalize endpoint:"
curl -X POST "$BASE_URL/formalize" \
  -H "Content-Type: application/json" \
  -d '{"problem": "If G is a group where x -> x inverse is an automorphism then G is abelian"}'

# Test 2: Formalize the example problem
echo -e "\n\n2. Testing /formalize-example endpoint:"
curl -X POST "$BASE_URL/formalize-example" \
  -H "Content-Type: application/json"

# Test 3: Solve a problem
echo -e "\n\n3. Testing /solve endpoint:"
curl -X POST "$BASE_URL/solve" \
  -H "Content-Type: application/json" \
  -d '{"problem": "Prove that the sum of two even numbers is even"}'

# Test 4: Get suggestions
echo -e "\n\n4. Testing /suggest endpoint:"
curl -X POST "$BASE_URL/suggest" \
  -H "Content-Type: application/json" \
  -d '{"problem": "Show that if f is continuous and g is continuous then f + g is continuous"}'

# Test 5: Apply a move to a proof state
echo -e "\n\n5. Testing /move endpoint:"
curl -X POST "$BASE_URL/move" \
  -H "Content-Type: application/json" \
  -d '{
    "proofState": {
      "goals": [{"target": "P → Q"}],
      "hypotheses": [],
      "context": []
    },
    "move": "assume P"
  }'

# Test 6: Informalize a proof state
echo -e "\n\n6. Testing /informalize endpoint:"
curl -X POST "$BASE_URL/informalize" \
  -H "Content-Type: application/json" \
  -d '{
    "proofState": {
      "goals": [{"target": "P → Q"}],
      "hypotheses": [{"name": "h1", "statement": "P"}],
      "context": []
    }
  }'

# Test 7: Formalize a statement with context
echo -e "\n\n7. Testing /formalize-statement endpoint:"
curl -X POST "$BASE_URL/formalize-statement" \
  -H "Content-Type: application/json" \
  -d '{
    "statement": "x is even",
    "context": {
      "goals": [],
      "hypotheses": [{"name": "h1", "statement": "x : ℕ"}],
      "context": []
    }
  }'

# Test 8: Logical Strengthening
echo -e "\n\n8. Testing /logical-strengthening endpoint:"
curl -X POST "$BASE_URL/logical-strengthening" \
  -H "Content-Type: application/json" \
  -d '{"problem": "Every closed bounded subset of R^2 is compact"}'

# Test 9: Logical Weakening
echo -e "\n\n9. Testing /logical-weakening endpoint:"
curl -X POST "$BASE_URL/logical-weakening" \
  -H "Content-Type: application/json" \
  -d '{"problem": "Every continuous function from R to R has the intermediate value property"}'

# Test 10: Instantiation with Simplest Examples
echo -e "\n\n10. Testing /instantiation-simplest endpoint:"
curl -X POST "$BASE_URL/instantiation-simplest" \
  -H "Content-Type: application/json" \
  -d '{"problem": "There exists a prime number greater than 2"}'

# Test 11: Extrapolation
echo -e "\n\n11. Testing /extrapolation endpoint:"
curl -X POST "$BASE_URL/extrapolation" \
  -H "Content-Type: application/json" \
  -d '{"problem": "I computed f(1)=1, f(2)=2, f(3)=5, f(4)=14, f(5)=42. What is the pattern?"}'

# Test 12: Library Extraction
echo -e "\n\n12. Testing /library-extraction endpoint:"
curl -X POST "$BASE_URL/library-extraction" \
  -H "Content-Type: application/json" \
  -d '{"problem": "Prove that every finite group has order equal to the sum of degrees of its irreducible characters"}'

# Test 13: Type Generalization
echo -e "\n\n13. Testing /type-generalization endpoint:"
curl -X POST "$BASE_URL/type-generalization" \
  -H "Content-Type: application/json" \
  -d '{"problem": "Every polynomial over the real numbers has the intermediate value property"}'

# Test 14: Term Abstraction
echo -e "\n\n14. Testing /term-abstraction endpoint:"
curl -X POST "$BASE_URL/term-abstraction" \
  -H "Content-Type: application/json" \
  -d '{"problem": "For real numbers x and y, prove that x^2 + y^2 ≥ 0"}'

# Test 15: Trigger endpoint
echo -e "\n\n15. Testing /trigger endpoint:"
curl -X POST "$BASE_URL/trigger" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": [
      {
        "name": "x",
        "description": "$x in RR$",
        "kind": "free"
      }
    ],
    "hypotheses": [
      {
        "label": "h1",
        "statement": "$x > 5$"
      }
    ],
    "goals": [
      {
        "label": "g1",
        "statement": "$x^2 > 25$"
      }
    ]
  }'

# Test 16: Filter endpoint
echo -e "\n\n16. Testing /filter endpoint:"
curl -X POST "$BASE_URL/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "proofState": {
      "variables": [
        {
          "name": "x",
          "description": "$x in RR$",
          "kind": "free"
        }
      ],
      "hypotheses": [
        {
          "label": "h1",
          "statement": "$x > 5$"
        }
      ],
      "goals": [
        {
          "label": "g1",
          "statement": "$x^2 > 25$"
        }
      ]
    },
    "selections": ["x > 5", "x^2 > 25"],
    "triggerCriterion": "contains inequality involving square"
  }'

# Test 17: Library Suggest endpoint
echo -e "\n\n17. Testing /library-suggest endpoint:"
curl -X POST "$BASE_URL/library-suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "proofState": {
      "variables": [
        {
          "name": "G",
          "description": "group",
          "kind": "free"
        }
      ],
      "hypotheses": [
        {
          "label": "G_is_group",
          "statement": "G is a group"
        }
      ],
      "goals": [
        {
          "label": "prove_abelian",
          "statement": "G is abelian"
        }
      ]
    },
    "selections": {
      "type": "goal",
      "id": "prove_abelian"
    },
    "moveDescription": "I want to show this group is abelian using library results"
  }'

echo -e "\n\nTesting complete!"