# VRPRDL Solver

A full-stack academic optimization workbench implementing the **Vehicle Routing Problem with Roaming Delivery Locations (VRPRDL)** using Tabu Search metaheuristics and Dynamic Programming. Based on the paper: *Reyes, Savelsbergh & Toriello (2017), Transportation Research Part C 80, 71–91.*

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/vrprdl-solver run dev` — run the frontend (port 22575)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: None (in-memory job store — academic demo)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, wouter

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation
- `artifacts/api-server/src/lib/vrprdl/` — all algorithm implementations:
  - `types.ts` — shared TypeScript types
  - `generator.ts` — general & realistic VRPRDL instance generators (ported from Python data1.py)
  - `dp.ts` — Algorithm 3: DP cost calculation
  - `neighborhood.ts` — Algorithm 1: Swap, Insert, 2-opt operators
  - `tabu.ts` — Algorithm 2: Tabu Search
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/vrprdl-solver/src/` — React frontend
- `attached_assets/` — flowchart images and original project documents

## Architecture decisions

- **In-memory job store**: No database needed — solver runs are ephemeral for academic demonstration. Jobs stored in a `Map<string, SolverJob>` in the Express process.
- **Synchronous solver execution**: For small instances (≤60 customers), the solver completes within the HTTP request timeout. Jobs are returned immediately with full results.
- **Discretised DP time grid**: The continuous time axis is discretised into 50 steps to make the DP tractable. This balances accuracy vs. performance.
- **Algorithm 1 generates full neighbourhood**: All three operators (swap, insert, 2-opt) are applied exhaustively at each iteration, consistent with the pseudocode in the paper.
- **TypeScript port of Python data1.py**: The seeded random number generator uses a linear congruential generator to reproduce deterministic instances, mirroring Python's behaviour.

## Product

- **Instance Builder** (`/`): Generate general or realistic VRPRDL instances with configurable parameters. Visualizes customers and roaming locations on a 2D SVG map.
- **Solver Dashboard** (`/solver`): Run Tabu Search with configurable maxIter, tabuTenure, maxNoImprove. Shows convergence chart (Recharts), best cost, improvement %, runtime, and previous jobs.
- **Results View** (`/results`): Shows optimal delivery route on SVG map with arrows, delivery assignments table, and stats summary.
- **Algorithm Reference** (`/algorithms`): Academic documentation with all 5 flowchart images and pseudocode steps from the paper.

## API Endpoints

- `POST /api/instances/generate` — generate a VRPRDL instance
- `POST /api/solver/run` — run Tabu Search and return result
- `GET /api/solver/result/:jobId` — get job result by ID
- `GET /api/solver/jobs` — list all solver jobs
- `GET /api/algorithms/info` — get algorithm descriptions

## Algorithms Implemented

1. **Algorithm 1 — Generate Neighbourhood**: Three move operators (Swap, Insert, 2-opt)
2. **Algorithm 2 — Tabu Search**: Metaheuristic with tabu list, aspiration criterion, diversification (random jump)
3. **Algorithm 3 — DP_CalculateCost**: Dynamic programming for optimal location & time assignment given a fixed customer sequence

## User preferences

- Open source only
- All algorithms implemented from scratch based on attached pseudocode and flowcharts
- No external data used — only attached requirements

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any changes to `lib/api-spec/openapi.yaml`
- The DP time discretisation (50 steps) means results are approximate; increasing `TIME_STEPS` in `dp.ts` improves accuracy at the cost of performance
- Large instances (>30 customers) with many Tabu Search iterations may be slow — reduce `maxIter` for faster demos

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Flowchart images are in `attached_assets/` — imported via `@assets/` alias in Vite
