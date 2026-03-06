# A natural language point-and-click interface for motivated proofs

A work-in-progress prototype of a natural-language-based point-and-click interface for generating proofs. For the broader context and motivation of this project, see the blog post https://gowers.wordpress.com/2025/09/22/creating-a-database-of-motivated-proofs/.

# Docker setup

## Install Docker

If you're on macOS or Windows, install the [Docker Desktop](https://docs.docker.com/desktop/) application. On macOS, you can do this either by downloading a `.dmg` file from the Docker website, or by using [Homebrew](https://brew.sh/):

```bash
brew install --cask docker
```

If you're using Linux, you don't need the desktop app, and you're likely fine installing Docker from your package manager.

## Build and run the project

To run the project using Docker for development:

1. **Build the image:**

   ```bash
   docker compose build
   ```

1. **Start the app service:**

   ```bash
   docker compose up
   ```

1. **Access the application:**
   Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

The development setup includes volume mounts for `src`, `tests`, and other configuration files, enabling hot reloading of changes made on your host machine. (That is, you can make changes to the source code and they'll be reflected in the running app without having to rebuild the image.)

# Backend and LLM integration

The frontend communicates with a backend server hosted at `https://atp-backend-rygt.onrender.com`. The backend accepts JSON over HTTP and forwards requests to an LLM (currently Claude) to perform the language-level reasoning that the proof assistant requires.

## API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/formalize` | POST | Convert a natural-language problem description into a structured proof state |
| `/formalize-statement` | POST | Convert a natural-language statement (e.g. a library lemma) into a structured statement |
| `/informalize` | POST | Convert a structured proof state back into natural language |
| `/move` | POST | Apply a proof move (described in natural language or as a `ProofDiscoveryMove` JSON object) to a proof state and return the new proof state |
| `/filter` | POST | Given a proof state, a set of user selections, and a trigger criterion, decide whether a particular proof move is applicable |

## Where each endpoint is called

- **`/formalize`** — `tests/Formalizer.tsx` (`handleFormalize`) and `tests/MoveGenerator.tsx` (`handleFormalize`)
- **`/formalize-statement`** — `tests/MoveGenerator.tsx` (`handleFormalize`, when a library statement is provided)
- **`/informalize`** — `src/components/ProofDiscoveryEnvironment.tsx` (`handleInformalize`) and `tests/Formalizer.tsx` (`handleInformalize`)
- **`/move`** — `src/components/MovePanel.tsx` (`applyMove`), `tests/Formalizer.tsx` (`handleApplyMove`), and `tests/MoveGenerator.tsx` (`handleApplyMove`)
- **`/filter`** — `src/components/MovePanel.tsx` (`checkMoveValidity`), which is called once per registered `ProofDiscoveryMove` every time the user changes their selection in the proof state

## Request flow for move suggestions

The main interactive flow that drives the proof assistant is as follows:

1. The user clicks or selects a sub-expression in the current proof state in their browser.
2. `MovePanel` (src/components/MovePanel.tsx) calls `getApplicableMoves`, which sends one `/filter` request to the backend **per registered move** (defined under `src/prompts/`), concurrently via `Promise.all`.
3. Each `/filter` response contains `{ meetsCondition: boolean, reasoning: string }`. Only moves where `meetsCondition` is `true` are shown to the user.
4. When the user clicks a move, `applyMove` sends a single `/move` request containing the current proof state, the full `ProofDiscoveryMove` definition (including its few-shot examples), and the user's selections.
5. The backend forwards the assembled prompt to the LLM and returns the new proof state, which is then validated with Zod and added to the proof discovery graph.

## Prompt structure

Each `ProofDiscoveryMove` (defined in `src/prompts/*.ts` and typed in `src/core/ProofDiscoveryMove.ts`) contains:

- `trigger` — a natural-language description of when the move is applicable (used by `/filter`)
- `action` — a natural-language description of how the move transforms the proof state (used by `/move`)
- `examples` — few-shot examples of the move in action, each with an input state, selections, and output state

The backend assembles these fields into a prompt together with the current proof state and user selections before calling the LLM.

# Contributors

- Anand Rao Tadipatri
- Thomas Thevenon
- Leo Hentschker
- Matthew Tucker-Simmons
